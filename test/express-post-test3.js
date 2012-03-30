var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var es = require('../main/es.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo,es,express', next);
});

describe("search-post", function () {
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
		test.request('/api/logout', next);
	});
	it("can not search post when not logged in", function (next) {
		test.request('/api/search-post', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request('/api/login', { password: '3' }, next);
	});
	it("can search after login", function (next) {
		test.request('/api/search-post', { query: 'hello' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(0);
			next(err);
		});
	});
	it('prepare threads', function (next) {
		async.forEachSeries(doc, function (doc, next) {
			test.request('/api/create-post-head', doc, function (err, res, body) {
				doc.postId = body.postId;
				doc.threadId = body.threadId;
				next(err);
			});
		}, next);
	});
	it('should flush data', function (next) {
		es.flush(next);
	});
	it('assume user', function (next) {
		test.request('/api/login', { password: '1' }, next);
	});
	it("can search user", function (next) {
		test.request('/api/search-post', { query: 'snowman' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(3);
			body[0].title.should.equal('title 3');
			body[1].title.should.equal('title 2');
			body[2].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search title", function (next) {
		test.request('/api/search-post', { query: 'title 4' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].title.should.equal('title 4');
			next(err);
		});
	});
	it("can search text", function (next) {
		test.request('/api/search-post', { query: 'apple orange' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(2);
			body[0].title.should.equal('title 2');
			body[1].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search text 2", function (next) {
		test.request('/api/search-post', { query: 'apple banana' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search text 2", function (next) {
		test.request('/api/search-post', { query: 'apple banana' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(1);
			body[0].title.should.equal('title 1');
			next(err);
		});
	});
	it("can search hangul", function (next) {
		test.request('/api/search-post', { query: '둥글' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(3);
			body[0].title.should.equal('title 5');
			body[1].title.should.equal('title 4');
			body[2].title.should.equal('title 3');
			next(err);
		});
	});
	it("can not search admin category", function (next) {
		test.request('/api/search-post', { query: 'admin' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(0);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request('/api/login', { password: '3' }, next);
	});
	it("can search admin category", function (next) {
		test.request('/api/search-post', { query: 'admin' }, function (err, res, body) {
			res.should.status(200);
			body.should.length(2);
			next(err);
		});
	});
});
