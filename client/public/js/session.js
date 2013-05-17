
init.add(function () {

	window.session = {};

	session.initLogin = function () {
		var $form = $('#login-form');
		var $password = $form.find('[name=password]');
		var $remember = $form.find('[name=remember]');
		var $send = $form.find('[name=send]');

		$password.focus();
		$send.click(function () {
			alerts.clear($form);
			var form = {
				password: $password.val(),
				remember: $remember.prop('checked')
			};
			request.post('/api/sessions').send(form).end(function (err, res) {
				err = err || res.error;
				if (err) return showError.system(err);
				if (res.body.err) {
					alerts.add($password, res.body.err.message);
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
			if (err) return showError.system(err);
			location = '/';
		});
	};

});
