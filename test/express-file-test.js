var _ = require('underscore');
var should = require('should');
var path = require('path');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var upload = require('../main/upload.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,express', next);
});

describe('file api', function () {
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('can receive file', function (next) {
		test.request.post(
			'/api/file',
			{},
			['file1.txt'],
			function (err, res) {
				res.status.should.equal(200);
				var body = res.body;
				body.should.length(1);
				should(upload.tmpFileExists(body[0]));
				next(err);
			}
		);
	});
	it('can receive two files', function (next) {
		test.request.post(
			'/api/file',
			{},
			['file1.txt', 'file2.txt'],
			function (err, res) {
				res.status.should.equal(200);
				var body = res.body;
				body.should.length(2);
				should(upload.tmpFileExists(body[0]));
				should(upload.tmpFileExists(body[1]));
				next(err);
			}
		);
	});
	it('can receive none', function (next) {
		test.request.post(
			'/api/file',
			{ dummy: 'dummy' },
			[],
			function (err, res) {
				res.status.should.equal(200);
				var body = res.body;
				body.should.length(0);
				next(err);
			}
		);
	});
});
