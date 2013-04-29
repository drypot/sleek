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

describe("reading thread and posts", function () {
	it("given no session", function (next) {
		test.logout(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/threads/0', function (err, res) {
			res.should.have.status(200);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		test.loginUser(next);
	});
	var tid;
	it("given thread", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title', text: 'post1' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			tid = res.body.threadId;
			next();
		});
	});
	it("given reply", function (next) {
		var form = { writer: 'snowman2', text: 'post2' };
		request.post(test.url + '/api/threads/' + tid).send(form).end(function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			next();
		});
	});
	it("should return 2 posts", function (next) {
		request.get(test.url + '/api/threads/' + tid, function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			res.body.thread.id.should.equal(tid);
			res.body.thread.title.should.equal('title');
			res.body.category.id.should.equal(101);
			res.body.posts.should.length(2);
			res.body.posts[0].writer.should.equal('snowman');
			res.body.posts[0].text.should.equal('post1');
			res.body.posts[1].writer.should.equal('snowman2');
			res.body.posts[1].text.should.equal('post2');
			next();
		});
	});
	it("given another reply", function (next) {
		var form = { writer: 'snowman2', text: 'post3' };
		request.post(test.url + '/api/threads/' + tid).send(form).end(function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			next();
		});
	});
	it("should return 3 posts", function (next) {
		request.get(test.url + '/api/threads/' + tid, function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			res.body.posts.should.length(3);
			next();
		});
	});
	it("given admin session", function (next) {
		test.loginAdmin(next);
	});
	it("given another invisible reply", function (next) {
		var form = { writer: 'admin', text: 'post4', visible: false };
		request.post(test.url + '/api/threads/' + tid).send(form).end(function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			next();
		});
	});
	it("should return 4 posts", function (next) {
		request.get(test.url + '/api/threads/' + tid, function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			res.body.posts.should.length(4);
			next();
		});
	});
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("should return 3 posts", function (next) {
		request.get(test.url + '/api/threads/' + tid, function (err, res) {
			res.should.have.status(200);
			should.not.exist(res.body.err);
			res.body.posts.should.length(3);
			next();
		});
	});
});
