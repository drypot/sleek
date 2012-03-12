var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');
var _childp = require('child_process');
var _path = require('path');

var _l = require('../main/l');
var _config = require("../main/config");
var _db = require('../main/db');
var _express = require("../main/express");
var _upload = require('../main/upload');

var urlBase;

before(function (next) {
	_l.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" };
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_l.addAfterInit(function (next) {
		urlBase = "http://localhost:" + _config.appServerPort;
		next();
	});
	_l.runInit(next);
});

function doPost(url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = null;
	}
	_request.post({ url: urlBase + url, body: body }, next);
}

describe("upload-post-file", function () {
	var post = {_id: 10003};
	var dir;
	before(function () {
		dir = _upload.getPostDir(post);
	});
	it("confirm 1.jpg not exists", function () {
		_should(!_path.existsSync(dir + '/1.jpg'));
	});
	it("confirm 2.jpg not exists", function () {
		_should(!_path.existsSync(dir + '/2.jpg'));
	});
	it("can upload two files", function (next) {
		_childp.execFile('/usr/bin/curl', ['-F', 'postId=' + post._id, '-F', 'file=@test-data/1.jpg', '-F', 'file=@test-data/2.jpg', 'localhost:8010/api/test/upload-post-file'], null, function (err, stdout, stderr) {
			var body = JSON.parse(stdout);
			body.should.length(2);
			body[0].should.equal('1.jpg');
			body[1].should.equal('2.jpg');
			next(err);
		});
	});
	it("can upload one file", function (next) {
		_childp.execFile('/usr/bin/curl', ['-F', 'postId=' + post._id, '-F', 'file=@test-data/1.jpg', 'localhost:8010/api/test/upload-post-file'], null, function (err, stdout, stderr) {
			var body = JSON.parse(stdout);
			body.should.length(1);
			body[0].should.equal('1.jpg');
			next(err);
		});
	});
	it("can upload none", function (next) {
		_childp.execFile('/usr/bin/curl', ['-F', 'postId=' + post._id, 'localhost:8010/api/test/upload-post-file'], null, function (err, stdout, stderr) {
			stdout.should.empty;
			next(err);
		});
	});
	it("confirm 2.jpg exists", function () {
		_should(_path.existsSync(dir + '/2.jpg'));
	});
	it("confirm 1.jpg exists", function () {
		_should(_path.existsSync(dir + '/1.jpg'));
	});
});

describe("delete-post-file", function () {
	var post = {_id: 10003};
	var dir;
	before(function () {
		dir = _config.uploadDir + '/post/' + Math.floor(post._id / 10000) + '/' + post._id;
	});
	it("confirm 1.jpg exists", function () {
		_should(_path.existsSync(dir + '/1.jpg'));
	});
	it("can delete 1.jpg", function (next) {
		doPost('/api/test/delete-post-file', {postId: post._id, delFile: ['1.jpg']}, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].should.equal('1.jpg');
			next(err);
		});
	});
	it("confirm 1.jpg not exists", function () {
		_should(!_path.existsSync(dir + '/1.jpg'));
	});
	it("confirm 2.jpg exists", function () {
		_should(_path.existsSync(dir + '/2.jpg'));
	});
	it("can delete 2.jpg", function (next) {
		doPost('/api/test/delete-post-file', {postId: post._id, delFile: ['2.jpg']}, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].should.equal('2.jpg');
			next(err);
		});
	});
	it("confirm 2.jpg not exists", function () {
		_should(!_path.existsSync(dir + '/2.jpg'));
	});
	it("can delete 1.jpg again", function (next) {
		doPost('/api/test/delete-post-file', {postId: post._id, delFile: ['1.jpg']}, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].should.equal('1.jpg');
			next(err);
		});
	});
	it("can delete none", function (next) {
		doPost('/api/test/delete-post-file', {postId: post._id}, function (err, res, body) {
			res.should.status(200);
			next(err);
		});
	});
});

