var should = require('should');

var l = require('../main/l');
var init = require('../main/init');
var config = require('../main/config')({ test: true });
var upload = require('../main/upload');
var express = require('../main/express');
var error = require('../main/error');
var ufix = require('../test/user-fixture');

require('../main/session-api');
require('../main/upload-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

it("given user session", function (next) {
	ufix.loginUser(next);
});

describe("uploading none", function () {
	it("should success", function (next) {
		request
			.post(test.url + '/api/upload')
			.end(function (err, res) {
				should(!err);
				should(!res.error);
				should(!res.body.err);
				var files = res.body.files;
				Object.keys(files).should.be.empty;
				next();
			});
	});
});

describe("uploading one file", function () {
	it("should success", function (next) {
		request
			.post(test.url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.end(function (err, res) {
				should(!err);
				should(!res.error);
				should(!res.body.err);
//				console.log(res.body);
				var files = res.body.files;
				var file = l.find(files, function (file) {
					return file.name === 'dummy.txt';
				});
				should.exist(file);
				upload.tmpFileExists(file.tmpName).should.be.true;
				next();
			});
	});
});

describe("uploading two files", function () {
	it("should success", function (next) {
		request
			.post(test.url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.attach('file', 'server/test/fixture/dummy2.txt')
			.end(function (err, res) {
				should(!err);
				should(!res.error);
				should(!res.body.err);
//				console.log(res.body);
				var files = res.body.files;
				var file = l.find(files, function (file) {
					return file.name === 'dummy.txt';
				});
				should.exist(file);
				upload.tmpFileExists(file.tmpName).should.be.true;
				var file = l.find(files, function (file) {
					return file.name === 'dummy2.txt';
				});
				should.exist(file);
				upload.tmpFileExists(file.tmpName).should.be.true;
				next();
			});
	});
});

describe("deleting file", function () {
	var files;
	it("given two uploaded files", function (next) {
		request
			.post(test.url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.attach('file', 'server/test/fixture/dummy2.txt')
			.attach('file', 'server/test/fixture/dummy3.txt')
			.end(function (err, res) {
				should(!err);
				should(!res.error);
				should(!res.body.err);
				files = res.body.files;
				next();
			});
	});
	it("should success for dummy.txt", function (next) {
		var delFiles = [];
		var dummy = l.find(files, function (file) {
			return file.name === 'dummy.txt';
		});
		delFiles.push(dummy);
		upload.tmpFileExists(dummy.tmpName).should.be.true;
		request.del(test.url + '/api/upload').send({ files: delFiles }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			upload.tmpFileExists(dummy.tmpName).should.be.false;
			next();
		});
	});
	it("should success for dummy2.txt and dummy3.txt", function (next) {
		var delFiles = [];
		var dummy2 = l.find(files, function (file) {
			return file.name === 'dummy2.txt';
		});
		var dummy3 = l.find(files, function (file) {
			return file.name === 'dummy3.txt';
		});
		delFiles.push(dummy2);
		delFiles.push(dummy3);
		upload.tmpFileExists(dummy2.tmpName).should.be.true;
		upload.tmpFileExists(dummy3.tmpName).should.be.true;
		request.del(test.url + '/api/upload').send({ files: delFiles }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			upload.tmpFileExists(dummy2.tmpName).should.be.false;
			upload.tmpFileExists(dummy3.tmpName).should.be.false;
			next();
		});
	});
	it("should success for invalid file", function (next) {
		var delFiles = [];
		var filename = 'xxxxx-nonexist';
		delFiles.push(filename);
		upload.tmpFileExists(filename).should.be.false;
		request.del(test.url + '/api/upload').send({ files: delFiles }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});

});
