var should = require('should');
var request = require('superagent').agent();
var async = require('async');

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
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

describe('post /api/threads', function () {
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
	it("should fail when categoryId invalid", function (next) {
		var form = { categoryId: 10100, writer : 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it("should fail when title empty", function (next) {
		var form = { categoryId: 101, writer : 'snowman', title: ' ', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.indexOf(rcs.msgs.FILL_TITLE).should.not.equal(-1);
			next();
		});
	});
	it("should fail when title big", function (next) {
		var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
		var form = { categoryId: 101, writer : 'snowman', text: 'text', title: bigTitle };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.indexOf(rcs.msgs.SHORTEN_TITLE).should.not.equal(-1);
			next();
		});
	});
	it("should fail when writer empty", function (next) {
		var form = { categoryId: 101, writer : ' ', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.indexOf(rcs.msgs.FILL_WRITER).should.not.equal(-1);
			next();
		});
	});
	it("should fail when writer big", function (next) {
		var form = { categoryId: 101, writer : '123456789012345678901234567890123', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.writer.indexOf(rcs.msgs.SHORTEN_WRITER).should.not.equal(-1);
			next();
		});
	});
	it('should fail when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer : 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('should success', function (next) {
		var form = { categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.should.have.property('threadId');
			res.body.should.have.property('postId');
			next();
		});
	});
	it('given admin session', function (next) {
		test.loginAdmin(next);
	});
	it('should success when category is recycle bin', function (next) {
		var form = { categoryId: 40, writer : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
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
	it('should success when no op', function (next) {
		request.get(test.url + '/api/threads', function (err, res) {
			console.log(res.body);
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
			next(err);
		});
	});
	it.skip('when category 0, should success', function (next) {
		request.get(test.url + '/api/threads', { c: 0 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(7);
			next(err);
		});
	});
	it.skip('when category 300, should success', function (next) {
		request.get(test.url + '/api/threads', { c: 300 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(2);
			next(err);
		});
	});
	it.skip('when page 2, should success', function (next) {
		request.get(test.url + '/api/threads', { c: 0, p: 2, ps: 3 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(3);
			res.body.threads[0].title.should.equal('title 4');
			res.body.threads[1].title.should.equal('title 3');
			res.body.threads[2].title.should.equal('title 2');
			next(err);
		});
	});
	it.skip('when page -1, should success', function (next) {
		request.get(test.url + '/api/threads', { c: 0, p: -1, ps: 3 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.threads.should.length(3);
			res.body.threads[0].title.should.equal('title 3');
			res.body.threads[1].title.should.equal('title 2');
			res.body.threads[2].title.should.equal('title 1');
			next(err);
		});
	});
});
