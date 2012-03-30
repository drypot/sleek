var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo,es,express', next);
});

describe("get-thread-list", function () {
	var samples = [
		{ categoryId: 100, userName : 'snowman', title: 'title 1', text: 'text 1' },
		{ categoryId: 100, userName : 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 100, userName : 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 100, userName : 'snowman', title: 'title 4', text: 'text 4' },
		{ categoryId: 300, userName : 'snowman', title: 'title 5', text: 'text 5' },
		{ categoryId: 300, userName : 'snowman', title: 'title 6', text: 'text 6' },
		{ categoryId: 400, userName : 'snowman', title: 'title 7', text: 'text 7' }
	];

	it('assume logged out', function (next) {
		test.request('/api/logout', next);
	});
	it("can not get thread list when not logged in", function (next) {
		test.request('/api/get-thread-list', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	it('prepare threads', function (next) {
		async.forEachSeries(samples, function (item, next) {
			test.request('/api/create-post-head', item, function (err, res, body) {
				next(err);
			});
		}, next);
	});
	var t;
	it('can get threads with category=all', function (next) {
		test.request('/api/get-thread-list', {cateogryId: 0, limit: 0}, function (err, res, body) {
			res.should.status(200);
			body.should.length(7);

			t = body[0];
			t.id.should.ok;
			t.categoryId.should.equal(400);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = body[6];
			t.id.should.ok;
			t.categoryId.should.equal(100);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 1');
			next(err);
		});
	});
	it('can get threads with category=all, limit=3', function (next) {
		test.request('/api/get-thread-list', {categoryId:0, limit: 3}, function (err, res, body) {
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
	it('can get threads with category=all, lastUdate', function (next) {
		test.request('/api/get-thread-list', {categoryId:0, lastUdate: 0}, function (err, res, body) {
			res.should.status(200);
			body.should.length(0);
			next(err);
		});
	});
});

describe("get-thread", function () {
	it('assume logged out', function (next) {
		test.request('/api/logout', next);
	});
	it("can not get thread when not logged in", function (next) {
		test.request('/api/get-thread', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	var tid;
	it('prepare head', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : 'snowman', title: 'title', text: 'head text' },
			function (err, res, body) {
				res.should.status(200);
				tid = body.threadId;
				next(err);
			}
		);
	});
	it('prepare reply', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid, userName : 'snowman2', text: 'reply text 1' }, ['file1.txt'],
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
	it('can get thread', function (next) {
		test.request('/api/get-thread', {threadId: tid}, function (err, res, body) {
			res.should.status(200);
			body.thread.id.should.equal(tid);
			body.thread.categoryId.should.equal(101);
			body.thread.title.should.equal('title');
			body.post.should.length(2);
			body.post[0].userName.should.equal('snowman');
			body.post[0].text.should.equal('head text');
			should(!body.post[0].file);
			body.post[1].userName.should.equal('snowman2');
			body.post[1].text.should.equal('reply text 1');
			body.post[1].file.should.eql(['file1.txt']);
			next(err);
		});
	});
	var pid;
	it('can append reply', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid, userName : 'admin', text: 'reply text 2' },
			function (err, res, body) {
				res.should.status(200);
				pid = body.postId;
				next(err);
			}
		);
	});
	it('can get thead with 3 posts', function (next) {
		test.request('/api/get-thread', {threadId: tid}, function (err, res, body) {
			res.should.status(200);
			body.post.should.length(3);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request('/api/login', {password: '3'}, next);
	});
	it('can update visible', function (next) {
		test.request('/api/update-post-reply', {
				threadId: tid, postId: pid,
				userName: 'admin2', text: 'reply text 2u',
				visible: false
			},
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
	it('can get thead with 3 posts', function (next) {
		test.request('/api/get-thread', {threadId: tid}, function (err, res, body) {
			res.should.status(200);
			body.post.should.length(3);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	it('can get thead with just 2 posts as user', function (next) {
		test.request('/api/get-thread', {threadId: tid}, function (err, res, body) {
			res.should.status(200);
			body.post.should.length(2);
			next(err);
		});
	});
});