var _ = require('underscore');
var should = require('should');
var l = require('../main/l');

require('../main/session-api');
require('../main/post-api');
require('../main/search-api');
require('../main/test');

before(function (next) {
	l.init.run(next);
});

describe("searching", function () {

	var doc = [
		{ categoryId: 100, writer: 'snowman', title: 'title 1', text: 'apple orange banana' },
		{ categoryId: 100, writer: 'snowman', title: 'title 2', text: 'apple orange pine' },
		{ categoryId: 100, writer: 'snowman', title: 'title 3', text: '둥글게 네모나게' },
		{ categoryId: 100, writer: 'santa',   title: 'title 4', text: '둥글게 세모나게' },
		{ categoryId: 300, writer: 'santa',   title: 'title 5', text: '둥글게 동그랗게' },
		{ categoryId: 300, writer: 'rudolph', title: 'title 6', text: 'text 6' },
		{ categoryId:  40, writer: 'admin',   title: 'title 7', text: 'text 7' },
		{ categoryId:  40, writer: 'admin',   title: 'title 8', text: 'text 7' }
	];

	it('given no session', function (next) {
		test.logout(next);
	});
	it("when accessing api, should fail", function (next) {
		request.get(test.url + '/api/search', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given admin session', function (next) {
		request.post(url + '/api/sessions', { password: '3' }, next);
	});
	it("when accessing api, should success", function (next) {
		request.get(test.url + '/api/search', { q: 'hello' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(0);
			next(err);
		});
	});
	it('given threads', function (next) {
		async.forEachSeries(doc, function (doc, next) {
			request.post(url + '/api/threads', doc, function (err, res) {
				doc.postId = res.body.postId;
				doc.threadId = res.body.threadId;
				next(err);
			});
		}, next);
	});
	it('and flushed data', function (next) {
		l.es.flush(next);
	});
	it('given user session', function (next) {
		test.loginUser(next);
	});
	it("when search user name, should return results", function (next) {
		request.get(test.url + '/api/search', { q: 'snowman' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(3);
			r[0].title.should.equal('title 3');
			r[1].title.should.equal('title 2');
			r[2].title.should.equal('title 1');
			next(err);
		});
	});
	it("when search title, should return results", function (next) {
		request.get(test.url + '/api/search', { q: 'title 4' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(1);
			r[0].title.should.equal('title 4');
			next(err);
		});
	});
	it("when search text, should return results", function (next) {
		request.get(test.url + '/api/search', { q: 'apple orange' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(2);
			r[0].title.should.equal('title 2');
			r[1].title.should.equal('title 1');
			next(err);
		});
	});
	it("when search text 2, should return results", function (next) {
		request.get(test.url + '/api/search', { q: 'apple banana' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(1);
			r[0].title.should.equal('title 1');
			next(err);
		});
	});
	it("when search hangul, should return results", function (next) {
		request.get(test.url + '/api/search', { q: '둥글' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(3);
			r[0].title.should.equal('title 5');
			r[1].title.should.equal('title 4');
			r[2].title.should.equal('title 3');
			next(err);
		});
	});
	it("when search admin thread, should return no results", function (next) {
		request.get(test.url + '/api/search', { q: 'admin' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(0);
			next(err);
		});
	});
	it('given admin session', function (next) {
		request.post(url + '/api/sessions', { password: '3' }, next);
	});
	it("when search admin thread, should return results", function (next) {
		request.get(test.url + '/api/search', { q: 'admin' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			var r = res.body.result;
			r.should.length(2);
			next(err);
		});
	});
});
