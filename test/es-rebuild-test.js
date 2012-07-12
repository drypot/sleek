var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l');

require('../main/es.js');
require('../main/ex-session.js');
require('../main/ex-post.js');
require('../main/ex-search.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('es-rebuild', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var t1,p1;
	it('and head t1, p1', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: '첫번째 글줄', text: 'apple pine banana' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				t1 = res.body.threadId;
				p1 = res.body.postId;
				next(err);
			}
		);
	});
	var p2;
	it('and reply p2', function (next) {
		l.test.request.post('/api/thread/' + t1,
			{ userName : '김순이', text: '둥글게 네모나게 붉게 파랗게' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				p2 = res.body.postId;
				next(err);
			}
		);
	});
	var t2,p3;
	it('and another head t2, p3', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				t2 = res.body.threadId;
				p3 = res.body.postId;
				next(err);
			}
		);
	});
	it('and flushed data', function (next) {
		l.es.flush(next);
	});
	it("when search p1, should return result", function (next) {
		l.test.request.get('/api/search', { q: '첫번째' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			var r = res.body.result;
			r.should.length(1);
			r[0].postId.should.equal(p1);
			next(err);
		});
	});
	it("when search p2, should return result", function (next) {
		l.test.request.get('/api/search', { q: '둥글게 네모나게' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			var r = res.body.result;
			r[0].postId.should.equal(p2);
			next(err);
		});
	});
	it("when search p3, should return result", function (next) {
		l.test.request.get('/api/search', { q: '박철수' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			var r = res.body.result;
			r[0].postId.should.equal(p3);
			next(err);
		});
	});
	it ("given index droped ", function (next) {
		l.es.dropIndex(next);
	});
	it("when search p1, should return no result", function (next) {
		l.test.request.get('/api/search', { q: '첫번째' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			var r = res.body.result;
			r.should.length(0);
			next(err);
		});
	});
	it("when search p2, should return no result", function (next) {
		l.test.request.get('/api/search', { q: '둥글게 네모나게' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			var r = res.body.result;
			r.should.length(0);
			next(err);
		});
	});
	it("when search p3, should return no result", function (next) {
		l.test.request.get('/api/search', { q: '박철수' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			var r = res.body.result;
			r.should.length(0);
			next(err);
		});
	});
	it ("given rebuilded index", function (next) {
		l.es.rebuild(next);
	});
	it('and flushed data', function (next) {
		l.es.flush(next);
	});
	it("when search p1, should return result", function (next) {
		l.test.request.get('/api/search', { q: '첫번째' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			var r = res.body.result;
			r.should.length(1);
			r[0].postId.should.equal(p1);
			next(err);
		});
	});
});
