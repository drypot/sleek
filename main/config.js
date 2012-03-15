var _ = require('underscore');
var fs = require("fs");
var xml2js = require('xml2js');

var l = require('./l.js');

var param = exports.param = {};

l.init.add(function (next) {
	if (!param.configPath) {
		console.log('configuration file passed.');
		return next();
	}

	new xml2js.Parser().parseString(fs.readFileSync(param.configPath, 'utf8'), function (err, config) {
		if (err) return next(err);
		config.role = _.map(config.role, function (rx) { return rx["@"]; });
		config.category = _.map(config.category, function (cx) { return cx["@"]; });
		_.extend(exports, config);
		console.info('configuration file loaded: ' + param.configPath);
		next();
	});
});