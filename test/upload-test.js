var _ = require('underscore');
var should = require('should');
var request = require('request').defaults({json: true});
var async = require('async');
var _childp = require('child_process');
var path = require('path');

var l = require('../main/l');
var config = require("../main/config");
var mongo = require('../main/mongo');
var express = require("../main/express");
var upload = require('../main/upload');

var urlBase;

before(function (next) {
	l.addBeforeInit(function (next) {
		config.param = { configPath: "config-dev/config-dev.xml" };
		mongo.param = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	l.addAfterInit(function (next) {
		urlBase = "http://localhost:" + config.appServerPort;
		next();
	});
	l.runInit(next);
});

function doPost(url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = null;
	}
	request.post({ url: urlBase + url, body: body }, next);
}

describe("upload-post-file", function () {
	var post = {_id: 10003};
	var dir;
	before(function () {
		dir = upload.getPostDir(post);
	});
	it("confirm 1.jpg not exists", function () {
		should(!path.existsSync(dir + '/1.jpg'));
	});
	it("confirm 2.jpg not exists", function () {
		should(!path.existsSync(dir + '/2.jpg'));
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
		should(path.existsSync(dir + '/2.jpg'));
	});
	it("confirm 1.jpg exists", function () {
		should(path.existsSync(dir + '/1.jpg'));
	});
});

describe("delete-post-file", function () {
	var post = {_id: 10003};
	var dir;
	before(function () {
		dir = config.uploadDir + '/post/' + Math.floor(post._id / 10000) + '/' + post._id;
	});
	it("confirm 1.jpg exists", function () {
		should(path.existsSync(dir + '/1.jpg'));
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
		should(!path.existsSync(dir + '/1.jpg'));
	});
	it("confirm 2.jpg exists", function () {
		should(path.existsSync(dir + '/2.jpg'));
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
		should(!path.existsSync(dir + '/2.jpg'));
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

