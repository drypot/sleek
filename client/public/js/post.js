
init.add(function () {

	// Threads

	window.post = {};

	post.initThreadList = function () {
		$('.threads .d').each(function () {
			var $tar = $(this).closest('tr').find('a')
			var udateStr = $(this).text();
			if (dt.isNew(udateStr)) {
				$tar.removeClass('text-muted');
			}
		});
	}

	post.initThreadAndPosts = function () {

		var patterns = [
			{	// iframe
				pattern: /(&lt;iframe.+?\/iframe&gt;)/gim,
				replace: '<span class="media">$1</span>'
			},
			{	// object
				pattern: /(&lt;object.+?\/object&gt;)/gim,
				replace: '<span class="media">$1</span>'
			},
			{	// embed
				pattern: /((?:&lt;embed.+?&gt;|&lt;\/embed&gt;)+)/gim,
				replace: '<span class="media">$1</span>'
			},
			{
				// img
				pattern: /(&lt;img\s.+?&gt;)/gi,
				replace: '<span class="media">$1</span>'
			},
			{	// img url
				pattern: /(https?:\/\/[^ "'<>\n\r\)]+\.(jpg|jpeg|gif|png))(?=[\n ])/ig,
				replace: '<span class="media-img"><a href="$1" target="_blank">$1</a></span>'
			},
			{	// url
				pattern: /(https?:\/\/[^ "'>)\n\r]+)/g,
				replace: '<a href="$1" target="_blank">$1</a>'
			}
		];

		var $1pat = /\$1/g;

		function tagUp(s, pi) {
			if (pi == patterns.length) {
				return s;
			}
			var p = patterns[pi];
			var r = '';
			var a = 0;
			var match;
			while(match = p.pattern.exec(s)) {
				r += tagUp(s.slice(a, match.index), pi + 1);
				r += p.replace.replace($1pat, match[1]);
				a = match.index + match[0].length;
			}
			r += tagUp(s.slice(a), pi + 1);
			return r;
		}

		function handle() {
			return $('<button class="media-handle btn btn-mini btn-info">Show</button>');
		}

		var $posts = $('#posts');

		$posts.find('.text pre').each(function () {
			$(this).html(tagUp($(this).html(), 0));
		});

		$posts.find('.media-img').after(
			handle().click(function () {
				var $handle = $(this);
				var $media = $handle.prev();
				if ($handle.text() === 'Show') {
					$handle.after(
						$('<div class="img"></div>').append(
							$('<img>', { src: $media.children('a').attr('href') })
						)
					);
					$handle.text('Hide');
				} else {
					$handle.next().remove();
					$handle.text('Show');
				}
			})
		);

		$posts.find('.media').after(
			handle().click(function () {
				var $handle = $(this);
				var $media = $handle.prev();
				if ($handle.text() === 'Show') {
					$handle.data("org-code", $media.text());
					$media.html($media.text());
					$handle.text('Hide');
				} else {
					$media.text($handle.data("org-code"));
					$handle.text('Show');
				}
			})
		);

		var $scrollTarget = (function () {
			var $target = null;
			$posts.find(".d").each(function() {
				var cdateStr = $(this).text();
				if (dt.isNew(cdateStr)) {
					$target = $(this);
					return false;
				}
			});
			return $target;
		})();

		if ($scrollTarget) {
			var ey = Math.round(Math.max($scrollTarget.offset().top - ($window.height() / 4), 0));
			$('body, html').animate({ scrollTop: ey }, 200);
		}
	};

	// for files

	jQuery.fn.faActivateAttachURL = function() {
		return $(this).each(function() {
			var url = $.trim($(this).text())
			var nameIndex = url.lastIndexOf("/")
			var baseURL = url.substring(0, nameIndex)
			var fileName = url.substring(nameIndex + 1)
			var encodedFileName = encodeURIComponent(fileName)
			$(this).html(
				/.*\.(jpg|jpeg|gif|png)$/i.test(fileName) ?
					'<span class="au-target auurl"><a href="' + baseURL + '/' + encodedFileName + '" target="_blank">' + fileName + '</a></span>'	 :
					'<a href="' + baseURL + '/' + encodedFileName + '" target="_blank">' + fileName + '</a>'
			).faAttachGo()
		})
	}

	function initInputFile() {
		var fileCount = 0;

		function addFileInputTag() {
			fileCount++;
			$("#file").append("<input type=\"file\" name=\"file\" id=\"file" + fileCount + "\" class=\"file\" multiple=\"multiple\"/><br />");

			if (fileCount >= 32) {
				$("#addFile").parent("div").hide();
			}
		}

		addFileInputTag();
		$("#addFile").click(function(event) {
			event.preventDefault();
			addFileInputTag();
		});
	}

	post.initNewForm = function () {
		var $form = $('#new-form');
		var $category = $form.find('[name=category]');
		var $writer = $form.find('[name=writer]');
		var $title = $form.find('[name=title]');
		var sender = new Sender($form);

		if (url.query.c) {
			$category.val(url.query.c);
		}
		restoreWriter($writer);
		if ($writer.val()) {
			$title.focus();
		} else {
			$writer.focus();
		}
		$form.ajaxForm({
			dataType: 'json',
			beforeSend: function () {
				alerts.clear($form);
				sender.beforeSend();
			},
			success: ajaxFormSuccess($form, function () {
				saveWriter($writer);
				location = '/threads';
			}),
			error: ajaxFormError,
			complete: sender.complete
		});
	};

	post.initReplyForm = function () {
		var $form = $('#reply-form');
		var $writer = $form.find('[name=writer]');
		var sender = new Sender($form);

		restoreWriter($writer);
		$form.ajaxForm({
			dataType: 'json',
			beforeSend: function () {
				alerts.clear($form);
				sender.beforeSend();
			},
			success: ajaxFormSuccess($form, function (body) {
				saveWriter($writer);
				location = '/threads/' + body.tid;
			}),
			error: ajaxFormError,
			complete: sender.complete
		});
	};

	post.initEditForm = function () {
		var $form = $('#edit-form');
		var sender = new Sender($form);

		$form.ajaxForm({
			dataType: 'json',
			beforeSend: function () {
				alerts.clear($form);
				sender.beforeSend();
			},
			success: ajaxFormSuccess($form, function () {
				location = '/threads/' + url.pathnames[1];
			}),
			error: ajaxFormError,
			complete: sender.complete
		});
	};

	function saveWriter($writer) {
		localStorage.setItem('writer', $writer.val());
	}

	function restoreWriter($writer) {
		$writer.val(localStorage.getItem('writer') || '');
	}

	function ajaxFormSuccess($form, next) {
		return function (body) {
			var err = body.err;
			if (err && err.rc === error.INVALID_DATA) {
				alerts.fill($form, err.fields);
				return;
			}
			if (err) {
				showError.system(body.err);
				return;
			}
			next(body);
		};
	}

	function ajaxFormError(xhr, textStatus, errorThrown) {
		var message = textStatus || errorThrown || 'Unknown Error';
		showError.system({ message: message });
	}

});
