var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var es = require('../main/es.js');
var express = require('../main/express.js');
var test = require('./test.js');

before(function (next) {
	test.runInit(next);
});

describe("search", function () {
	var doc = [
		{ categoryId: 100, userName : 'snowman', title: 'title 1', text: 'apple orange banana' },
		{ categoryId: 100, userName : 'snowman', title: 'title 2', text: 'apple orange pine' },
		{ categoryId: 100, userName : 'snowman', title: 'title 3', text: '둥글게 네모나게' },
		{ categoryId: 100, userName : 'santa',   title: 'title 4', text: '둥글게 세모나게' },
		{ categoryId: 300, userName : 'santa',   title: 'title 5', text: '둥글게 동그랗게' },
		{ categoryId: 300, userName : 'rudolph', title: 'title 6', text: 'text 6' },
		{ categoryId:  40, userName : 'admin',   title: 'title 7', text: 'text 7' },
		{ categoryId:  40, userName : 'admin',   title: 'title 8', text: 'text 7' }
	];

	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it("can not search post when not logged in", function (next) {
		test.request.get('/api/search', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it("can search after login", function (next) {
		test.request.get('/api/search', { q: 'hello' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(0);
			next(err);
		});
	});
	it('prepare threads', function (next) {
		async.forEachSeries(doc, function (doc, next) {
			test.request.post('/api/thread', doc, function (err, res) {
				doc.postId = res.body.postId;
				doc.threadId = res.body.threadId;
				next(err);
			});
		}, next);
	});
	it('should flush data', function (next) {
		es.flush(next);
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it("can search user", function (next) {
		test.request.get('/api/search', { q: 'snowman' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(3);
			res.body[0].title.should.equal('title 3');
			res.body[1].title.should.equal('title 2');
			res.body[2].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search title", function (next) {
		test.request.get('/api/search', { q: 'title 4' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(1);
			res.body[0].title.should.equal('title 4');
			next(err);
		});
	});
	it("can search text", function (next) {
		test.request.get('/api/search', { q: 'apple orange' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(2);
			res.body[0].title.should.equal('title 2');
			res.body[1].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search text 2", function (next) {
		test.request.get('/api/search', { q: 'apple banana' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(1);
			res.body[0].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search text 2", function (next) {
		test.request.get('/api/search', { q: 'apple banana' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(1);
			res.body[0].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search hangul", function (next) {
		test.request.get('/api/search', { q: '둥글' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(3);
			res.body[0].title.should.equal('title 5');
			res.body[1].title.should.equal('title 4');
			res.body[2].title.should.equal('title 3');
			next(err);
		});
	});
	it("can not search admin category", function (next) {
		test.request.get('/api/search', { q: 'admin' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(0);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it("can search admin category", function (next) {
		test.request.get('/api/search', { q: 'admin' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(2);
			next(err);
		});
	});
});
