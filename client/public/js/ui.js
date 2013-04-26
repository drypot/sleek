init.add(function() {

	var $modal;

	window.errorDialog = function (header, text) {
		if (!$modal) {
			$modal = $('#error-modal');
		}
		$modal.find('h3').html(header);
		$modal.find('p').html(text);
		$modal.modal('show');
	};

	window.errorDialog.system = function (err) {
		errorDialog("시스템 오류", err);
	};

	window.errorDialog.unhandled = function (rc) {
		errorDialog("발생해서는 안 되는 오류", '' + rc + ':' + l.rcMsg[rc]);
	};

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

init.add(function () {

	$('.navbar a[href="/logout"]').click(function () {
		session.logout();
		return false;
	});

});


//init.add(function () {
//
//	l.form = {};
//
//	l.form.clearAlert = function ($content) {
//		$content.find('.alert').remove();
//		$content.find('.error').removeClass('error');
//	};
//
//	l.form.addAlert = function ($control, msg) {
//		var $alert = $('<div>').addClass('alert alert-error').text(msg);
//		$control.parent().addClass('error');
//		$control.parent().before($alert);
//	};
//
//});
//

//
//init.add(function () {
//
//	// TODO:
//
//	jQuery.fn.attachScroller = function(callback) {
//		var target = this;
//		var y = 0;
//		var ny = 0;
//		var timer = null;
//
//		function scroll() {
//			var scrollTop = document.documentElement.scrollTop + document.body.scrollTop;
//			var dy = y - scrollTop;
//			var ay = Math.max(Math.abs(Math.round(dy * 0.15)), 1) * (dy < 0 ? -1 : 1);
//			clearTimeout(timer);
//			if (Math.abs(dy) > 3 && Math.abs(ny - scrollTop) < 3) {
//				ny = scrollTop + ay;
//				scrollTo(0, ny);
//				timer = setTimeout(scroll, 10);
//			} else {
//				if (callback) callback();
//			}
//		}
//
//		var viewportHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight;
//		y = target.offset().top;
//		y = y - (viewportHeight / 4);
//		y = Math.round(Math.max(y, 0));
//		timer = setTimeout(scroll, 0);
//	}
//
//});

