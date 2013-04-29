l.post = {};

init.add(function () {

	// Thread

	l.post.initThreadPage = function () {

		return;

		var $posts = $content.find('.posts');

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

})



init.add(function() {

	// New Thread

	var $form,
		$category,
		$writer,
		$title,
		$text,
		$send,
		$sending;

	l.post.initNewThread = function () {
		$form = $('#new-thread');
		$category = $form.find('[name=category]');
		$writer = $form.find('[name=writer]');
		$title = $form.find('[name=title]');
		$text = $form.find('[name=text]');
		$send = $form.find('[name=send]');
		$sending = $form.find('[name=sending]');

		$writer.val(l.post.savedWriter());
		if ($writer.val()) {
			$title.focus();
		} else {
			$writer.focus();
		}
		$send.click(sendForm);
	}

	function sendForm() {
		var post = {
			categoryId: $category.val(),
			writer: $writer.val(),
			title: $title.val(),
			text: $text.val()
		}
		l.form.clearAlert($content);
		showSending();
		request.post('/api/threads').send(post).end(function (err, res) {
			showSend();
			if (err) {
				errorDialog.system(err);
			} else if (res.body.rc === rc.INVALID_DATA) {
				_.each(res.body.error, function (error, field) {
					_.each(error, function (error) {
						l.form.addAlert($form.find('[name="' + field + '"]'), error);
					});
				})
			} else if (res.body.rc !== rc.SUCCESS) {
				l.unhandledError(res.body.rc)
			} else {
				l.post.saveWriter(post.writer);
				location = '/thread/' + res.body.threadId;
			}
		});

		return false;
	}

	function showSend() {
		$send.removeClass('hide');
		$sending.addClass('hide');
	}

	function showSending() {
		$send.addClass('hide');
		$sending.removeClass('hide');
	}

	l.post.saveWriter = function (writer) {
		localStorage.setItem('writer', writer);
	}

	l.post.savedWriter = function () {
		return localStorage.getItem('writer') || '';
	}

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