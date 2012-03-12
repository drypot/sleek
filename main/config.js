var _ = require('underscore');
var _should = require('should');
var _fs = require("fs");

var _ = require("underscore");
var _xml2js = require('xml2js');

var _l = require('./l');

_l.addInit(function (next) {
	var param = _.extend({}, exports.initParam);

	if (!param.configPath) {
		console.log('configuration file passed.');
		return next();
	}

	new _xml2js.Parser().parseString(_fs.readFileSync(param.configPath, 'utf8'), function (err, config) {
		if (err) return next(err);
		config.role = _.map(config.role, function (el) { return el["@"]; });
		config.category = _.map(config.category, function (el) { return el["@"]; });
		_.extend(exports, config);
		console.info('configuration file loaded: ' + param.configPath);
		next();
	});
});