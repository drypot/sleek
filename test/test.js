var _ = require('underscore');
var request = require('request');

var l = require('../main/l.js');

var config;
var mongo;
var express;

var urlBase;

l.init.addAfter(function (next) {
	if (config) {
		urlBase = "http://localhost:" + config.appServerPort;
	}
	next();
});

exports.prepare = function (opt, next) {
	opt = opt.split(',');
	if (opt.indexOf('config') != -1) {
		config = require("../main/config.js");
		config.param.configPath = "config-dev/config-dev.xml";
	}
	if (opt.indexOf('mongo') != -1) {
		mongo = require('../main/mongo.js');
		mongo.param.dbName = "sleek-test";
		mongo.param.dropDatabase = true;
	}
	if (opt.indexOf('express') != -1) {
		express = require('../main/express.js');
	}
	l.init.run(next);
};

exports.post = function (url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = {};
	}
	request.post({ url: urlBase + url, body: body, json: true }, next);
};

exports.url = function (path) {
	return urlBase + path;
}