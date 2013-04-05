var fs = require('fs');

exports = module.exports = function (opt, next) {
	if (opt.test) {
		opt.path = 'config/config-test.json';
	}
	if (!opt.path) {
		console.error('specify configuration path.')
		process.exit();
	}
	console.log('config: ' + opt.path);
	var text = fs.readFileSync(opt.path, 'utf8');
	next(JSON.parse(text));
}
