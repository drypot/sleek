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

describe("reading post", function () {
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	var tid1, pid1, pid2;
	it("given tid1, pid1", function (next) {
		var form = { cid: 101, writer: 'snowman1', title: 'title1', text: 'post11' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			tid1 = res.body.tid;
			pid1 = res.body.pid;
			next();
		});
	});
	it("given pid2", function (next) {
		var form = { writer: 'snowman1', text: 'post12' };
		express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			pid2 = res.body.pid;
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	var tid2, pid3, pid4;
	it("given tid2, pid3 in recycle bin", function (next) {
		var form = { cid: 40, writer: 'snowman2', title: 'title2', text: 'post21' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			tid2 = res.body.tid;
			pid3 = res.body.pid;
			next();
		});
	});
	it("given pid4 in recycle bin", function (next) {
		var form = { writer: 'snowman2', text: 'post22' };
		express.post('/api/threads/' + tid2).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			pid4 = res.body.pid;
			next();
		});
	});
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should fail with invalid tid", function (next) {
		express.get('/api/threads/' + 99999 + '/' + pid1, function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_THREAD);
			next();
		});
	});
	it("should fail with mismatching tid", function (next) {
		express.get('/api/threads/' + tid2 + '/' + pid1, function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_POST);
			next();
		});
	});
	it("should fail with invalid pid", function (next) {
		express.get('/api/threads/' + tid1 + '/' + 99999, function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_POST);
			next();
		});
	});
	it("should success for pid1", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.thread.title.should.equal('title1');
			res.body.category.id.should.equal(101);
			res.body.post.writer.should.equal('snowman1');
			res.body.post.text.should.equal('post11');
			res.body.post.head.should.true;
			res.body.post.visible.should.true;
			next();
		});
	});
	it("should success for pid2", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.writer.should.equal('snowman1');
			res.body.post.text.should.equal('post12');
			res.body.post.head.should.false;
			res.body.post.visible.should.true;
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should fail for pid3 in recycle bin", function (next) {
		express.get('/api/threads/' + tid2 + '/' + pid3, function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_CATEGORY);
			next();
		});
	});
	it("should fail for pid4 in recycle bin", function (next) {
		express.get('/api/threads/' + tid2 + '/' + pid4, function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_CATEGORY);
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should success for pid3 in recycle bin", function (next) {
		express.get('/api/threads/' + tid2 + '/' + pid3, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.thread.title.should.equal('title2');
			res.body.category.id.should.equal(40);
			res.body.post.writer.should.equal('snowman2');
			res.body.post.text.should.equal('post21');
			res.body.post.head.should.true;
			res.body.post.visible.should.true;
			next();
		});
	});
	it("should success for pid4 in recycle bin", function (next) {
		express.get('/api/threads/' + tid2 + '/' + pid4, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.writer.should.equal('snowman2');
			res.body.post.text.should.equal('post22');
			res.body.post.head.should.false;
			res.body.post.visible.should.true;
			next();
		});
	});
});

