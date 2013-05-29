
init.add(function () {

	window.session = {};

	session.initLogin = function () {
		var $form = formty.getForm('#form');
		$form.$password.focus();
		$form.$send.click(function () {
			formty.post('/api/sessions', $form, function (err) {
				if (err) return showError(err);
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
