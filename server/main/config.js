
module.exports = function (opt) {

	var fs = require('fs');

	if (opt.test) {
		opt.path = 'config/config-test.json';
	}
	if (!opt.path) {
		console.error('specify configuration path.')
		process.exit();
	}
	console.log('config: ' + opt.path);

	var text = fs.readFileSync(opt.path, 'utf8');

	return JSON.parse(text);

};