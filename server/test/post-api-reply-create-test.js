var should = require('should');
var request = require('superagent').agent();
var async = require('async');

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
var es = require('../main/es').options({ dropIndex: true });
var express = require('../main/express');
var rcs = require('../main/rcs');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe('post /api/threads/1', function () {
	it('given no session', function (next) {
		test.logout(next);
	});
	it('should fail', function (next) {
		request.post(test.url + '/api/threads/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		test.loginUser(next);
	});
	var tid;
	it('given thread', function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title 1', text: 'head text 1' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			tid = res.body.threadId;
			next();
		});
	});
	it("should fail when threadId is 99999", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/99999').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_THREAD);
			next();
		});
	});
	it("should fail when threadId is xxx", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/xxx').send(form).end(function (err, res) {
			res.status.should.equal(404);
			next();
		});
	});
	it("should fail when writer empty", function (next) {
		var form = { writer: ' ', text: 'text' };
		request.post(test.url + '/api/threads/' + tid).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.indexOf(rcs.msgs.FILL_WRITER).should.not.equal(-1);
			next();
		});
	});
	it('should success', function (next) {
		var form = { writer: 'snowman', text: 'reply text 1' };
		request.post(test.url + '/api/threads/' + tid).send(form).end(function (err, res) {
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.should.have.property('postId');
			next();
		});
	});
	it('given admin session', function (next) {
		test.loginAdmin(next);
	});
	var tid2;
	it('given head of recycle bin', function (next) {
		var form = { categoryId: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			tid2 = res.body.threadId;
			next();
		});
	});
	it('given user session', function (next) {
		test.loginUser(next);
	});
	it('should fail when creating reply on recycle bin', function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + tid2).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('given admin session', function (next) {
		test.loginAdmin(next);
	});
	it('should success when creating reply on recycle bin', function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + tid2).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});