var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });
var post = require('../main/post');
var express = require('../main/express');
var error = require('../main/error');
var ufix = require('../test/user-fixture');

require('../main/session-api');
require('../main/post-api');
require('../main/search-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

var tid1, tid2;
var pid1, pid2, pid3;

describe("posting", function () {
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success for tid1, pid1", function (next) {
		var form = { cid: 101, writer: 'snowman', title: '첫번째 글줄', text: 'apple pine banana' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			tid1 = res.body.tid;
			pid1 = res.body.pid;
			next();
		});
	});
	it("should success for pid2", function (next) {
		var form = { writer: '김순이', text: '둥글게 네모나게 붉게 파랗게' };
		express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			pid2 = res.body.pid;
			next();
		});
	});
	it("should success for tid2, pid3", function (next) {
		var form = { cid: 101, writer: '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			tid2 = res.body.tid;
			pid3 = res.body.pid;
			next();
		});
	});
});

describe("searching", function () {
	it("should success for pid1", function (next) {
		express.get('/api/search').query({ q: '첫번째' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.posts;
			r.should.length(1);
			r[0]._id.should.equal(pid1);
			next();
		});
	});
	it("should success for pid2", function (next) {
		express.get('/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.posts;
			r.should.length(1);
			r[0]._id.should.equal(pid2);
			next();
		});
	});
	it("should success for pid3", function (next) {
		express.get('/api/search').query({ q: '박철수' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.posts;
			r.should.length(1);
			r[0]._id.should.equal(pid3);
			next();
		});
	});
});

describe("dropping tokens", function () {
	it("should success", function (next) {
		mongo.posts.update({}, { $unset: { tokens: 1 } }, { multi: true }, next);
	});
});

describe("searching emtpy tokens", function () {
	it("should return nothing for pid1", function (next) {
		express.get('/api/search').query({ q: '첫번째' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.posts.should.length(0);
			next();
		});
	});
	it("should return nothing for pid2", function (next) {
		express.get('/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.posts.should.length(0);
			next();
		});
	});
	it("should return nothing for pid3", function (next) {
		express.get('/api/search').query({ q: '박철수' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.posts;
			res.body.posts.should.length(0);
			next();
		});
	});
});

describe("rebuilding", function () {
	it("should success", function (next) {
		post.rebuildTokens(next);
	});
});

describe("re-searching", function () {
	it("should success for pid1", function (next) {
		express.get('/api/search').query({ q: '첫번째' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.posts;
			r.should.length(1);
			r[0]._id.should.equal(pid1);
			next();
		});
	});
	it("should success for pid2", function (next) {
		express.get('/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.posts;
			r.should.length(1);
			r[0]._id.should.equal(pid2);
			next();
		});
	});
	it("should success for pid3", function (next) {
		express.get('/api/search').query({ q: '박철수' }).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.posts;
			r.should.length(1);
			r[0]._id.should.equal(pid3);
			next();
		});
	});
});