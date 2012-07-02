var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var express = require('../main/express.js');
var test = require('./test.js');

before(function (next) {
	test.runInit(next);
});

describe("get thread list", function () {
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
		test.request.post('/api/logout', next);
	});
	it("can not get thread list when not logged in", function (next) {
		test.request.post('/api/thread', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('prepare threads', function (next) {
		async.forEachSeries(samples, function (item, next) {
			test.request.post('/api/thread', item, next);
		}, next);
	});
	var t;
	it('can get threads with category all', function (next) {
		test.request.get('/api/thread', { c: 0, limit: 0 }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(7);

			t = res.body[0];
			t.id.should.ok;
			t.categoryId.should.equal(400);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = res.body[6];
			t.id.should.ok;
			t.categoryId.should.equal(100);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 1');
			next(err);
		});
	});
	it('can get threads with category all, limit 3', function (next) {
		test.request.get('/api/thread', { c: 0, limit: 3 }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(3);

			t = res.body[0];
			t.id.should.ok;
			t.categoryId.should.equal(400);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 7');
			t.hit.should.equal(0);
			t.length.should.equal(1);

			t = res.body[2];
			t.id.should.ok;
			t.categoryId.should.equal(300);
			t.userName.should.equal('snowman');
			t.title.should.equal('title 5');
			next(err);
		});
	});
	it('can get threads with category all, lastUdate', function (next) {
		test.request.get('/api/thread', { c :0, udate: 0 }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.length(0);
			next(err);
		});
	});
});

describe("get thread", function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it("can not get thread when not logged in", function (next) {
		test.request.get('/api/thread/0', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	var tid;
	it('prepare head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title', text: 'head text' },
			function (err, res) {
				res.status.should.equal(200);
				tid = res.body.threadId;
				next(err);
			}
		);
	});
	var tmp;
	it('can upload file1.txt', function (next) {
		test.request.post('/api/upload', {}, ['file1.txt'],
			function (err, res) {
				res.status.should.equal(200);
				tmp = res.body;
				next(err);
			}
		);
	});
	it('prepare reply', function (next) {
		test.request.post('/api/thread/' + tid,
			{ userName : 'snowman2', text: 'reply text 1', file: tmp },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
	it('can get thread', function (next) {
		test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.thread.id.should.equal(tid);
			res.body.thread.categoryId.should.equal(101);
			res.body.thread.title.should.equal('title');
			res.body.post.should.length(2);
			res.body.post[0].userName.should.equal('snowman');
			res.body.post[0].text.should.equal('head text');
			should(!res.body.post[0].file);
			res.body.post[1].userName.should.equal('snowman2');
			res.body.post[1].text.should.equal('reply text 1');
			res.body.post[1].file.should.eql(['file1.txt']);
			next(err);
		});
	});
	var pid;
	it('can append reply', function (next) {
		test.request.post('/api/thread/' + tid,
			{ userName : 'admin', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				pid = res.body.postId;
				next(err);
			}
		);
	});
	it('can get 3 posts', function (next) {
		test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.post.should.length(3);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it('can update visible', function (next) {
		test.request.put('/api/thread/' + tid + '/' + pid,
			{ userName: 'admin2', text: 'reply text 2u', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
	it('can get 3 posts', function (next) {
		test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.post.should.length(3);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('can get just 2 posts as user', function (next) {
		test.request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.post.should.length(2);
			next(err);
		});
	});
});