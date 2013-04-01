var _ = require('underscore');
var fs = require('fs');

exports.load = function (path, next) {
	fs.readFile(path, 'utf8', function (err, text) {
		if (err) {
			next(err);
		} else {
			var config = JSON.parse(text);
			_.extend(exports, config);
			console.log('configuration file: ' + path);
			next(err);
		}
	});
}
