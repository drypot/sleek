var _ = require('underscore');
var request = require('request');

var l = require('./../main/l.js');
var config = require('./../main/config.js');

l.addInit(function (next) {
	exports.request = new l.RequestBase("http://localhost:" + config.serverPort);
	next();
});

exports.prepare = function (next) {
	config.configPath = "config-dev/config-dev.json";
	config.override.mongoDbName = 'sleek-test';
	config.override.mongoDropDatabase = true;
	config.override.esIndexName = 'sleek-test';
	config.override.esDropIndex = true;
	l.runInit(next);
};