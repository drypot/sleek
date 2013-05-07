var init = require('../main/init');
var config = require('../main/config');
var user9 = require('../main/user');
var express = require('../main/express');
var error = require('../main/error');

init.add(function () {

	var app = express.app;

	console.log('session-api:');

	app.get('/api/sessions', function (req, res) {
		req.findUser(function (err, user) {
			if (err) {
				return res.jsonErr(err);
			}
			res.json({
				user: {
					name: user.name,
					categoriesForMenu: user.categoriesForMenu
				},
				uploadUrl: config.data.uploadUrl
			});
		});
	});

	app.post('/api/sessions', function (req, res) {
		var user = user9.findUserByPassword(req.body.password || '');
		if (!user) {
			return res.jsonErr(error(error.INVALID_PASSWORD));
		}
		req.session.regenerate(function (err) {
			if (err) return res.jsonErr(err);
			if (req.cookies && req.cookies.lv3) {
				res.clearCookie('lv3');
				res.clearCookie('lv');
				res.clearCookie('ph');
				res.clearCookie('uname');
			}
			req.session.userName = user.name;
			req.session.posts = [];
			res.json({
				user: {
					name: user.name
				}
			});
		});
	});

	app.del('/api/sessions', function (req, res) {
		req.session.destroy();
		res.jsonEmpty();
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

		app.get('/api/test/user/any', function (req, res) {
			req.findUser(function (err) {
				if (err) return res.jsonErr(err);
				res.jsonEmpty();
			})
		});

		app.get('/api/test/user/user', function (req, res) {
			req.findUser('user', function (err) {
				if (err) return res.jsonErr(err);
				res.jsonEmpty();
			});
		});

		app.get('/api/test/user/admin', function (req, res) {
			req.findUser('admin', function (err) {
				if (err) return res.jsonErr(err);
				res.jsonEmpty();
			});
		});
	});

});
