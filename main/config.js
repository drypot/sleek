var _ = require('underscore');
var fs = require("fs");
//var xml2js = require('xml2js');

var l = require('./l.js');

exports.configPath = undefined;
exports.override = {};

l.addInit(function (next) {
	if (!exports.configPath) {
		console.info('specify configuration file path.')
		process.exit();
	}

//	new xml2js.Parser().parseString(fs.readFileSync(param.configPath, 'utf8'), function (err, config) {
//		if (err) return next(err);
//		config.role = _.map(config.role, function (rx) { return rx["@"]; });
//		config.category = _.map(config.category, function (cx) { return cx["@"]; });
//		_.extend(exports, config);
//		console.info('configuration file loaded: ' + param.configPath);
//		next();
//	});

	var text = fs.readFileSync(exports.configPath, 'utf8');
	var config = JSON.parse(text);
	_.extend(exports, config, exports.override);
	console.info('configuration file loaded: ' + exports.configPath);
	next();
});