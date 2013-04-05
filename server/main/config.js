var fs = require('fs');

exports.init = function (opt) {
	if (opt.test) {
		opt.path = 'config/config-test.json';
	}
	if (!opt.path) {
		console.error('specify configuration path.')
		process.exit();
	}
	var text = fs.readFileSync(opt.path, 'utf8');
	var config = JSON.parse(text);
	for (var p in config) {
		exports[p] = config[p];
	}
	console.log('config file: ' + opt.path);
}
