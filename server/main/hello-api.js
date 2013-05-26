var init = require('../main/init');
var express = require('../main/express');

init.add(function () {

	console.log('hello-api:');

	express.app.get('/api/hello', function (req, res) {
		res.json('hello');
	});

	express.app.get('/api/time', function (req, res) {
		res.json(Date.now());
	});

});
