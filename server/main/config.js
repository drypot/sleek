var _ = require('underscore');
var fs = require('fs');

exports.init = function (opt, next) {
	if (opt.test) {
		opt.path = 'config/config-test.json';
	}
	if (!opt.path) {
		console.error('specify configuration file path.')
		process.exit();
	}
	fs.readFile(opt.path, 'utf8', function (err, text) {
		if (err) {
			next(err);
		} else {
			var config = JSON.parse(text);
			_.extend(exports, config);
			exports.localUrl = 'http://localhost:' + config.port;
			console.log('config file: ' + opt.path);
			next(err);
		}
	});
}
