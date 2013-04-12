var init = require('./init');
var config = require('./config');
var auth = require('./auth');
var express = require('./express');
var rcs = require('./rcs');

init.add(function () {

	var app = express.app;

	app.get('/api/sessions', function (req, res) {
		req.authorized(function (r) {
			res.json(r || {
				rc: rcs.SUCCESS,
				role: {
					name: res.locals.role.name,
					categoriesForMenu: res.locals.role.categoriesForMenu
				},
				uploadUrl: config.data.uploadUrl
			});
		});
	});

	app.post('/api/sessions', function (req, res) {
		var role = auth.roleByPassword(req.body.password || '');
		if (!role) {
			res.json({ rc: rcs.INVALID_PASSWORD });
		} else {
			makeNewSession(req, res, role, function () {
				clearOldCookies(req, res);
				res.json({
					rc: rcs.SUCCESS,
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

	app.del('/api/sessions', function (req, res) {
		req.session.destroy();
		res.json({ rc: rcs.SUCCESS });
	});

	app.configure('development', function () {
		app.put('/api/test/session', function (req, res) {
			for (var key in req.body) {
				req.session[key] = req.body[key];
			}
			res.json('ok');
		});

		app.get('/api/test/session', function (req, res) {
			var obj = {};
			for (var i = 0; i < req.body.length; i++) {
				var key = req.body[i];
				obj[key] = req.session[key];
			}
			res.json(obj);
		});

		app.get('/api/test/auth/any', function (req, res) {
			req.authorized(function (r) {
				res.json(r || { rc: rcs.SUCCESS });
			})
		});

		app.get('/api/test/auth/user', function (req, res) {
			req.authorized('user', function (r) {
				res.json(r || { rc: rcs.SUCCESS });
			});
		});

		app.get('/api/test/auth/admin', function (req, res) {
			req.authorized('admin', function (r) {
				res.json(r || { rc: rcs.SUCCESS });
			});
		});
	});

	console.log('session-api:');
});
