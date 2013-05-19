var should = require('should');
var fs = require('fs');

var l = require('../main/l');
var init = require('../main/init');
var config = require('../main/config')({ test: true });
var upload = require('../main/upload');
var express = require('../main/express');
var error = require('../main/error');
var ufix = require('../test/user-fixture');

require('../main/session-api');
require('../main/upload-api');
require('../main/upload-html');

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
		express.post('/api/upload').end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			should(res.body.files);
			Object.keys(res.body.files).should.be.empty;
			next();
		});
	});
});

function find(files, oname) {
	var file = l.find(files, function (file) {
		return file.oname === oname;
	});
	should.exist(file);
	return file;
}

function exists(file) {
	fs.existsSync(upload.getTmpPath(file.tname)).should.be.true;
}

function nexists(file) {
	fs.existsSync(upload.getTmpPath(file.tname)).should.be.false;
}

describe("uploading one file", function () {
	it("should success", function (next) {
		var f1 = 'server/test/fixture/dummy1.txt';
		express.post('/api/upload').attach('file', f1).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			exists(find(res.body.files, 'dummy1.txt'));
			next();
		});
	});
});

describe("uploading two files", function () {
	it("should success", function (next) {
		var f1 = 'server/test/fixture/dummy1.txt';
		var f2 = 'server/test/fixture/dummy2.txt';
		express.post('/api/upload').attach('file', f1).attach('file', f2).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			exists(find(res.body.files, 'dummy1.txt'));
			exists(find(res.body.files, 'dummy2.txt'));
			next();
		});
	});
});

describe("uploading two files to html", function () {
	it("should success", function (next) {
		var f1 = 'server/test/fixture/dummy1.txt';
		var f2 = 'server/test/fixture/dummy2.txt';
		express.post('/upload').attach('file', f1).attach('file', f2).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			res.should.be.html;
			var body = JSON.parse(res.text);
			exists(find(body.files, 'dummy1.txt'));
			exists(find(body.files, 'dummy2.txt'));
			next();
		});
	});
});

describe("deleting file", function () {
	var _files;
	it("given three uploaded files", function (next) {
		var f1 = 'server/test/fixture/dummy1.txt';
		var f2 = 'server/test/fixture/dummy2.txt';
		var f3 = 'server/test/fixture/dummy3.txt';
		express.post('/api/upload').attach('file', f1).attach('file', f2).attach('file', f3).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			_files = res.body.files;
			next();
		});
	});
	it("should success for dummy1.txt", function (next) {
		var dummy = find(_files, 'dummy1.txt');
		var files = [];
		exists(dummy);
		files.push(dummy);
		express.del('/api/upload').send({ files: files }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			nexists(dummy);
			next();
		});
	});
	it("should success for dummy2.txt and dummy3.txt", function (next) {
		var files = [];
		var dummy2 = find(_files, 'dummy2.txt');
		var dummy3 = find(_files, 'dummy3.txt');
		exists(dummy2);
		exists(dummy3);
		files.push(dummy2);
		files.push(dummy3);
		express.del('/api/upload').send({ files: files }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			nexists(dummy2);
			nexists(dummy3);
			next();
		});
	});
	it("should success for invalid file", function (next) {
		var files = [];
		var file = {
			oname: 'non-exist',
			tname: 'xxxxx-non-exist'
		};
		nexists(file);
		files.push(file);
		express.del('/api/upload').send({ files: files }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});

});
