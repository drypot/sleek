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
			{ categoryId: 101, writer : 'snowman', title: 'title', text: 'head text' },
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
			{ writer : 'snowman2', text: 'reply text 1' },
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
			res.body.post[0].writer.should.equal('snowman');
			res.body.post[0].text.should.equal('head text');
			res.body.post[1].writer.should.equal('snowman2');
			res.body.post[1].text.should.equal('reply text 1');
			next(err);
		});
	});
	var pid;
	it('given added reply', function (next) {
		l.test.request.post('/api/thread/' + tid,
			{ writer : 'admin', text: 'reply text 2' },
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
			{ writer: 'admin2', text: 'reply text 2u', visible: false },
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