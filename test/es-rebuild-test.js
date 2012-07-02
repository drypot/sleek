var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l');
var es = require('../main/es.js');
var rebuild = require('../main/es-rebuild.js');
var express = require('../main/express.js');
var test = require('./test.js');

before(function (next) {
	test.runInit(next);
});

describe('es-rebuild', function () {
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	var t1,p1;
	it('can create head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: '첫번째 글줄', text: 'apple pine banana' },
			function (err, res) {
				res.status.should.equal(200);
				t1 = res.body.threadId;
				p1 = res.body.postId;
				next(err);
			}
		);
	});
	var p2;
	it('can create reply', function (next) {
		test.request.post('/api/thread/' + t1,
			{ userName : '김순이', text: '둥글게 네모나게 붉게 파랗게' },
			function (err, res) {
				res.status.should.equal(200);
				p2 = res.body.postId;
				next(err);
			}
		);
	});
	var t2,p3;
	it('can create head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' },
			function (err, res) {
				res.status.should.equal(200);
				t2 = res.body.threadId;
				p3 = res.body.postId;
				next(err);
			}
		);
	});
	it('can flush data', function (next) {
		es.flush(next);
	});
	it("should success to search p1", function (next) {
		test.request.get('/api/search', { q: '첫번째' }, function (err, res) {
			res.status.should.equal(200);
			res.body.length.should.equal(1);
			res.body[0].postId.should.equal(p1);
			next(err);
		});
	});
	it("should success to search p2", function (next) {
		test.request.get('/api/search', { q: '둥글게 네모나게' }, function (err, res) {
			res.status.should.equal(200);
			res.body[0].postId.should.equal(p2);
			next(err);
		});
	});
	it("should success to search p3", function (next) {
		test.request.get('/api/search', { q: '박철수' }, function (err, res) {
			res.status.should.equal(200);
			res.body[0].postId.should.equal(p3);
			next(err);
		});
	});
	it ("can drop index", function (next) {
		es.dropIndex(next);
	});
	it("should fail to search p1", function (next) {
		test.request.get('/api/search', { q: '첫번째' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(0);
			next(err);
		});
	});
	it("should fail to search p2", function (next) {
		test.request.get('/api/search', { q: '둥글게 네모나게' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(0);
			next(err);
		});
	});
	it("should fail to search p3", function (next) {
		test.request.get('/api/search', { q: '박철수' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(0);
			next(err);
		});
	});
	it ("can rebuild index", function (next) {
		rebuild.rebuild(next);
	});
	it('can flush data', function (next) {
		es.flush(next);
	});
	it("should success to search p1", function (next) {
		setTimeout(function () {
			test.request.get('/api/search', { q: '첫번째' }, function (err, res) {
				res.status.should.equal(200);
				res.body.length.should.equal(1);
				res.body[0].postId.should.equal(p1);
				next(err);
			});

		}, 1000);
//		test.request.get('/api/search', { q: '첫번째' }, function (err, res) {
//			res.status.should.equal(200);
//			res.body.length.should.equal(1);
//			res.body[0].postId.should.equal(p1);
//			next(err);
//		});
	});
});
