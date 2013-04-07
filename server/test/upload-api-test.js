var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var rcs = require('../main/rcs');

var config = require('../main/config')({ test: true });
var auth = require('../main/auth')({ config: config });
var upload = require('../main/upload')({ config: config });

var app = express();

require('../main/express')({ config: config, auth: auth, app: app });
require('../main/session-api')({ config: config, auth: auth, app: app });
require('../main/upload-api')({ upload: upload, app: app });

app.listen(config.port);

var url = 'http://localhost:' + config.port;

var USER_PASS = '1';
var ADMIN_PASS = '3';

it('given user session', function (next) {
	request.post(url + '/api/session').send({ password: USER_PASS }).end(function (err, res) {
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		res.body.role.name.should.equal('user');
		next();
	});
});

describe.skip('uploading none', function () {
	it('should success', function (next) {
		request.post('/api/upload').end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var tmpFiles = res.body.tmpFiles;
			Object.keys(tmpFiles).should.be.empty;
			next(err);
		});
	});
});

describe.skip('uploading one file', function () {
	it('should success', function (next) {
		request.post('/api/upload', {}, ['file1.txt'], function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
//				console.log(res.body);
				var tmpFiles = res.body.tmpFiles;
				console.log(tmpFiles);
				should.exist(tmpFiles['file1.txt']);
				upload.tmpExists(tmpFiles['file1.txt']).should.be.ok;
				next(err);
			}
		);
	});
});

describe.skip('uploading two files', function () {
	it('should success', function (next) {
		request.post('/api/upload', {}, ['file1.txt', 'file2.txt'], function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
//				console.log(res.body);
				var tmpFiles = res.body.tmpFiles;
				should.exist(tmpFiles['file1.txt']);
				should.exist(tmpFiles['file2.txt']);
				upload.tmpExists(tmpFiles['file1.txt']).should.be.ok;
				upload.tmpExists(tmpFiles['file2.txt']).should.be.ok;
				next(err);
			}
		);
	});
});
