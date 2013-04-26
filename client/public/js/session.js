
init.add(function () {

	window.session = {};

	session.initLoginPage = function () {
		trySavedPassword(function (err, success) {
			if (err) {
				errorDialog.system(err);
				return;
			}
			if (success) {
				location = '/thread';
				return;
			}
			$content.find('[name=submit]').click(sendLoginForm);
			//$content.find('[placeholder]').simplePlaceholder();
		});
	};

	function trySavedPassword(next) {
		var pw = localStorage.getItem('password');
		if (!pw) {
			next(null, false);
			return;
		}
		console.log('trying saved password,');
		request.post('/api/sessions').send({ password: pw }).end(function (err, res) {
			if (err) {
				next(err, false);
				return;
			}
			next(null, res.body.rc === rcs.SUCCESS);
		});
	}

	function sendLoginForm() {
		var $password = $content.find('[name=password]');
		var $remember = $content.find('[name=remember]');
		alerts.clear($content);
		request.post('/api/sessions').send({ password: $password.val() }).end(function (err, res) {
			if (err) {
				errorDialog.system(err);
				return;
			}
			if (res.body.rc !== rcs.SUCCESS) {
				alerts.add($password, msgs[res.body.rc]);
				return;
			}
			console.log('333');
			if ($remember.prop('checked')) {
				localStorage.setItem('password', $password.val());
			} else {
				localStorage.removeItem('password');
			}
			location = '/thread';
		});
		return false;
	}

	session.logout = function () {
		request.del('/api/sessions').end(function (err, res) {
			if (err) {
				errorDialog.system(err);
				return;
			}
			localStorage.removeItem('password');
			console.log('logged out');
			location = '/';
		});
	};

});
