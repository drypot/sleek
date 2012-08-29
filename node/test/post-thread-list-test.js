var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l.js');

require('../main/session.js');
require('../main/post.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe("getting thread list", function () {
	var samples = [
		{ categoryId: 100, writer : 'snowman', title: 'title 1', text: 'text 1' },
		{ categoryId: 100, writer : 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 100, writer : 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 100, writer : 'snowman', title: 'title 4', text: 'text 4' },
		{ categoryId: 300, writer : 'snowman', title: 'title 5', text: 'text 5' },
		{ categoryId: 300, writer : 'snowman', title: 'title 6', text: 'text 6' },
		{ categoryId: 400, writer : 'snowman', title: 'title 7', text: 'text 7' }
	];

	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it("should fail", function (next) {
		l.test.request.post('/api/thread', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('and threads', function (next) {
		async.forEachSeries(samples, function (item, next) {
			l.test.request.post('/api/thread', item, next);
		}, next);
	});
	var t;
	it('with category all, should return 7 posts', function (next) {
		l.test.request.get('/api/thread', { c: 0, limit: 0 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.thread.should.length(7);

			t = res.body.thread[0];
			t.id.should.ok;
			t.categoryId.should.equal(400);
			t.writer.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = res.body.thread[6];
			t.id.should.ok;
			t.categoryId.should.equal(100);
			t.writer.should.equal('snowman');
			t.title.should.equal('title 1');
			next(err);
		});
	});
	it('with category all, limit 3, should return 3 posts', function (next) {
		l.test.request.get('/api/thread', { c: 0, limit: 3 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.thread.should.length(3);

			t = res.body.thread[0];
			t.id.should.ok;
			t.categoryId.should.equal(400);
			t.writer.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = res.body.thread[2];
			t.id.should.ok;
			t.categoryId.should.equal(300);
			t.writer.should.equal('snowman');
			t.title.should.equal('title 5');
			next(err);
		});
	});
	it('when category all, lastUdate 0, should return 0 posts', function (next) {
		l.test.request.get('/api/thread', { c :0, updated: 0 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.thread.should.length(0);
			next(err);
		});
	});
});
