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

describe("updating", function () {
	var t1, p1;
	it("given no session", function (next) {
		test.logout(next);
	});
	it("should fail", function (next) {
		request.put(test.url + '/api/threads/0/0', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("given p11", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			t1 = res.body.threadId;
			p1 = res.body.postId;
			next(err);
		});
	});
	it("should fail when title empty", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: ' ', text: 'text', visible: true };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_DATA);
			res.body.err.fields.some(function (field) {
				return field.name === 'title' && field.msg === error.msg.FILL_TITLE;
			}).should.true;
			next(err);
		});
	});
	it("should fail when writer empty", function (next) {
		var form = { categoryId: 101, writer: ' ', title: 'title', text: 'text', visible: true };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_DATA);
			res.body.err.fields.some(function (field) {
				return field.name === 'writer' && field.msg === error.msg.FILL_WRITER;
			}).should.true;
			next(err);
		});
	});
	it("should success when category not changed", function (next) {
		var form = { categoryId: 101, writer: 'snowman1', title: 'title1', text: 'text1' };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should(!res.error);
				should(!res.body.err);
				res.body.post.head.should.true;
				res.body.category.id.should.equal(101);
				res.body.post.writer.should.equal('snowman1');
				res.body.thread.title.should.equal('title1');
				res.body.post.text.should.equal('text1');
				res.body.post.visible.should.true;
				next(err);
			});
		});
	});
	it("should success when category changed", function (next) {
		var form = { categoryId: 102, writer: 'snowman2', title: 'title2', text: 'text2' };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should(!res.error);
				should(!res.body.err);
				res.body.category.id.should.equal(102);
				next(err);
			});
		});
	});
	it("should success but can not change visible", function (next) {
		var form = { categoryId: 102, writer: 'snowman3', title: 'title3', text: 'text3', visible: false };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should(!res.error);
				should(!res.body.err);
				res.body.post.visible.should.true;
				next(err);
			});
		});
	});
	it("given admin session", function (next) {
		test.loginAdmin(next);
	});
	it("should success and can change visible", function (next) {
		var form = { categoryId: 102, writer: 'snowman4', title: 'title4', text: 'text4', visible: false };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should(!res.error);
				should(!res.body.err);
				res.body.post.visible.should.false;
				next(err);
			});
		});
	});
});

describe("updating reply", function () {
	var t1, p1, p2;
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("given p1", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			t1 = res.body.threadId;
			p1 = res.body.postId;
			next(err);
		});
	});
	it("given p2", function (next) {
		var form = { writer: 'snowman', text: 'text' };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			p2 = res.body.postId;
			next(err);
		});
	});
	it("should success except visible field", function (next) {
		var form = { writer: 'snowman1', text: 'text1', visible: false };
		request.put(test.url + '/api/threads/' + t1 + '/' + p2).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			request.get(test.url + '/api/threads/' + t1 + '/' + p2, function (err, res) {
				should(!res.error);
				should(!res.body.err);
				res.body.post.head.should.false;
				res.body.post.writer.should.equal('snowman1');
				res.body.post.text.should.equal('text1');
				res.body.post.visible.should.true;
				next(err);
			});
		});
	});
});

describe("updating recycle bin", function () {
	var t1, p1;
	it("given admin session", function (next) {
		test.loginAdmin(next);
	});
	it("given p11 in recyle bin", function (next) {
		var form = { categoryId: 40, writer: 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			t1 = res.body.threadId;
			p1 = res.body.postId;
			next(err);
		});
	});
	it("should success", function (next) {
		var form = { categoryId: 40, writer: 'snowman1', title: 'title1', text: 'text1' };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next(err);
		});
	});
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("should fail", function (next) {
		var form = { categoryId: 40, writer: 'snowman1', title: 'title1', text: 'text1' };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_CATEGORY);
			next(err);
		});
	});
});
