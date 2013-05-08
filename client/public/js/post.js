
init.add(function () {

	// Threads

	window.post = {};

	post.initThreadAndPosts = function () {

		return;

		var $posts = $('#posts');

		//var imgFile = /.*\.(jpg|jpeg|gif|png)$/i;

		var lineEnd = /(\r\n|\n|\r)/g;
		var imgUrl = /(^|[^"'=])(https?:\/\/[^ "'<>\n\r\)]+\.(jpg|jpeg|gif|png))[\n ]/ig;
		var simpleUrl = /(^|[^"'=])(https?:\/\/[^ "'<>\n\r\)]+)/g;
		var imgTag = /(&lt;img\s.+?&gt;)/gi;
		var aTag = /(&lt;a\s.+?(\/a|\s\/)&gt;)/gim;
		var objectTag = /(&lt;object.+?\/object&gt;)/gim;
		// object tag 안에 있는 embed 를 피하기 위해 임시로 ^ 를 검색 수식 앞에 삽입.
		var embedTag = /^((?:&lt;embed.+?&gt;|&lt;\/embed&gt;)+)/gim;

		$posts.find('.post .text').each(function () {

		});

		return;

		// ).replace(lineEnd, '<br>')
//		.replace(imgUrl, '$1<span class="media-img"><a href="$2" target="_blank">$2</a></span>')
//			.replace(simpleUrl, '$1<a href="$2" target="_blank">$2</a>')
//			.replace(imgTag, '<span class="media">$1</span>')
//			.replace(aTag, '<span class="media-a">$1</span>')
//			.replace(objectTag, '<span class="media">$1</span>')
//			.replace(embedTag, '<span class="media">$1</span>')

		$posts.find('.media-img').after(
			$('<span class="media-handle">Show</span>').click(function () {
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
		$posts.find('.media-a').after(
			$('<span class="media-handle">Show</span>').click(function () {
				var $handle = $(this);
				var $ipt = $handle.prev();
				window.open($($ipt.text()).attr("href"), "_blank");
			})
		);
		$posts.find('.media').after(
			$('<span class="media-handle">Show</span>').click(function () {
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

});

init.add(function() {
	var $form = $('#reply-form');
	var $writer = $form.find('[name=writer]');
	var $send = $form.find('[name=send]');
	var $sending = $form.find('[name=sending]');

	post.initReplyForm = function () {
		$writer.val(post.savedWriter());
		$form.ajaxForm({
			dataType: 'json',
			beforeSend: function () {
				alerts.clear($form);
				$send.addClass('hide');
				$sending.removeClass('hide');
			},
			success: function (body) {
				var err = body.err;
				if (err && err.rc === error.INVALID_DATA) {
					for (var i = 0; i < err.fields.length; i++) {
						var field = err.fields[i];
						alerts.add($form.find('[name="' + field.name + '"]'), field.msg);
					}
					return;
				}
				if (err) {
					showError.system(body.err);
					return;
				}
				post.saveWriter($writer.val());
				location = '/threads/' + body.tid;
			},
			error: function (xhr, textStatus, errorThrown) {
				var message = textStatus || errorThrown || 'Unknown Error';
				showError.system({ message: message });
			},
			complete: function () {
				$send.removeClass('hide');
				$sending.addClass('hide');
			}
		});
	};
});

init.add(function() {
	var $form = $('#new-form');
	var $category = $form.find('[name=category]');
	var $writer = $form.find('[name=writer]');
	var $title = $form.find('[name=title]');
	var $send = $form.find('[name=send]');
	var $sending = $form.find('[name=sending]');

	post.initNewForm = function () {
		if (query.c) {
			$category.val(query.c);
		}
		$writer.val(post.savedWriter());
		if ($writer.val()) {
			$title.focus();
		} else {
			$writer.focus();
		}
		$form.ajaxForm({
			dataType: 'json',
			beforeSend: function () {
				alerts.clear($form);
				$send.addClass('hide');
				$sending.removeClass('hide');
			},
			success: function (body) {
				var err = body.err;
				if (err && err.rc === error.INVALID_DATA) {
					for (var i = 0; i < err.fields.length; i++) {
						var field = err.fields[i];
						alerts.add($form.find('[name="' + field.name + '"]'), field.msg);
					}
					return;
				}
				if (err) {
					showError.system(body.err);
					return;
				}
				post.saveWriter($writer.val());
				location = '/threads/' + body.tid;
			},
			error: function (xhr, textStatus, errorThrown) {
				var message = textStatus || errorThrown || 'Unknown Error';
				showError.system({ message: message });
			},
			complete: function () {
				$send.removeClass('hide');
				$sending.addClass('hide');
			}
		});
	};

	post.saveWriter = function (writer) {
		localStorage.setItem('writer', writer);
	}

	post.savedWriter = function () {
		return localStorage.getItem('writer') || '';
	}

});

init.add(function() {


	// TODO: 파일 첨부

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