var should = require('should');
var request = require('superagent').agent();

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

describe('get /api/threads/0/0', function () {
	it('given user session', function (next) {
		test.loginUser(next);
	});
	var t1, p11, p12;
	it('given t1, p11', function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title 1', text: 'post 11' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			t1 = res.body.threadId;
			p11 = res.body.postId;
			next();
		});
	});
	it('given p12', function (next) {
		var form = { writer: 'snowman', text: 'post 12' };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			p12 = res.body.postId;
			next();
		});
	});
	it('given admin session', function (next) {
		test.loginAdmin(next);
	});
	var t2, p21, p22;
	it('given t2, p21 in recycle bin', function (next) {
		var form = { categoryId: 40, writer: 'snowman', title: 'title 2', text: 'post 21' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			t2 = res.body.threadId;
			p21 = res.body.postId;
			next();
		});
	});
	it('given p22 in recycle bin', function (next) {
		var form = { writer: 'snowman', text: 'post 22' };
		request.post(test.url + '/api/threads/' + t2).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			p22 = res.body.postId;
			next();
		});
	});
	it('given no session', function (next) {
		test.logout(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		test.loginUser(next);
	});
	it('should success for p11', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.thread.title.should.equal('title 1');
			res.body.category.id.should.equal(101);
			res.body.post.writer.should.equal('snowman');
			res.body.post.text.should.equal('post 11');
			res.body.post.head.should.true;
			res.body.post.visible.should.true;
			next();
		});
	});
	it('should success for p12', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.writer.should.equal('snowman');
			res.body.post.text.should.equal('post 12');
			res.body.post.head.should.false;
			next();
		});
	});
	it('should fail for p21 in recycle bin', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p21, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('should fail for p22 in recycle bin', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('given admin session', function (next) {
		test.loginAdmin(next);
	});
	it('should success for p21 in recycle bin', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p21, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('should success for p22 in recycle bin', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});

