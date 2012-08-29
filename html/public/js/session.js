l.session = {};

l.init.init(function () {

	update();

	function update() {
		var s = sessionStorage.getItem('role');
		if (s) {
			l.session.role = JSON.parse(s);
		}
		l.menu.update();
	}

	l.session.authorized = function (next) {
		console.log('authorized as: ' + (l.session.role && l.session.role.name));
		if (!l.session.role) {
			revive(next);
		} else {
			next();
		}
	};

	l.session.revive = revive;

	function revive(next) {
		delete l.session.role;
		console.log('reviving session,');
		request.get('/api/session').endEx(function (err, res) {
			if (err) {
				l.systemModalError(err);
			} else {
				if (res.body.rc !== l.rc.SUCCESS) {
					relogin(next);
				} else {
					var role = {
						name: res.body.role.name,
						category: {},
						categoryList: res.body.role.categoryList
					};
					_.each(role.categoryList, function (category) {
						role.category[category.id] = category;
					});
					l.session.role = role;
					sessionStorage.setItem('role', JSON.stringify(role));
					console.log('authroized as, revived: ' + (l.session.role && l.session.role.name));
					update();
					next();
				}
			}
		});
	};

	function relogin(next) {
		var pw = localStorage.getItem('password');
		if (!pw) {
			location = '/';
		} else {
			console.log('trying saved password,');
			request.post('/api/session').send({ password: pw }).endEx(function (err, res) {
				if (err) {
					l.systemModalError(err);
				} else if (res.body.rc !== l.rc.SUCCESS) {
					location = '/';
				} else {
					revive(next);
				}
			});
		}
	}

	l.session.logout = function () {
		request.del('/api/session').end(function (res) {
			delete l.session.role;
			sessionStorage.removeItem('role');
			localStorage.removeItem('password');
			console.log('logged out');
			location = '/';
		});
	};

});

l.init.init(function () {

	l.session.initLoginPage = function () {
		if (!l.session.role) {
			l.$content.find('[name=submit]').click(sendLoginForm);
			l.$content.find('[placeholder]').simplePlaceholder();
		} else {
			location = '/thread'
		}
	};

	function sendLoginForm() {
		var $password = l.$content.find('[name=password]');
		var $remember = l.$content.find('[name=remember]');
		l.form.clearAlert(l.$content);
		request.post('/api/session').send({ password: $password.val() }).endEx(function (err, res) {
			if (err) {
				l.systemModalError(err);
			} else if (res.body.rc !== l.rc.SUCCESS) {
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
