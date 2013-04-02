var _ = require('underscore');
var fs = require('fs');

exports.init = function (opt, next) {
	if (opt.test) {
		opt.path = 'config/config-test.json';
	}
	fs.readFile(opt.path, 'utf8', function (err, text) {
		if (err) {
			next(err);
		} else {
			var config = JSON.parse(text);
			_.extend(exports, config);
			exports.localUrl = 'http://localhost:' + config.serverPort;
			console.log('configuration file: ' + opt.path);
			next(err);
		}
	});
}
