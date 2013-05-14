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
			if (err) return res.jsonErr(err);
			res.json({
				user: {
					name: user.name,
					categoriesOrdered: user.categoriesOrdered
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
		if (req.body.remember) {
			res.cookie('password', req.body.password, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true
			});
		}
		initSession(req, user, function (err) {
			if (err) return res.jsonErr(err);
			res.json({
				user: {
					name: user.name
				}
			});
		});
	});

	express.autoLogin = function (req, res, next) {
		var password = req.cookies.password;
		if (!password) return next();
		var user = user9.findUserByPassword(password);
		if (!user) {
			res.clearCookie('password');
			return next();
		}
		initSession(req, user, next);
	};

	function initSession(req, user, next) {
		req.session.regenerate(function (err) {
			if (err) return next(err);
			req.session.uname = user.name;
			req.session.posts = [];
			next();
		});
	}

	app.del('/api/sessions', function (req, res) {
		res.clearCookie('password');
		req.session.destroy();
		res.json({});
	});

});
