var fs = require('fs');

var l = require('./l');

var opt = {};

exports.options = function (_opt) {
	if (_opt.test) {
		_opt.path = 'config/config-test.json';
	}
	for(var p in _opt) {
		opt[p] = _opt[p];
	}
	return exports;
};

exports.reset = function () {
	opt = {};
	delete exports.config;
}

exports.init = function () {
	exports.config = load(opt.path);
}

l.init(exports.init);


function load (path) {
	if (!path) {
		throw new Error('specify configuration path.')
		//process.exit();
	}
	console.log('config: ' + path);

	var text = fs.readFileSync(path, 'utf8');
	return JSON.parse(text);
}
