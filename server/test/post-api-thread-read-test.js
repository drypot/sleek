var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l');

require('../main/session-api');
require('../main/post-api');
require('../main/test');

before(function (next) {
	l.init.run(next);
});

describe("getting thread", function () {
	it('given no session', function (next) {
		request.del('/api/session', next);
	});
	it("should fail", function (next) {
		request.get('/api/thread/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		request.post('/api/session', { password: '1' }, next);
	});
	var tid;
	it('and head', function (next) {
		request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: 'title', text: 'head text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tid = res.body.threadId;
				next(err);
			}
		);
	});
	it('and reply', function (next) {
		request.post('/api/thread/' + tid,
			{ writer : 'snowman2', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
	it('should return 2 posts', function (next) {
		request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.thread.id.should.equal(tid);
			res.body.category.id.should.equal(101);
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
		request.post('/api/thread/' + tid,
			{ writer : 'admin', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				pid = res.body.postId;
				next(err);
			}
		);
	});
	it('should return 3 posts', function (next) {
		request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.should.length(3);
			next(err);
		});
	});
	it('given admin session', function (next) {
		request.post('/api/session', { password: '3' }, next);
	});
	it('and updated visible', function (next) {
		request.put('/api/thread/' + tid + '/' + pid,
			{ writer: 'admin2', text: 'reply text 2u', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
	it('should return 3 posts', function (next) {
		request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.should.length(3);
			next(err);
		});
	});
	it('given user session', function (next) {
		request.post('/api/session', { password: '1' }, next);
	});
	it('should return 2 posts', function (next) {
		request.get('/api/thread/' + tid, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.should.length(2);
			next(err);
		});
	});
});