var init = require('../main/init');
var config = require('../main/config');
var uesrl = require('../main/user');
var session = require('../main/session');
var express = require('../main/express');
var error = require('../main/error');
var Errors = error.Errors;

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
		if (!user) {
			return res.jsonErr(error('password', error.msg.INVALID_PASSWORD));
		}
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
	});

	app.del('/api/sessions', function (req, res) {
		res.clearCookie('password');
		req.session.destroy();
		res.json({});
	});

});
