var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var express = require('../main/express');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe("reading thread and posts", function () {
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/api/threads/0', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	var tid;
	it("given thread", function (next) {
		var form = { cid: 101, writer: 'snowman', title: 'title', text: 'post1' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			tid = res.body.tid;
			next();
		});
	});
	it("given reply", function (next) {
		var form = { writer: 'snowman2', text: 'post2' };
		express.post('/api/threads/' + tid).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("should return 2 posts", function (next) {
		express.get('/api/threads/' + tid, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.thread._id.should.equal(tid);
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
		express.post('/api/threads/' + tid).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("should return 3 posts", function (next) {
		express.get('/api/threads/' + tid, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.posts.should.length(3);
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("given another invisible reply", function (next) {
		var form = { writer: 'admin', text: 'post4', visible: false };
		express.post('/api/threads/' + tid).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("should return 4 posts", function (next) {
		express.get('/api/threads/' + tid, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.posts.should.length(4);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should return 3 posts", function (next) {
		express.get('/api/threads/' + tid, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.posts.should.length(3);
			next();
		});
	});
});
