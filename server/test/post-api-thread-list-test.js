var should = require('should');
var request = require('superagent').agent();
var async = require('async');

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true, w: 1 });
var es = require('../main/es').options({ dropIndex: true });
var express = require('../main/express');
var rcs = require('../main/rcs');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe("get /api/threads", function () {
	var samples = [
		{ categoryId: 100, writer : 'snowman', title: 'title 1', text: 'text 1' },
		{ categoryId: 100, writer : 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 100, writer : 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 100, writer : 'snowman', title: 'title 4', text: 'text 4' },
		{ categoryId: 300, writer : 'snowman', title: 'title 5', text: 'text 5' },
		{ categoryId: 300, writer : 'snowman', title: 'title 6', text: 'text 6' },
		{ categoryId: 400, writer : 'snowman', title: 'title 7', text: 'text 7' }
	];

	before(function (next) {
		mongo.db.dropDatabase(next);
	});
	before(function (next) {
		mongo.ensureThreads(next);
	});
	before(function (next) {
		mongo.ensurePosts(next);
	});
	before(function (next) {
		mongo.posts.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		});
	});
	it('given no session', function (next) {
		test.logout(next);
	});
	it("should fail", function (next) {
		request.post(test.url + '/api/threads', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		test.loginUser(next);
	});
	it('given sample threads', function (next) {
		async.forEachSeries(
			samples,
			function (item, next) {
				request.post(test.url + '/api/threads').send(item).end(function (err, res) {
					res.status.should.equal(200);
					next();
				});
			},
			next
		);
	});
	it('should success when no op', function (next) {
		request.get(test.url + '/api/threads', function (err, res) {
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(7);

			var t;
			t = res.body.threads[0];
			t.should.have.property('id');
			t.category.id.should.equal(400);
			t.writer.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = res.body.threads[6];
			t.should.have.property('id');
			t.category.id.should.equal(100);
			t.writer.should.equal('snowman');
			t.title.should.equal('title 1');
			next();
		});
	});
	it('should success when category 0', function (next) {
		request.get(test.url + '/api/threads').query({ c: 0 }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(7);
			next();
		});
	});
	it('should success when category 300', function (next) {
		request.get(test.url + '/api/threads').query({ c: 300 }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(2);
			next();
		});
	});
	it('should success when page 2', function (next) {
		request.get(test.url + '/api/threads').query({ c: 0, p: 2, ps: 3 }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(3);
			res.body.threads[0].title.should.equal('title 4');
			res.body.threads[1].title.should.equal('title 3');
			res.body.threads[2].title.should.equal('title 2');
			next();
		});
	});
});
