var express = require('./express');

exports.init = function(next) {

	express.app.get('/api/hello', function (req, res) {
		res.send('hello');
	});

	next();
};
