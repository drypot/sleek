var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
var es = require('../main/es').options({ dropIndex: true });
var express = require('../main/express');
var rcs = require('../main/rcs');
var msgs = require('../main/msgs');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe("creating post/replay", function () {
	it("given no session", function (next) {
		test.logout(next);
	});
	it("should fail", function (next) {
		request.post(test.url + '/api/threads/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		test.loginUser(next);
	});
	var t1;
	it("given t1", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title 1', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			t1 = res.body.threadId;
			next();
		});
	});
	it("should fail with threadId 99999", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/99999').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_THREAD);
			next();
		});
	});
	it("should fail with threadId xxx", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/xxx').send(form).end(function (err, res) {
			res.status.should.equal(404);
			next();
		});
	});
	it("should fail with writer empty", function (next) {
		var form = { writer: ' ', text: 'text' };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.should.include(msgs.FILL_WRITER);
			next();
		});
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.should.have.property('postId');
			next();
		});
	});
});

describe("creating post/replay in recycle bin", function () {
	it("given admin session", function (next) {
		test.loginAdmin(next);
	});
	var t2;
	it("given t2", function (next) {
		var form = { categoryId: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			t2 = res.body.threadId;
			next();
		});
	});
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("should fail", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + t2).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it("given admin session", function (next) {
		test.loginAdmin(next);
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + t2).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});