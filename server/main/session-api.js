var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./msg.js');
require('./express.js');
require('./session.js');

l.init(function () {

	l.e.get('/api/session', function (req, res) {
		l.session.authorized(res, function () {
			res.json({
				rc: l.rc.SUCCESS,
				role: {
					name: res.locals.role.name,
					readableCategory: res.locals.role.readableCategory
				},
				uploadUrl: l.config.uploadUrl
			});
		});
	});

	l.e.post('/api/session', function (req, res) {
		var role = l.role.roleByPassword(req.body.password || '');
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

	l.e.get('/', function (req, res) {
		if (res.locals.role) {
			res.redirect('/thread');
		} else {
			res.locals.title = 'Login';
			res.render('index');
		}
	});

	l.e.del('/api/session', function (req, res) {
		req.session.destroy();
		res.json({ rc: l.rc.SUCCESS });
	});

	l.e.configure('development', function () {
		l.e.put('/api/test/session-var', function (req, res) {
			req.session.test_var = req.body.value;
			res.json('ok');
		});

		l.e.get('/api/test/session-var', function (req, res) {
			res.json(req.session.test_var);
		});

		l.e.get('/api/test/role/any', function (req, res) {
			l.session.authorized(res, function () {
				res.json({ rc: l.rc.SUCCESS });
			})
		});

		l.e.get('/api/test/role/user', function (req, res) {
			l.session.authorized(res, 'user', function () {
				res.json({ rc: l.rc.SUCCESS });
			});
		});

		l.e.get('/api/test/role/admin', function (req, res) {
			l.session.authorized(res, 'admin', function () {
				res.json({ rc: l.rc.SUCCESS });
			});
		});
	});

});
