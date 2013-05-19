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
			should(res.body.fnames);
			Object.keys(res.body.fnames).should.be.empty;
			next();
		});
	});
});

function find(fnames, orgName) {
	var fname = l.find(fnames, function (fname) {
		return fname.orgName === orgName;
	});
	should.exist(fname);
	return fname;
}

function exists(fname) {
	fs.existsSync(upload.tmp + '/' + fname.tmpName).should.be.true;
}

function notExists(fname) {
	fs.existsSync(upload.tmp + '/' + fname.tmpName).should.be.false;
}

describe("uploading one file", function () {
	it("should success", function (next) {
		var f1 = 'server/test/fixture/dummy1.txt';
		express.post('/api/upload').attach('file', f1).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			exists(find(res.body.fnames, 'dummy1.txt'));
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
			exists(find(res.body.fnames, 'dummy1.txt'));
			exists(find(res.body.fnames, 'dummy2.txt'));
			next();
		});
	});
});

describe("deleting file", function () {
	var _fnames;
	it("given three uploaded files", function (next) {
		var f1 = 'server/test/fixture/dummy1.txt';
		var f2 = 'server/test/fixture/dummy2.txt';
		var f3 = 'server/test/fixture/dummy3.txt';
		express.post('/api/upload').attach('file', f1).attach('file', f2).attach('file', f3).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			_fnames = res.body.fnames;
			next();
		});
	});
	it("should success for dummy1.txt", function (next) {
		var dummy = find(_fnames, 'dummy1.txt');
		var fnames = [];
		exists(dummy);
		fnames.push(dummy);
		express.del('/api/upload').send({ fnames: fnames }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			notExists(dummy);
			next();
		});
	});
	it("should success for dummy2.txt and dummy3.txt", function (next) {
		var fnames = [];
		var dummy2 = find(_fnames, 'dummy2.txt');
		var dummy3 = find(_fnames, 'dummy3.txt');
		exists(dummy2);
		exists(dummy3);
		fnames.push(dummy2);
		fnames.push(dummy3);
		express.del('/api/upload').send({ fnames: fnames }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			notExists(dummy2);
			notExists(dummy3);
			next();
		});
	});
	it("should success for invalid file", function (next) {
		var fnames = [];
		var fname = {
			orgName: 'non-exist',
			tmpName: 'xxxxx-non-exist'
		};
		notExists(fname);
		fnames.push(fname);
		express.del('/api/upload').send({ fnames: fnames }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});

});
