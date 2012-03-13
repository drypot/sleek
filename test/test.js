var _ = require('underscore');
var request = require('request');

var l = require('../main/l.js');

var config;
var mongo;
var express;

var urlBase;

l.addAfterInit(function (next) {
	if (config) {
		urlBase = "http://localhost:" + config.appServerPort;
	}
	next();
});

exports.prepare = function (opt, next) {
	opt = opt.split(',');
	if (_.intersection(opt, ['config', 'mongo', 'express']).length) {
		config = require("../main/config.js");
		config.param = { configPath: "config-dev/config-dev.xml" };
	}
	if (_.intersection(opt, ['mongo']).length) {
		mongo = require('../main/mongo.js');
		mongo.param = { mongoDbName: "sleek-test", dropDatabase: true };
	}
	if (_.intersection(opt, ['express']).length) {
		express = require('../main/express.js');
	}
	l.runInit(next);
}

exports.post = function (url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = {};
	}
	request.post({ url: urlBase + url, body: body, json: true }, next);
}


//ex.configure('development', function () {
//	// session
//
//	ex.post('/api/test/set-session-var', function (req, res) {
//		req.session.test_var = req.body.value;
//		res.json('ok');
//	});
//
//	ex.post('/api/test/get-session-var', function (req, res) {
//		res.json(req.session.test_var);
//	});
//
//	// auth
//
//	ex.post('/api/test/assert-role-any', assertLoggedIn, function (req, res) {
//		res.json('ok');
//	});
//
//	ex.post('/api/test/assert-role-user', assertLoggedIn, assertRole('user'), function (req, res) {
//		res.json('ok');
//	});
//
//	ex.post('/api/test/assert-role-admin', assertLoggedIn, assertRole('admin'), function (req, res) {
//		res.json('ok');
//	});
//
//	// upload
//
//	ex.post('/api/test/upload-post-file', function (req, res, next) {
//		upload.savePostFile({_id: parseInt(req.body.postId)}, req.files.file, function (err, filename) {
//			if (err) return next(err);
//			res.json(200, filename);
//		});
//	});
//
//	ex.post('/api/test/delete-post-file', function (req, res, next) {
//		upload.deletePostFile({_id: parseInt(req.body.postId)}, req.body.delFile, function (err, filename) {
//			if (err) return next(err);
//			res.json(200, filename);
//		});
//	});
//
//});
