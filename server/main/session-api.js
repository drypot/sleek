var init = require('../main/init');
var config = require('../main/config');
var uesrl = require('../main/user');
var session = require('../main/session');
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
		var user = uesrl.findUserByPassword(req.body.password || '');
		if (user) {
			if (req.body.remember) {
				res.cookie('password', req.body.password, {
					maxAge: 30 * 24 * 60 * 60 * 1000,
					httpOnly: true
				});
			}
			session.initSession(req, user, function (err) {
				if (err) return res.jsonErr(err);
				res.json({
					user: {
						name: user.name
					}
				});
			});
			return;
		}
		res.jsonErr(error(error.INVALID_PASSWORD));
	});

	app.del('/api/sessions', function (req, res) {
		res.clearCookie('password');
		req.session.destroy();
		res.json({});
	});

});
