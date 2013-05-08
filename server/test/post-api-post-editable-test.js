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
	var tid1, pid1, pid2;
	it("given tid1, pid1", function (next) {
		var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'post1' };
			express.post('/api/threads').send(form).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				tid1 = res.body.tid;
				pid1 = res.body.pid;
				next();
			}
		);
	});
	it("given pid2", function (next) {
		var form = { writer: 'snowman', text: 'post2' };
		express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			pid2 = res.body.pid;
			next();
		});
	});
	it("should be true for pid1", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("should be true for pid2", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("given new user session", function (next) {
		ufix.loginUser(next);
	});
	it("should be false for pid1", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it("should be false for pid2", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should be true for pid1", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("should be true for pid2", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.editable.should.be.true;
			next();
		});
	});

});
