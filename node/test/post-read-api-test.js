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

describe('reading post', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head t1, p11', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply p12', function (next) {
		l.test.request.post('/api/thread/' + t1,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				p12 = res.body.postId;
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	var t2, p21, p22;
	it('and head t2, p21 in recycle bin', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 40, writer : 'snowman', title: 'title 2', text: 'head text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				t2 = res.body.threadId;
				p21 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply p22 in recycle bin', function (next) {
		l.test.request.post('/api/thread/' + t2,
			{ writer : 'snowman', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				p22 = res.body.postId;
				next(err);
			}
		);
	});
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it("should fail", function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('for head, should success', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.head.should.true;
			res.body.category.id.should.equal(101);
			res.body.post.writer.should.equal('snowman');
			res.body.thread.title.should.equal('title 1');
			res.body.post.text.should.equal('head text 1');
			res.body.post.visible.should.ok;
			next(err);
		});
	});
	it('for reply, should success', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.head.should.not.ok;
			res.body.post.writer.should.equal('snowman');
			res.body.post.text.should.equal('reply text 1');
			next(err);
		});
	});
	it('for head head in recycle bin, should fail', function (next) {
		l.test.request.get('/api/thread/' + t2 + '/' + p21, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
			next(err);
		});
	});
	it('for reply in recycle bin, should fail', function (next) {
		l.test.request.get('/api/thread/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
			next(err);
		});
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('for head head in recycle bin, should success', function (next) {
		l.test.request.get('/api/thread/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
	it('for reply in recycle bin, should success', function (next) {
		l.test.request.get('/api/thread/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
});

describe('editable field', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head t1, p11', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply p12', function (next) {
		l.test.request.post('/api/thread/' + t1,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				p12 = res.body.postId;
				next(err);
			}
		);
	});
	it('for p11, should be true', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});
	it('for p12, should be true', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});
	it('given new user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('for p11, should be false', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.editable.should.be.false;
			next(err);
		});
	});
	it('for p12, should be false', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.editable.should.be.false;
			next(err);
		});
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('for p11, should be true', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});
	it('for p12, should be true', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});

});
