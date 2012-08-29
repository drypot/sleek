var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./const.js');
require('./config.js');
require('./role.js');
require('./express.js');

l.session = {};

l.init.init(function () {

	l.session.authorized = function (res, roleName, next) {
		var role = res.locals.role;
		if (!role) {
			res.json({ rc: l.rc.NOT_AUTHENTICATED });
		} else {
			if (_.isString(roleName)) {
				if (role.name !== roleName) {
					return res.json({ rc: l.rc.NOT_AUTHORIZED});
				} else {
					next();
				}
			} else {
				next = roleName;
				next();
			}
		}
	}

});

l.init.init(function () {

	var e = l.e;

	e.get('/api/session', function (req, res) {
		l.session.authorized(res, function () {
			res.json({
				rc: l.rc.SUCCESS,
				role: {
					name: res.locals.role.name,
					categoryList: res.locals.role.categoryList
				},
				uploadUrl: l.config.uploadUrl
			});
		});
	});

	(function () {
		e.post('/api/session', function (req, res) {
			var role = l.role.getRoleByPassword(req.body.password || '');
			if (!role) {
				res.json({ rc: l.rc.INVALID_PASSWORD });
			} else {
				makeNewSession(req, res, role, function () {
					clearOldCookies(req, res);
					res.json({
						rc: l.rc.SUCCESS,
						role: {
							name: role.name
						}
					});
				});
			}
		});

		function makeNewSession(req, res, role, next) {
			var _this = this;
			req.session.regenerate(function (err) {
				req.session.roleName = role.name;
				req.session.post = [];
				next();
			});
		}

		function clearOldCookies(req, res) {
			if (req.cookies && req.cookies.lv3) {
				res.clearCookie('lv3');
				res.clearCookie('lv');
				res.clearCookie('ph');
				res.clearCookie('uname');
			}
		}
	})();

	e.del('/api/session', function (req, res) {
		req.session.destroy();
		res.json({ rc: l.rc.SUCCESS });
	});

	e.configure('development', function () {
		e.put('/api/test/session-var', function (req, res) {
			req.session.test_var = req.body.value;
			res.json('ok');
		});

		e.get('/api/test/session-var', function (req, res) {
			res.json(req.session.test_var);
		});

		e.get('/api/test/role/any', function (req, res) {
			l.session.authorized(res, function () {
				res.json({ rc: l.rc.SUCCESS });
			})
		});

		e.get('/api/test/role/user', function (req, res) {
			l.session.authorized(res, 'user', function () {
				res.json({ rc: l.rc.SUCCESS });
			});
		});

		e.get('/api/test/role/admin', function (req, res) {
			l.session.authorized(res, 'admin', function () {
				res.json({ rc: l.rc.SUCCESS });
			});
		});
	});

});

l.init.init(function () {

	var e = l.e;

	e.get('/', function (req, res) {
		res.render('index');
	});

});