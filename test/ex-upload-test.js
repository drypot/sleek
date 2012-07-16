var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l.js');

require('../main/ex-upload.js');
require('../main/ex-session.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('upload api', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('when uploaded one file, keeps it in tmp dir, and return tmp', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt'], function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
//				console.log(res.body);
				var tmp = res.body.tmp;
				tmp.should.length(1);
				tmp[0].org.should.equal('file1.txt');
				l.upload.existsTmp(tmp[0].tmp).should.be.ok;
				next(err);
			}
		);
	});
	it('when uploaded two files, keeps them in tmp dir, and return tmp', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt', 'file2.txt'], function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
//				console.log(res.body);
				var tmp = res.body.tmp;
				tmp.should.length(2);
				tmp[0].org.should.equal('file1.txt');
				tmp[1].org.should.equal('file2.txt');
				l.upload.existsTmp(tmp[0].tmp).should.be.ok;
				l.upload.existsTmp(tmp[1].tmp).should.be.ok;
				next(err);
			}
		);
	});
	it('when uploaded none, return empty tmp', function (next) {
		l.test.request.post('/api/upload', { dummy: 'dummy' }, [],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
//				console.log(res.body);
				var tmp = res.body.tmp;
				tmp.should.be.empty;
				next(err);
			}
		);
	});
});
