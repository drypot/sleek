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

describe("post.editable", function () {
	it("given user session", function (next) {
		test.loginUser(next);
	});
	var t1, p11, p12;
	it("given t1, p11", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title 1', text: 'post1' };
			request.post(test.url + '/api/threads').send(form).end(function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next();
			}
		);
	});
	it("given p12", function (next) {
		var form = { writer: 'snowman', text: 'post2' };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			p12 = res.body.postId;
			next();
		});
	});
	it("should be true for p11", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("should be true for p12", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("given new user session", function (next) {
		test.loginUser(next);
	});
	it("should be false for p11", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it("should be false for p12", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it("given admin session", function (next) {
		test.loginAdmin(next);
	});
	it("should be true for p11", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it("should be true for p12", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});

});
