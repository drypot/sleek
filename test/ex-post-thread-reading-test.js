var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l.js');

require('../main/ex-session.js');
require('../main/ex-post.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe("getting thread list", function () {
	var samples = [
		{ categoryId: 100, userName : 'snowman', title: 'title 1', text: 'text 1' },
		{ categoryId: 100, userName : 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 100, userName : 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 100, userName : 'snowman', title: 'title 4', text: 'text 4' },
		{ categoryId: 300, userName : 'snowman', title: 'title 5', text: 'text 5' },
		{ categoryId: 300, userName : 'snowman', title: 'title 6', text: 'text 6' },
		{ categoryId: 400, userName : 'snowman', title: 'title 7', text: 'text 7' }
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
			t.userName.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = res.body.thread[6];
			t.id.should.ok;
			t.categoryId.should.equal(100);
			t.userName.should.equal('snowman');
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
			t.userName.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = res.body.thread[2];
			t.id.should.ok;
			t.categoryId.should.equal(300);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 5');
			next(err);
		});
	});
	it('when category all, lastUdate 0, should return 0 posts', function (next) {
		l.test.request.get('/api/thread', { c :0, udate: 0 }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.thread.should.length(0);
			next(err);
		});
	});
});

describe("getting thread", function () {
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it("should fail", function (next) {
		l.test.request.get('/api/thread/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var tid;
	it('and head', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title', text: 'head text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid = res.body.threadId;
				next(err);
			}
		);
	});
	it('and reply', function (next) {
		l.test.request.post('/api/thread/' + tid,
			{ userName : 'snowman2', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
	it('should return 2 posts', function (next) {
		l.test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.thread.id.should.equal(tid);
			res.body.thread.categoryId.should.equal(101);
			res.body.thread.title.should.equal('title');
			res.body.post.should.length(2);
			res.body.post[0].userName.should.equal('snowman');
			res.body.post[0].text.should.equal('head text');
			res.body.post[1].userName.should.equal('snowman2');
			res.body.post[1].text.should.equal('reply text 1');
			next(err);
		});
	});
	var pid;
	it('given added reply', function (next) {
		l.test.request.post('/api/thread/' + tid,
			{ userName : 'admin', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				pid = res.body.postId;
				next(err);
			}
		);
	});
	it('should return 3 posts', function (next) {
		l.test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.should.length(3);
			next(err);
		});
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('and updated visible', function (next) {
		l.test.request.put('/api/thread/' + tid + '/' + pid,
			{ userName: 'admin2', text: 'reply text 2u', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
	it('should return 3 posts', function (next) {
		l.test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.should.length(3);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('should return 2 posts', function (next) {
		l.test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.should.length(2);
			next(err);
		});
	});
});