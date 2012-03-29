var _ = require('underscore');
var request = require('request');

var l = require('./l.js');

var config;
var mongo;
var esearch;
var express;

var urlBase = '';

l.addAfterInit(function (next) {
	if (config) {
		urlBase = "http://localhost:" + config.appServerPort;
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
		mongo = require('./mongo.js');
		mongo.param.dbName = 'sleek-test';
		mongo.param.dropDatabase = true;
	}
	if (opt.indexOf('esearch') != -1) {
		esearch = require('./esearch.js');
		esearch.param.indexName = 'sleek-test';
		esearch.param.dropIndex = true;
	}
	if (opt.indexOf('express') != -1) {
		express = require('./express.js');
	}
	l.runInit(next);
};

exports.url = function (path) {
	return urlBase + path;
}

exports.request = function (url, body, file, next) {
	next = _.isFunction(next) ? next : _.isFunction(file) ? file : _.isFunction(body) ? body : undefined;
	file = _.isArray(file) ? file : _.isArray(body) ? body : [];
	body = l.isObject(body) ? body : {};
	var opt = {
		method: 'POST',
		url: urlBase + url
	};
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
