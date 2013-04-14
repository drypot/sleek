var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l');

require('../main/session-api');
require('../main/post-api');
require('../main/search-api');
require('../main/test');

before(function (next) {
	l.init.run(next);
});

describe('es-rebuild', function () {
	it('given user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	var t1,p1;
	it('and head t1, p1', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 101, writer: 'snowman', title: '첫번째 글줄', text: 'apple pine banana' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p1 = res.body.postId;
				next(err);
			}
		);
	});
	var p2;
	it('and reply p2', function (next) {
		request.post(url + '/api/threads/' + t1,
			{ writer: '김순이', text: '둥글게 네모나게 붉게 파랗게' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p2 = res.body.postId;
				next(err);
			}
		);
	});
	var t2,p3;
	it('and another head t2, p3', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 101, writer: '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
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
		request.get(test.url + '/api/search', { q: '첫번째' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(1);
			r[0].postId.should.equal(p1);
			next(err);
		});
	});
	it("when search p2, should return result", function (next) {
		request.get(test.url + '/api/search', { q: '둥글게 네모나게' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r[0].postId.should.equal(p2);
			next(err);
		});
	});
	it("when search p3, should return result", function (next) {
		request.get(test.url + '/api/search', { q: '박철수' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r[0].postId.should.equal(p3);
			next(err);
		});
	});
	it ("given index droped ", function (next) {
		l.es.dropIndex(next);
	});
	it("when search p1, should return no result", function (next) {
		request.get(test.url + '/api/search', { q: '첫번째' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(0);
			next(err);
		});
	});
	it("when search p2, should return no result", function (next) {
		request.get(test.url + '/api/search', { q: '둥글게 네모나게' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(0);
			next(err);
		});
	});
	it("when search p3, should return no result", function (next) {
		request.get(test.url + '/api/search', { q: '박철수' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
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
		setTimeout(function () {
			request.get(test.url + '/api/search', { q: '첫번째' }, function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				var r = res.body.result;
				r.should.length(1);
				r[0].postId.should.equal(p1);
				next(err);
			});
		}, 1000);
	});
});
