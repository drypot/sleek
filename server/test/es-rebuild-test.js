var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
var es = require('../main/es').options({ dropIndex: true });
var rebuild = require('../main/es-rebuild');
var express = require('../main/express');
var rcs = require('../main/rcs');
var msgs = require('../main/msgs');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');
require('../main/search-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

var t1, p1, p2, t2, p3;

describe("posting", function () {
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("should success for t1, p1", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: '첫번째 글줄', text: 'apple pine banana' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			t1 = res.body.threadId;
			p1 = res.body.postId;
			next();
		});
	});
	it("should success for p2", function (next) {
		var form = { writer: '김순이', text: '둥글게 네모나게 붉게 파랗게' };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			p2 = res.body.postId;
			next();
		});
	});
	it("should success for t2, p3", function (next) {
		var form = { categoryId: 101, writer: '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			t2 = res.body.threadId;
			p3 = res.body.postId;
			next();
		});
	});
});

describe("flushing", function () {
	it("should success", function (next) {
		es.flush(next);
	});
});

describe("searching", function () {
	it("should success for p1", function (next) {
		request.get(test.url + '/api/search').query({ q: '첫번째' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.results;
			r.should.length(1);
			r[0].postId.should.equal(p1);
			next();
		});
	});
	it("should success for p2", function (next) {
		request.get(test.url + '/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.results;
			r.should.length(1);
			r[0].postId.should.equal(p2);
			next();
		});
	});
	it("should success for p3", function (next) {
		request.get(test.url + '/api/search').query({ q: '박철수' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.results;
			r.should.length(1);
			r[0].postId.should.equal(p3);
			next();
		});
	});
});

describe("dropping es", function () {
	it("should success", function (next) {
		es.dropIndex(function (err) {
			if (err) return next(err);
			es.setSchema(function (err) {
				if (err) return next(err);
				setTimeout(next, 300);
			});
		});
	});
});

describe("searching emtpy es", function () {
	it("should success for p1", function (next) {
		request.get(test.url + '/api/search').query({ q: '첫번째' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.results.should.length(0);
			next();
		});
	});
	it("should success for p2", function (next) {
		request.get(test.url + '/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.results.should.length(0);
			next();
		});
	});
	it("should success for p3", function (next) {
		request.get(test.url + '/api/search').query({ q: '박철수' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.results;
			res.body.results.should.length(0);
			next();
		});
	});
});

describe("rebuilding", function () {
	it("should success", function (next) {
		rebuild.rebuild(next);
	});
});

describe("flushing", function () {
	it("should success", function (next) {
		es.flush(function (err) {
			setTimeout(next, 1000);
		});
	});
});

describe("re-searching", function () {
	it("should success for p1", function (next) {
		request.get(test.url + '/api/search').query({ q: '첫번째' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.results;
			r.should.length(1);
			r[0].postId.should.equal(p1);
			next();
		});
	});
	it("should success for p2", function (next) {
		request.get(test.url + '/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.results;
			r.should.length(1);
			r[0].postId.should.equal(p2);
			next();
		});
	});
	it("should success for p3", function (next) {
		request.get(test.url + '/api/search').query({ q: '박철수' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.results;
			r.should.length(1);
			r[0].postId.should.equal(p3);
			next();
		});
	});
});