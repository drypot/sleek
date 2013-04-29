var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });
var es = require('../main/es')({ dropIndex: true });
var express = require('../main/express');
var error = require('../main/error');
var test = require('../main/test')({ request: request });

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
			res.should.have.status(200);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
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
			res.should.have.status(200);
			should.not.exist(res.body.err);
			t1 = res.body.threadId;
			next();
		});
	});
	it("should fail with threadId 99999", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/99999').send(form).end(function (err, res) {
			res.should.have.status(200);
			res.body.err.rc.should.equal(error.INVALID_THREAD);
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
			res.should.have.status(200);
			res.body.err.rc.should.equal(error.INVALID_DATA);
			res.body.err.fields.some(function (field) {
				return field.name === 'writer' && field.msg === error.msg.FILL_WRITER;
			}).should.true;
			next();
		});
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should.not.exist(res.body.err);
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
			res.should.have.status(200);
			should.not.exist(res.body.err);
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
			res.should.have.status(200);
			res.body.err.rc.should.equal(error.INVALID_CATEGORY);
			next();
		});
	});
	it("given admin session", function (next) {
		test.loginAdmin(next);
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + t2).send(form).end(function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			next();
		});
	});
});