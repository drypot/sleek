var express = require('./express');

exports.init = function() {
	express.app.get('/api/hello', function (req, res) {
		res.json('hello');
	});
};
