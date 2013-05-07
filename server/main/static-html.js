var init = require('../main/init');
var express = require('../main/express');
var mongo = require('../main/mongo');

init.add(function () {

	console.log('static-html:');

	var app = express.app;

	app.get('/', function (req, res) {
		if (res.locals.user) {
			res.redirect('/threads');
		} else {
			res.render('index');
		}
	});

});
