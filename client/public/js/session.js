l.session = {};

init.add(function () {

	l.session.initLoginPage = function () {
		trySavedPassword(function (err, success) {
			if (err) {
				l.systemError(err);
			} else if (success) {
				location = '/thread';
			} else {
				l.$content.find('[name=submit]').click(sendLoginForm);
				l.$content.find('[placeholder]').simplePlaceholder();
			}
		});
	};

	function trySavedPassword(next) {
		var pw = localStorage.getItem('password');
		if (!pw) {
			next(null, false);
		} else {
			console.log('trying saved password,');
			request.post(url + '/api/sessions').send({ password: pw }).endEx(function (err, res) {
				if (err) {
					next(err, false);
				} else {
					next(null, res.body.rc === rcs.SUCCESS)
				}
			});
		}
	}

	function sendLoginForm() {
		var $password = l.$content.find('[name=password]');
		var $remember = l.$content.find('[name=remember]');
		l.form.clearAlert(l.$content);
		request.post(url + '/api/sessions').send({ password: $password.val() }).endEx(function (err, res) {
			if (err) {
				l.systemError(err);
			} else if (res.body.rc !== rcs.SUCCESS) {
				l.form.addAlert($password, l.rcMsg[res.body.rc]);
			} else {
				if ($remember.prop('checked')) {
					localStorage.setItem('password', $password.val());
				} else {
					localStorage.removeItem('password');
				}
				location = '/thread';
			}
		});
		return false;
	}

});

init.add(function () {

	l.session.logout = function () {
		request.del('/api/sessions').end(function (res) {
			localStorage.removeItem('password');
			console.log('logged out');
			location = '/';
		});
	};

});
