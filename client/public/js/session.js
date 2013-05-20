
init.add(function () {

	window.session = {};

	session.initLogin = function () {
		var $form = $('#login-form');

		formty.linkControls($form);
		$form.$password.focus();

		$form.$send.click(function () {
			formty.clearAlerts($form);
			var form = formty.toObject($form);
			request.post('/api/sessions').send(form).end(function (err, res) {
				err = err || res.error;
				if (err) return showError(err);
				if (res.body.err) {
					formty.addAlert($form.$password, res.body.err.message);
					return;
				}
				location = '/threads';
			});
			return false;
		});
	};

	session.logout = function () {
		request.del('/api/sessions').end(function (err, res) {
			err = err || res.error || res.body.err;
			if (err) return showError(err);
			location = '/';
		});
	};

});
