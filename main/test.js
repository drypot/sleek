var _ = require('underscore');
var request = require('request');

var l = require('./l.js');

var config;

l.addAfterInit(function (next) {
	if (config) {
		exports.request = new l.RequestBase("http://localhost:" + config.appServerPort);
	}
	next();
});

exports.prepare = function (opt, next) {
	opt = opt.split(',');
	if (opt.indexOf('config') != -1) {
		config = require("./config.js");
		config.param.configPath = "config-dev/config-dev.json";
	}
	if (opt.indexOf('mongo') != -1) {
		var mongo = require('./mongo.js');
		mongo.param.dbName = 'sleek-test';
		mongo.param.dropDatabase = true;
	}
	if (opt.indexOf('es') != -1) {
		var es = require('./es.js');
		es.param.indexName = 'sleek-test';
		es.param.dropIndex = true;
	}
	if (opt.indexOf('express') != -1) {
		var express = require('./express.js');
	}
	l.runInit(next);
};

