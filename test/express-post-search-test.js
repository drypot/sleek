var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo,esearch,express', next);
});

describe("search-post", function () {
	var doc = [
		{ categoryId: 100, userName : 'snowman', title: 'title 1', text: '둥글게 네모나게' },
		{ categoryId: 100, userName : 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 100, userName : 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 100, userName : 'santa',   title: 'title 4', text: 'text 4' },
		{ categoryId: 300, userName : 'santa',   title: 'title 5', text: 'text 5' },
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
		test.request('/api/login', {password: '3'}, next);
	});
	it("can search after login", function (next) {
		test.request('/api/search-post', {query: 'hello'}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	xit('prepare threads', function (next) {
		async.forEachSeries(doc, function (doc, next) {
			test.request('/api/create-post-head', doc, function (err, res, body) {
				doc.postId = body.postId;
				doc.threadId = body.threadId;
				next(err);
			});
		}, next);
	});
	xit('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	var r;
	xit("can search user 'snowman'", function (next) {
		test.request('/api/search-post', {query: 'snowman'}, function (err, res, body) {
			console.log(body);
			res.should.status(200);
			body.should.length(3);
			body[0].title.should.equal('title 1');
			body[1].title.should.equal('title 2');
			body[2].title.should.equal('title 3');
			next(err);
		});
	});
	xit('can get threads with category=all, limit=3', function (next) {
		test.request('/api/search-post', {categoryId:0, limit: 3}, function (err, res, body) {
			res.should.status(200);
			body.should.length(3);

			t = body[0];
			t.id.should.ok;
			t.categoryId.should.equal(400);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = body[2];
			t.id.should.ok;
			t.categoryId.should.equal(300);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 5');
			next(err);
		});
	});
	xit('can get threads with category=all, lastUdate', function (next) {
		test.request('/api/search-post', {categoryId:0, lastUdate: 0}, function (err, res, body) {
			res.should.status(200);
			body.should.length(0);
			next(err);
		});
	});
});
