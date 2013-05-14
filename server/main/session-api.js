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
		res.json({});
	});

});
