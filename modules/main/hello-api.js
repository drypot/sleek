var init = require('../base/init');
var config = require('../base/config');
var express = require('../main/express');

init.add(function () {

	console.log('hello-api:');

	express.app.get('/api/hello', function (req, res) {
		res.json({
			name: config.data.appName,
			time: Date.now()
		});
	});

});
