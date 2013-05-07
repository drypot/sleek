var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });
var es = require('../main/es')({ dropIndex: true });
var express = require('../main/express');
var error = require('../main/error');
var ufix = require('../test/user-fixture');

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe("post.editable", function () {
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	var t1, p11, p12;
	it("given tid1, p11", function (next) {
		var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'post1' };
			express.post('/api/threads').send(form).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				t1 = res.body.tid;
				p11 = res.body.pid;
				next();
			}
		);
	});
	it("given p12", function (next) {
		var form = { writer: 'snowman', text: 'post2' };
		express.post('/api/threads/' + t1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			p12 = res.body.pid;
			next();
		});
	});
	it("should be true for p11", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("should be true for p12", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("given new user session", function (next) {
		ufix.loginUser(next);
	});
	it("should be false for p11", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it("should be false for p12", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should be true for p11", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("should be true for p12", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});

});
