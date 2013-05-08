
init.add(function () {

	window.session = {};

	var $loginSec;

	session.initLogin = function () {
		trySavedPassword(function (err, success) {
			if (err) return showError.system(err);
			if (success) {
				location = '/threads';
				return;
			}
			$loginSec = $('#login-sec');
			$loginSec.removeClass('hide');
			$loginSec.find('[name=submit]').click(sendLoginForm);
		});
	};

	session.initAutoLogin = function () {
		trySavedPassword(function (err, success) {
			if (err) {
				showError.system(err, function () {
					location = '/';
				});
				return
			}
			if (success) {
				location.reload();
				return;
			}
			location = '/';
		});
	}

	function trySavedPassword(next) {
		var pw = localStorage.getItem('password');
		if (!pw) return next(null, false);
		console.log('trying saved password,');
		request.post('/api/sessions').send({ password: pw }).end(function (err, res) {
			err = err || res.error || res.body.err;
			if (err) {
				localStorage.removeItem('password');
				return next(err, false);
			}
			next(null, true);
		});
	}

	function sendLoginForm() {
		var $password = $loginSec.find('[name=password]');
		var $remember = $loginSec.find('[name=remember]');
		alerts.clear($loginSec);
		request.post('/api/sessions').send({ password: $password.val() }).end(function (err, res) {
			err = err || res.error;
			if (err) return showError.system(err);
			if (res.body.err) {
				alerts.add($password, res.body.err.message);
				return;
			}
			if ($remember.prop('checked')) {
				localStorage.setItem('password', $password.val());
			} else {
				localStorage.removeItem('password');
			}
			location = '/threads';
		});
		return false;
	}

	session.logout = function () {
		request.del('/api/sessions').end(function (err, res) {
			err = err || res.error || res.body.err;
			if (err) return showError.system(err);
			localStorage.removeItem('password');
			console.log('logged out');
			location = '/';
		});
	};

});
