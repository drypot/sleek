var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l.js');

require('../main/session-api.js');
require('../main/post-api.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('updating head post', function () {
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it("should fail", function (next) {
		l.test.request.put('/api/thread/0/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('and head', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	it('without category change, should success, except visible field', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
	it('and can confirm changed', function (next) {
		l.test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.head.should.true;
			res.body.category.id.should.equal(101);
			res.body.post.writer.should.equal('snowman u1');
			res.body.thread.title.should.equal('title u1');
			res.body.post.text.should.equal('head text u1');
			res.body.post.visible.should.true;
			next(err);
		});
	});
	it('with category chagne, should success', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 102, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
	it('and can confirm changed', function (next) {
		l.test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.category.id.should.equal(102);
			next(err);
		});
	});
	it('when thread is in recycle bin, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 40, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('when title empty, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, writer: 'snowman u1', title: ' ', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.error.title[0].should.equal(l.msg.FILL_TITLE);
				next(err);
			}
		);
	});
	it('when writer empty, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, writer: ' ', title: 'title', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.error.writer[0].should.equal(l.msg.FILL_WRITER);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('when thread is in recyle bin, should success', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 40, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
});

describe('updating reply post', function () {
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it("should fail", function (next) {
		l.test.request.put('/api/thread/0/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('and head', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	it('and replay', function (next) {
		l.test.request.post('/api/thread/' + tid1,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				pid12 = res.body.postId;
				next(err);
			}
		);
	});
	it('should success, except visible field', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ writer: 'snowman u1', text: 'reply text u1', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
	it('and can confirm changed', function (next) {
		l.test.request.get('/api/thread/' + tid1 + '/' + pid12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.head.should.false;
			res.body.post.writer.should.equal('snowman u1');
			res.body.post.text.should.equal('reply text u1');
			res.body.post.visible.should.true;
			next(err);
		});
	});
	it('when writer empty, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ writer: ' ', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.error.writer[0].should.equal(l.msg.FILL_WRITER);
				next(err);
			}
		);
	});
});
