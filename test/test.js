var _ = require('underscore');
var request = require('request');

var l = require('./../main/l.js');
var config = require('./../main/config.js');

l.addInit(function (next) {
	exports.request = new l.RequestBase("http://localhost:" + config.serverPort);
	next();
});

exports.runInit = function (next) {
	config.configPath = "config-dev/config-test.json";
	config.override.mongoDropDatabase = true;
	config.override.esDropIndex = true;
	l.runInit(next);
};