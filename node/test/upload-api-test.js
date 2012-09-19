var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l.js');

require('../main/session-api.js');
require('../main/upload-api.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('upload api', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('when upload one file, keeps it in tmp dir, and return upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt'], function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
//				console.log(res.body);
				var uploadTmp = res.body.uploadTmp;
				console.log(uploadTmp);
				should.exist(uploadTmp['file1.txt']);
				l.upload.tmpExists(uploadTmp['file1.txt']).should.be.ok;
				next(err);
			}
		);
	});
	it('when upload two files, keeps them in tmp dir, and return upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt', 'file2.txt'], function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
//				console.log(res.body);
				var uploadTmp = res.body.uploadTmp;
				should.exist(uploadTmp['file1.txt']);
				should.exist(uploadTmp['file2.txt']);
				l.upload.tmpExists(uploadTmp['file1.txt']).should.be.ok;
				l.upload.tmpExists(uploadTmp['file2.txt']).should.be.ok;
				next(err);
			}
		);
	});
	it('when upload none, return empty upload', function (next) {
		l.test.request.post('/api/upload', { dummy: 'dummy' }, [],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
//				console.log(res.body);
				var uploadTmp = res.body.uploadTmp;
				_.keys(uploadTmp).should.be.empty;
				next(err);
			}
		);
	});
});
