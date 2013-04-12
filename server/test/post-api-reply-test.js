var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l');

require('../main/session-api');
require('../main/post-api');
require('../main/test');

before(function (next) {
	l.init.run(next);
});

describe('creating reply', function () {
	it('given no session', function (next) {
		request.del('/api/sessions', next);
	});
	it("should fail", function (next) {
		request.post(url + '/api/threads/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	var tid;
	it('and head tid', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tid = res.body.threadId;
				next(err);
			}
		);
	});
	it('should success', function (next) {
		request.post(url + '/api/threads/' + tid,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				res.body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("when threadId is 99999, should fail", function (next) {
		request.post(url + '/api/threads/99999',
			{ writer : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_THREAD);
				next(err);
			}
		);
	});
	it("when threadId is xxx, should fail", function (next) {
		request.post(url + '/api/threads/xxx',
			{ writer : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(404);
				next(err);
			}
		);
	});
	it("when writer empty, should fail", function (next) {
		request.post(url + '/api/threads/' + tid,
			{ writer : ' ', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_DATA);
				res.body.error.writer[0].should.equal(l.msg.FILL_WRITER);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		request.post(url + '/api/sessions', { password: '3' }, next);
	});
	var tid2;
	it('and head in recycle bin', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 40, writer : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tid2 = res.body.threadId;
				next(err);
			}
		);
	});
	it('given user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	it('when creating reply on recycle bin thread, should fail', function (next) {
		request.post(url + '/api/threads/' + tid2,
			{ writer : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		request.post(url + '/api/sessions', { password: '3' }, next);
	});
	it('when creating reply on recycle bin thread, should success', function (next) {
		request.post(url + '/api/threads/' + tid2,
			{ writer : 'snowman', text: 'reply text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
});

describe('reading post', function () {
	it('given user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head t1, p11', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply p12', function (next) {
		request.post(url + '/api/threads/' + t1,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p12 = res.body.postId;
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		request.post(url + '/api/sessions', { password: '3' }, next);
	});
	var t2, p21, p22;
	it('and head t2, p21 in recycle bin', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 40, writer : 'snowman', title: 'title 2', text: 'head text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t2 = res.body.threadId;
				p21 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply p22 in recycle bin', function (next) {
		request.post(url + '/api/threads/' + t2,
			{ writer : 'snowman', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p22 = res.body.postId;
				next(err);
			}
		);
	});
	it('given no session', function (next) {
		request.del('/api/sessions', next);
	});
	it("should fail", function (next) {
		request.get('/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	it('for head, should success', function (next) {
		request.get('/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
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
		request.get('/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.head.should.not.ok;
			res.body.post.writer.should.equal('snowman');
			res.body.post.text.should.equal('reply text 1');
			next(err);
		});
	});
	it('for head head in recycle bin, should fail', function (next) {
		request.get('/api/threads/' + t2 + '/' + p21, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next(err);
		});
	});
	it('for reply in recycle bin, should fail', function (next) {
		request.get('/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next(err);
		});
	});
	it('given admin session', function (next) {
		request.post(url + '/api/sessions', { password: '3' }, next);
	});
	it('for head head in recycle bin, should success', function (next) {
		request.get('/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next(err);
		});
	});
	it('for reply in recycle bin, should success', function (next) {
		request.get('/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next(err);
		});
	});
});

describe('editable field', function () {
	it('given user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head t1, p11', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply p12', function (next) {
		request.post(url + '/api/threads/' + t1,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p12 = res.body.postId;
				next(err);
			}
		);
	});
	it('for p11, should be true', function (next) {
		request.get('/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});
	it('for p12, should be true', function (next) {
		request.get('/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});
	it('given new user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	it('for p11, should be false', function (next) {
		request.get('/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next(err);
		});
	});
	it('for p12, should be false', function (next) {
		request.get('/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next(err);
		});
	});
	it('given admin session', function (next) {
		request.post(url + '/api/sessions', { password: '3' }, next);
	});
	it('for p11, should be true', function (next) {
		request.get('/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});
	it('for p12, should be true', function (next) {
		request.get('/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next(err);
		});
	});

});
