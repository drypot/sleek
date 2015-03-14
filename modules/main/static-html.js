var init = require('../base/init');
var express = require('../main/express');
var mongo = require('../mongo/mongo');

init.add(function () {

	console.log('static-html:');

	var app = express.app;

	app.get('/', function (req, res) {
		if (res.locals.user) {
			res.redirect('/threads');
			return;
		}
		res.render('login');
	});

});
