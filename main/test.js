var _ = require('underscore');
var request = require('request');
var util = require('util');

var l = require('./l.js');

var config;
var mongo;
var es;
var express;

var urlBase = '';

l.init.addAfter(function (next) {
	if (config) {
		urlBase = "http://localhost:" + config.appServerPort;
	}
	next();
});

exports.prepare = function (opt, next) {
	opt = opt.split(',');
	if (opt.indexOf('config') != -1) {
		config = require("./config.js");
		config.param.configPath = "config-dev/config-dev.xml";
	}
	if (opt.indexOf('mongo') != -1) {
		mongo = require('./mongo.js');
		mongo.param.dbName = 'sleek-test';
		mongo.param.dropDatabase = true;
		es = require('./es.js');
		es.param.indexName = 'sleek-test';
		es.param.dropIndex = true;
	}
	if (opt.indexOf('express') != -1) {
		express = require('./express.js');
	}
	l.init.run(next);
};

exports.url = function (path) {
	return urlBase + path;
}

exports.request = function (url, body, file, next) {
	var i = 1;
	if (!_.isFunction(next)) {
		if (_.isFunction(file)) {
			next = file;
		} else if (_.isFunction(body)) {
			next = body;
		} else {
			next = undefined;
		}
	}
	if (!_.isArray(file)) {
		if (_.isArray(body)) {
			file = body;
		} else {
			file = [];
		}
	}
	if (!l.isObject(body)) {
		body = {};
	}
	var opt = {};
	opt.method = 'POST';
	opt.url = urlBase + url;
	if (!file.length) {
		opt.body = body;
		opt.json = true;
		request(opt, next);
	} else {
		opt.headers = { 'content-type': 'multipart/form-data'};
		opt.multipart = [];
		_.each(_.keys(body), function (key) {
			opt.multipart.push({
				'content-disposition': 'form-data; name="' + key + '"',
				body: body[key].toString()
			});
		});
		_.each(file, function (file) {
			opt.multipart.push({
				'content-disposition': 'form-data; name="file"; filename="' + file + '"',
				'content-type': 'text/plain',
				body: file + ' dummy content.'
			});
		});
		request(opt, function (err, res, body) {
			next(err, res, JSON.parse(body));
		});
	}
};

//exports.curl = function (url, body, next) {
//	childp.execFile('/usr/bin/curl', ['-F', 'file=@test-data/1.jpg', '-F', 'file=@test-data/2.jpg', test.url('/api/test/create-head-with-file')], null, function (err, stdout, stderr) {
//		var body = JSON.parse(stdout);
//
//}