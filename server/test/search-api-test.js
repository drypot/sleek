var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });
var es = require('../main/es')({ dropIndex: true });
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

describe.skip("searching", function () {

	var docs = [
		{ cid: 100, writer: 'snowman', title: 'title 1', text: 'apple orange banana' },
		{ cid: 100, writer: 'snowman', title: 'title 2', text: 'apple orange pine' },
		{ cid: 100, writer: 'snowman', title: 'title 3', text: '둥글게 네모나게' },
		{ cid: 100, writer: 'santa',   title: 'title 4', text: '둥글게 세모나게' },
		{ cid: 300, writer: 'santa',   title: 'title 5', text: '둥글게 동그랗게' },
		{ cid: 300, writer: 'rudolph', title: 'title 6', text: 'text 6' },
		{ cid:  40, writer: 'admin',   title: 'title 7', text: 'text 7' },
		{ cid:  40, writer: 'admin',   title: 'title 8', text: 'text 8' }
	];

	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/search', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should success", function (next) {
		request.get(test.url + '/api/search', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var r = res.body.results;
			r.should.length(0);
			next();
		});
	});
	it("given threads", function (next) {
		var i = 0;
		var len = docs.length;
		(function insert() {
			if (i == len) {
				es.flush(next);
				return;
			}
			var doc = docs[i++];
			express.post('/api/threads').send(doc).end(function (err, res) {
				should.not.exists(err);
				should(!res.body.err);
				doc.pid = res.body.pid;
				doc.tid = res.body.tid;
				setImmediate(insert);
			});
		})();
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	describe.skip("user name", function () {
		it("should success", function (next) {
			request.get(test.url + '/api/search').query({ q: 'snowman' }).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				var r = res.body.results;
				r.should.length(3);
				r[0].title.should.equal('title 3');
				r[1].title.should.equal('title 2');
				r[2].title.should.equal('title 1');
				next();
			});
		});
	});
	describe.skip("title", function () {
		it("should success", function (next) {
			request.get(test.url + '/api/search').query({ q: 'title 4' }).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				var r = res.body.results;
				r.should.length(1);
				r[0].title.should.equal('title 4');
				next();
			});
		});
	});
	describe.skip("text", function () {
		it("should success", function (next) {
			request.get(test.url + '/api/search').query({ q: 'apple orange' }).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				var r = res.body.results;
				r.should.length(2);
				r[0].title.should.equal('title 2');
				r[1].title.should.equal('title 1');
				next();
			});
		});
		it("should success", function (next) {
			request.get(test.url + '/api/search').query({ q: 'apple banana' }).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				var r = res.body.results;
				r.should.length(1);
				r[0].title.should.equal('title 1');
				next();
			});
		});
	});
	describe.skip("hangul", function () {
		it("should success", function (next) {
			request.get(test.url + '/api/search').query({ q: '둥글' }).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				var r = res.body.results;
				r.should.length(3);
				r[0].title.should.equal('title 5');
				r[1].title.should.equal('title 4');
				r[2].title.should.equal('title 3');
				next();
			});
		});
	});
	describe.skip("recycle bin", function () {
		it("given user session", function (next) {
			ufix.loginUser(next);
		});
		it("should return no results", function (next) {
			request.get(test.url + '/api/search').query({ q: 'admin' }).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				var r = res.body.results;
				r.should.length(0);
				next();
			});
		});
		it("given admin session", function (next) {
			ufix.loginAdmin(next);
		});
		it("should return results", function (next) {
			request.get(test.url + '/api/search').query({ q: 'admin' }).end(function (err, res) {
				should(!res.error);
				should(!res.body.err);
				var r = res.body.results;
				r.should.length(2);
				next();
			});
		});
	});
});
