l.post = {};

l.init.init(function () {

	// thread list

	var template;
	var regOpt;
	var ended;
	var $spinHolder;

	l.post.initThreadListPage = function () {
		console.log('thread list,');
		l.session.authorized(function () {

			var categoryId = l.defInt(l.query, 'c', 0);

			l.category.update(categoryId);

			regOpt = {
				c: categoryId,
				limit: 48
			};

			template = dust.compileFn($('#template').html());

			$spinHolder = $('#spin-holder', l.$content);

			l.$window.scroll(function () {
				var scrollTop = l.$window.scrollTop();
				var scrollBottom = l.$window.scrollTop() + l.$window.height();
				var spinnerTop = $spinHolder.offset().top;
				if (spinnerTop > scrollTop && spinnerTop < scrollBottom && !l.spinner.el) {
					sendRequest();
				}
			});

//			if (!l.$content.find('#thread-list').html()) {
//				console.log('sending');
//				sendRequest();
//			}
			$('#load').click(function () {
				sendRequest();
			})
		});
	}

	function sendRequest() {
		if (ended) {
			//
		} else {
			l.spinner.spin();
			$spinHolder.append(l.spinner.el);
			request.get('/api/thread').send(regOpt).endEx(function (err, res) {
				console.log('get /api/thread, response status: ' + res.status);
				if (err) {
					l.spinner.stop();
					l.systemModalError(err);
				} else if (res.body.rc == l.rc.NOT_AUTHENTICATED) {
					// 장시간 자리를 비웠다가 화면을 스크롤하면 인증 오류가 발생할 수 있다.
					l.session.revive(function () {
						l.spinner.stop();
						sendRequest();
					});
				} else if (res.body.rc != l.rc.SUCCESS) {
					l.spinner.stop();
					l.systemModalError(l.rcMsg[res.body.rc]);
				} else {
					l.spinner.stop();
					if (!res.body.thread.length) {
						ended = true;
					} else {
						render(res.body.thread);
					}
				}
			});
		}
	}

	function render(thread, next) {
		_.each(thread, function (thread) {
			thread.categoryName = l.session.role.category[thread.categoryId].name;
			if (thread.length > 1) {
				thread.reply = thread.length - 1;
			}
			thread.updatedStr = new Date(thread.updated).format('yyyy-MM-dd HH:mm');
			regOpt.updated = thread.updated;
		});
		template({ thread: thread }, function (err, out) {
			l.$content.find('#thread-list').append(out);
			if (l.$document.height() < l.$window.height() * 1.2) {
				sendRequest();
			}
		});
	}

});


l.init.init(function () {

	// thread

	var template;

	l.post.initThreadPage = function () {
		console.log('thread,');
		l.session.authorized(function () {
			var threadId = l.url.segment(1);

			template = dust.compileFn($('#template').html());

			request.get('/api/thread/' + threadId).endEx(function (err, res) {
				console.log('get /api/thread/' + threadId + ', response status: ' + res.status);
				if (err) {
					l.systemModalError(err);
				} else if (res.body.rc != l.rc.SUCCESS) {
					l.systemModalError(l.rcMsg[res.body.rc]);
				} else {
					render(res.body.thread, res.body.post);
				}
			});
		});
	}

	var imgExp = /.*\.(jpg|jpeg|gif|png)$/i;

	// ipt: in-post-tag

	function render(thread, post) {
		l.category.update(thread.categoryId);

		_.each(post, function (post) {
			post.createdStr = new Date(post.created).format('yyyy-MM-dd HH:mm');

			post.text =
				_.escape(post.text)
					.replace(/(\r\n|\n|\r)/g, '<br>')
					.replace(/([^"'=]|^)(https?:\/\/[^ "'<>\n\r\)]+\.(jpg|jpeg|gif|png))[\n ]/ig, '$1<span class="ipt-img"><a href="$2" target="_blank">$2</a></span>')
					.replace(/([^"'=]|^)(https?:\/\/[^ "'<>\n\r\)]+)/g, '$1<a href="$2" target="_blank">$2</a>')
					.replace(/(&lt;img\s.+?&gt;)/gi, '<span class="ipt">$1</span>')
					.replace(/(&lt;a\s.+?(\/a|\s\/)&gt;)/gim, '<span class="ipt-a">$1</span>')
					.replace(/(&lt;object.+?\/object&gt;)/gim, '<span class="ipt">$1</span>')
					.replace(/(?:^|<PRE>)((?:&lt;embed.+?&gt;|&lt;\/embed&gt;)+)/gim, '<span class="ipt">$1</span>')
			;

			if (post.upload) {
				_.each(post.upload, function (upload) {
					upload.img = imgExp.test(upload.name)
				});
			}
		});

		template({ thread: thread, post: post }, function (err, out) {
			l.$content.find('#thread').html(out);
		});
		return;

		// TODO: ipt 처리

		var $posts = l.$content.find('.posts');
		$posts.append(tag.toString());
		$posts.find('.ipt-img').after(
			$('<span class="ipt-handle">Show</span>').click(function () {
				var $handle = $(this);
				var $ipt = $handle.prev();
				if ($handle.text() === 'Show') {
					$handle.after(
						$('<div class="img"></div>').append(
							$('img').attr('src', $ipt.children('a').attr('href')).error(function() {
								var $this = $(this);
								window.open($this.attr('src'), '_blank');
								$this.parent().remove();
								$handle.data('rendered', false);
								$handle.text('Show');
							})
						)
					);
					$handle.text('Hide');
				} else {
					$handle.next().remove();
					$handle.text('Show');
				}
			})
		);
		$posts.find('.ipt-a').after(
			$('<span class="ipt-handle">Show</span>').click(function () {
				var $handle = $(this);
				var $ipt = $handle.prev();
				window.open($($ipt.text()).attr("href"), "_blank");
			})
		);
		$posts.find('.ipt').after(
			$('<span class="ipt-handle">Show</span>').click(function () {
				var $handle = $(this);
				var $ipt = $handle.prev();
				if ($handle.text() === 'Show') {
					$handle.data("orgCode", $ipt.text());
					$ipt.html($ipt.text());
					$handle.text('Hide');
				} else {
					$ipt.text($handle.data("orgCode"));
					$handle.text('Show');
				}
			})
		);
	}

	//function initPostViewScroller(lastVisit) {
//	var target = null;
//	$(".posts .created").each(function(i) {
//		if (this.innerHTML > lastVisit) {
//			target = this;
//			return false;
//		}
//	})
//	if (target) $(target).attachScroller()
//}

})



//l.setThreadListPage = function (params) {
//}
//
//l.setThreadPage = function () {
//	console.log('thread page')
//}
//
//l.setNewThreadPage = function () {
//	console.log('new thread page')
//}
//
//l.setNewReplyPage = function () {
//	console.log('new reply page')
//}
//
//l.setEditPostPage = function () {
//	console.log('edit post page')
//}
//
//l.setCreatePostPage = function () {
//	var $content = l.$cached('#create-post-template').clone();
//	l.setContent($content);
//}
//


l.init.init(function() {

	// post form

//	var fileCount = 0;
//
//	function addFileInputTag() {
//		fileCount++;
//		$("#file").append("<input type=\"file\" name=\"file\" id=\"file" + fileCount + "\" class=\"file\" multiple=\"multiple\"/><br />");
//
//		if (fileCount >= 32) {
//			$("#addFile").parent("div").hide();
//		}
//	}
//
//	function initPostForm() {
//		addFileInputTag();
//		$("#addFile").click(function(event) {
//			event.preventDefault();
//			addFileInputTag();
//		});
//		$("#post\\.writer").attachScroller(function() {
//			var writer = $("#post\\.writer")[0];
//			if (writer.value.length) {
//				$("input[type=\"text\"][name!='post.writer'],textarea", writer.form)[0].focus();
//			} else {
//				writer.focus();
//			}
//		});
//		ping();
//	}

});