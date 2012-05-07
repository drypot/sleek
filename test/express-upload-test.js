var _ = require('underscore');
var should = require('should');
var path = require('path');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var upload = require('../main/upload.js');
var express = require('../main/express.js');
var test = require('./test.js');

before(function (next) {
	test.prepare(next);
});

describe('file api', function () {
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('can keep tmp file', function (next) {
		test.request.post('/api/upload', {}, ['file1.txt'], function (err, res) {
				res.status.should.equal(200);
//				l.c(res.body);
				var body = res.body;
				body.should.length(1);
				body[0].org.should.equal('file1.txt');
				should(upload.tmpFileExists(body[0].tmp));
				next(err);
			}
		);
	});
	it('can keep two tmp files', function (next) {
		test.request.post('/api/upload', {}, ['file1.txt', 'file2.txt'], function (err, res) {
				res.status.should.equal(200);
//				l.c(res.body);
				var body = res.body;
				body.should.length(2);
				body[0].org.should.equal('file1.txt');
				body[1].org.should.equal('file2.txt');
				should(upload.tmpFileExists(body[0].tmp));
				should(upload.tmpFileExists(body[1].tmp));
				next(err);
			}
		);
	});
	it('can receive none', function (next) {
		test.request.post('/api/upload', { dummy: 'dummy' }, [],
			function (err, res) {
				res.status.should.equal(200);
//				l.c(res.body);
				var body = res.body;
				body.should.length(0);
				next(err);
			}
		);
	});
});
