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
		should.not.exist(err);
		res.status.should.equal(200);
		res.body.rc.should.equal(rcs.SUCCESS);
		res.body.role.name.should.equal('user');
		next();
	});
});

describe('uploading none', function () {
	it('should success', function (next) {
		request
			.post(url + '/api/upload')
			.end(function (err, res) {
				should.not.exist(err);
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
//				console.log(res.body);
				var files = res.body.files;
				Object.keys(files).should.be.empty;
				next();
			});
	});
});

describe('uploading one file', function () {
	it('should success', function (next) {
		request
			.post(url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.end(function (err, res) {
				should.not.exist(err);
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
//				console.log(res.body);
				var files = res.body.files;
				files.should.have.property('dummy.txt');
				upload.tmpFileExists(files['dummy.txt']).should.be.true;
				next();
			});
	});
});

describe('uploading two files', function () {
	it('should success', function (next) {
		request
			.post(url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.attach('file', 'server/test/fixture/dummy2.txt')
			.end(function (err, res) {
				should.not.exist(err);
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
//				console.log(res.body);
				var files = res.body.files;
				files.should.have.property('dummy.txt');
				files.should.have.property('dummy2.txt');
				upload.tmpFileExists(files['dummy.txt']).should.be.true;
				upload.tmpFileExists(files['dummy2.txt']).should.be.true;
				next();
			});
	});
});

describe('deleting file', function () {
	var files;
	it('given two uploaded files', function (next) {
		request
			.post(url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.attach('file', 'server/test/fixture/dummy2.txt')
			.attach('file', 'server/test/fixture/dummy3.txt')
			.end(function (err, res) {
				should.not.exist(err);
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				files = res.body.files;
				next();
			});
	});
	it('should success for dummy.txt', function (next) {
		var delFiles = [];
		delFiles.push(files['dummy.txt']);
		upload.tmpFileExists(files['dummy.txt']).should.be.true;
		request.del(url + '/api/upload').send({ files: delFiles }).end(function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			upload.tmpFileExists(files['dummy.txt']).should.be.false;
			next();
		});
	});
	it('should success for dummy2.txt and dummy3.txt', function (next) {
		var delFiles = [];
		delFiles.push(files['dummy2.txt']);
		delFiles.push(files['dummy3.txt']);
		upload.tmpFileExists(files['dummy2.txt']).should.be.true;
		upload.tmpFileExists(files['dummy3.txt']).should.be.true;
		request.del(url + '/api/upload').send({ files: delFiles }).end(function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			upload.tmpFileExists(files['dummy2.txt']).should.be.false;
			upload.tmpFileExists(files['dummy3.txt']).should.be.false;
			next();
		});
	});
	it('should success for invalid file', function (next) {
		var delFiles = [];
		var filename = 'xxxxx-nonexist';
		delFiles.push(filename);
		upload.tmpFileExists(filename).should.be.false;
		request.del(url + '/api/upload').send({ files: delFiles }).end(function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});

});
