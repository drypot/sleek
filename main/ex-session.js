var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./const.js');
require('./config.js');
require('./role.js');
require('./ex.js');
require('./session.js');

l.init.init(function () {

	var e = l.ex;

	e.get('/api/session', function (req, res) {
		var roleName = req.session.roleName;
		if (roleName) {
			var role = l.role.getRoleByName(roleName);
			res.json({
				rc: l.rc.SUCCESS,
				role: {
					name: role.name,
					category: role.categoryAsArray
				},
				uploadUrl: l.config.uploadUrl
			});
		} else {
			res.json({ rc: l.rc.NOT_AUTHENTICATED });
		}
	});

	(function () {
		e.post('/api/session', function (req, res) {
			var role = l.role.getRoleByPassword(req.body.password || '');
			if (role) {
				makeNewSession(req, res, role, function () {
					clearOldCookies(req, res);
					res.json({ rc: l.rc.SUCCESS, role: { name: role.name } });
				});
			} else {
				res.json({ rc: l.rc.INVALID_PASSWORD });
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

		e.get('/api/test/role/any', l.session.checkLogin(), function (req, res) {
			res.json({ rc: l.rc.SUCCESS });
		});

		e.get('/api/test/role/user', l.session.checkLogin(), l.session.checkRole('user'), function (req, res) {
			res.json({ rc: l.rc.SUCCESS });
		});

		e.get('/api/test/role/admin', l.session.checkLogin(), l.session.checkRole('admin'), function (req, res) {
			res.json({ rc: l.rc.SUCCESS });
		});
	});

});
