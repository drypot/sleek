var init = require('../main/init');
var config = require('../main/config');
var auth = require('../main/auth');
var express = require('../main/express');
var rcs = require('../main/rcs');

init.add(function () {

	var app = express.app;

	console.log('session-api:');

	app.get('/api/sessions', function (req, res) {
		req.authorized(function (err, role) {
			res.json(err || {
				rc: rcs.SUCCESS,
				role: {
					name: role.name,
					categoriesForMenu: role.categoriesForMenu
				},
				uploadUrl: config.data.uploadUrl
			});
		});
	});

	app.post('/api/sessions', function (req, res) {
		var role = auth.roleByPassword(req.body.password || '');
		if (!role) {
			return res.json({ rc: rcs.INVALID_PASSWORD });
		}
		req.session.regenerate(function (err) {
			if (err) return res.json(err);
			if (req.cookies && req.cookies.lv3) {
				res.clearCookie('lv3');
				res.clearCookie('lv');
				res.clearCookie('ph');
				res.clearCookie('uname');
			}
			req.session.roleName = role.name;
			req.session.posts = [];
			res.json({
				rc: rcs.SUCCESS,
				role: {
					name: role.name
				}
			});
		});
	});

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
			req.authorized(function (err) {
				res.json(err || { rc: rcs.SUCCESS });
			})
		});

		app.get('/api/test/auth/user', function (req, res) {
			req.authorized('user', function (err) {
				res.json(err || { rc: rcs.SUCCESS });
			});
		});

		app.get('/api/test/auth/admin', function (req, res) {
			req.authorized('admin', function (err) {
				res.json(err || { rc: rcs.SUCCESS });
			});
		});
	});

});
