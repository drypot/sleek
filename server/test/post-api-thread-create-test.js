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

describe('post /api/threads', function () {
	it('given no session', function (next) {
		test.logout(next);
	});
	it("should fail", function (next) {
		request.post(test.url + '/api/threads', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		test.loginUser(next);
	});
	it("should fail when categoryId invalid", function (next) {
		var form = { categoryId: 10100, writer: 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it("should fail when title empty", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: ' ', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.should.include(msgs.FILL_TITLE);
			next();
		});
	});
	it("should fail when title big", function (next) {
		var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
		var form = { categoryId: 101, writer: 'snowman', text: 'text', title: bigTitle };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.should.include(msgs.SHORTEN_TITLE);
			next();
		});
	});
	it("should fail when writer empty", function (next) {
		var form = { categoryId: 101, writer: ' ', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.should.include(msgs.FILL_WRITER);
			next();
		});
	});
	it("should fail when writer big", function (next) {
		var form = { categoryId: 101, writer: '123456789012345678901234567890123', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.should.include(msgs.SHORTEN_WRITER);
			next();
		});
	});
	it('should fail when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer: 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('should success', function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title 1', text: 'post11' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.should.have.property('threadId');
			res.body.should.have.property('postId');
			next();
		});
	});
	it('given admin session', function (next) {
		test.loginAdmin(next);
	});
	it('should success when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});
