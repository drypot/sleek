var _ = require('underscore');
var fs = require("fs");

var l = require('./l.js');

exports.configPath = undefined;
exports.override = {};

l.addInit(function (next) {
	if (!exports.configPath) {
		console.info('specify configuration file path.')
		process.exit();
	}

	var text = fs.readFileSync(exports.configPath, 'utf8');
	var config = JSON.parse(text);
	_.extend(exports, config, exports.override);
	console.info('configuration file loaded: ' + exports.configPath);
	next();
});