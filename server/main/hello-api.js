var express = './express.js';

exports.init = function() {
	express.app.get('/api/hello', function (req, res) {
		res.json('hello');
	});
};
