var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');
var _childp = require('child_process');
var _path = require('path');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _express = require("../main/express");

var urlBase;

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" };
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.addAfterInit(function (next) {
		urlBase = "http://localhost:" + _config.appServerPort;
		next();
	});
	_lang.runInit(next);
});

function post(url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = null;
	}
	_request.post({ url: urlBase + url, body: body }, next);
}

describe("upload post file,", function () {
	var postId = 10003;
	var dir;
	before(function () {
		dir = _config.uploadDir + '/post/' + Math.floor(postId / 10000) + '/' + postId;
	});
	it("should not exists, 1.jpg", function () {
		_should.ok(!_path.existsSync(dir + '/1.jpg'));
	});
	it("should not exists, 2.jpg", function () {
		_should.ok(!_path.existsSync(dir + '/2.jpg'));
	});
	it("should success", function (next) {
		var postId = 10003;
		_childp.execFile('/usr/bin/curl', ['-F', 'postId=' + postId, '-F', 'file=@test-data/1.jpg', '-F', 'file=@test-data/2.jpg', 'localhost:8010/api/test/upload-post-file'], null, function (err, stdout, stderr) {
			var body = JSON.parse(stdout);
			body.should.length(2);
			body[0].should.equal('1.jpg');
			body[1].should.equal('2.jpg');
			next(err);
		});
	});
	it("should exists, 2.jpg", function () {
		_should.ok(_path.existsSync(dir + '/2.jpg'));
	});
	it("should exists, 1.jpg", function () {
		_should.ok(_path.existsSync(dir + '/1.jpg'));
	});
});

describe("delete post file,", function () {
	var postId = 10003;
	var dir;
	before(function () {
		dir = _config.uploadDir + '/post/' + Math.floor(postId / 10000) + '/' + postId;
	});
	it("should exists, 1.jpg", function () {
		_should.ok(_path.existsSync(dir + '/1.jpg'));
	});
	it("should success to delete 1.jpg", function (next) {
		post('/api/test/delete-post-file', {postId: postId, delFile: ['1.jpg']}, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].should.equal('1.jpg');
			next(err);
		});
	});
	it("should not exists, 1.jpg", function () {
		_should.ok(!_path.existsSync(dir + '/1.jpg'));
	});
	it("should exists, 2.jpg", function () {
		_should.ok(_path.existsSync(dir + '/2.jpg'));
	});
	it("should success to delete 2.jpg", function (next) {
		post('/api/test/delete-post-file', {postId: postId, delFile: ['2.jpg']}, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].should.equal('2.jpg');
			next(err);
		});
	});
	it("should not exists, 2.jpg", function () {
		_should.ok(!_path.existsSync(dir + '/2.jpg'));
	});
});

