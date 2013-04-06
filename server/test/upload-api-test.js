var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l');

require('../main/session-api');
require('../main/upload-api');
require('../main/test');

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
				var tmpFiles = res.body.tmpFiles;
				console.log(tmpFiles);
				should.exist(tmpFiles['file1.txt']);
				l.upload.tmpExists(tmpFiles['file1.txt']).should.be.ok;
				next(err);
			}
		);
	});
	it('when upload two files, keeps them in tmp dir, and return upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt', 'file2.txt'], function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
//				console.log(res.body);
				var tmpFiles = res.body.tmpFiles;
				should.exist(tmpFiles['file1.txt']);
				should.exist(tmpFiles['file2.txt']);
				l.upload.tmpExists(tmpFiles['file1.txt']).should.be.ok;
				l.upload.tmpExists(tmpFiles['file2.txt']).should.be.ok;
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
				var tmpFiles = res.body.tmpFiles;
				_.keys(tmpFiles).should.be.empty;
				next(err);
			}
		);
	});
});
