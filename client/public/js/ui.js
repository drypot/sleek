init.add(function() {

	var $modal = $('#error-modal');
	var $title = $modal.find('.modal-title');
	var $body = $modal.find('.modal-body');

	window.showError = function (header, text, next) {
		$title.empty();
		$title.append('<h3>' + header + '</h3>');
		$body.empty();
		$body.append('<p>' + text + '</p>');
		$modal.off('hidden.bs.modal');
		if (next) {
			$modal.on('hidden.bs.modal', next);
		}
		$modal.modal('show');
	};

	window.showError.system = function (err, next) {
		$title.empty();
		$title.append('<h3>시스템 오류</h3>');
		$body.empty();
		$body.append('<h3>Message</h3>');
		$body.append('<pre>' + err.message + '</pre>');
		$body.append('<h3>Stack</h3>');
		$body.append('<pre>' + err.stack + '</pre>');
		$modal.off('hidden.bs.modal');
		if (next) {
			$modal.on('hidden.bs.modal', next);
		}
		$modal.modal('show');
	};

});

init.add(function () {

	window.alerts = {};

	alerts.clear = function ($sec) {
		$sec.find('.alert').remove();
		$sec.find('.has-error').removeClass('has-error');
		$sec.find('.text-danger').remove();
	};

	alerts.add = function ($control, msg) {
		var $group = $control.closest('div');
		$group.addClass('has-error');
		//$control.before($('<div>').addClass('alert alert-danger').text(msg));
		$group.append($('<p>').addClass('error text-danger').text(msg));
	};

	alerts.fill = function ($form, fields) {
		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			alerts.add($form.find('[name="' + field.name + '"]'), field.msg);
		}
	}

});

init.add(function () {

	window.upload = {};

	var $fileTempl = $('#input-file-templ');
	var $files = $('form .file-group .files');
	var $add = $('form .file-group .actions button');
	var basename = /[^\\]+$/;

	upload.add = function () {
		if (msie) {
			$files.append($('<div class="file"><input type="file" name="file"></div>'));
			return;
		}
		var $set = $fileTempl.children(0).clone();
		var $file = $set.find('input[type="file"]');
		var $text = $set.find('input[type="text"]');
		var $btn = $set.find('button');
		$btn.click(function () {
			$file.click();
			return false;
		});
		$file.change(function () {
			var files = $file[0].files;
			var text;
			if (files && files.length > 1) {
				text = files.length + ' files';
			} else {
				text = basename.exec($file.val())[0];
			}
			$text.val(text);
		})
		$files.append($set);
	}

	if ($files.length) {
		upload.add();
		$add.click(function () {
			upload.add();
			return false;
		});
	}

});

init.add(function () {

	window.Sender = function ($form) {
		var $send = $form.find('[name=send]');
		var $sending = $form.find('[name=sending]');
		this.beforeSend = function () {
			$send.addClass('hide');
			$sending.removeClass('hide');
		};
		this.complete = function () {
			$send.removeClass('hide');
			$sending.addClass('hide');
		};
	};

});

init.add(function () {

	$('.navbar .logout-btn').click(function () {
		session.logout();
		return false;
	});

	$('.navbar .new-btn').click(function () {
		if (url.query.c) {
			location='/threads/new?c=' + url.query.c;
		} else {
			location='/threads/new';
		}
		return false;
	});

//	if (url.query.q) {
//		$('.navbar input[name="q"]').val(url.query.q);
//	}
});

init.add(function () {

	window.spinner = new Spinner({
		lines: 11, // The number of lines to draw
		length: 5, // The length of each line
		width: 2, // The line thickness
		radius: 6, // The radius of the inner circle
		rotate: 0, // The rotation offset
		color: '#000', // #rgb or #rrggbb
		speed: 1, // Rounds per second
		trail: 60, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: false, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		zIndex: 2e9, // The z-index (defaults to 2000000000)
		top: 'auto', // Top position relative to parent in px
		left: 'auto' // Left position relative to parent in px
	});

});
