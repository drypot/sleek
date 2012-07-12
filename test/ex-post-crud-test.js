var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l.js');

require('../main/ex-session.js');
require('../main/ex-post.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('creating head', function () {
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
	it('should success', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				res.body.should.have.property('threadId');
				res.body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("when categoryId invalid, should fail", function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 10100, userName : 'snowman', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it("when title empty, should fail", function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: ' ', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].title.should.equal(l.msg.FILL_TITLE);
				next(err);
			}
		);
	});
	it("when title big, should fail", function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', text: 'text', title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title'},
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].title.should.equal(l.msg.SHORTEN_TITLE);
				next(err);
			}
		);
	});
	it("when userName empty, should fail", function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : ' ', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].userName.should.equal(l.msg.FILL_USERNAME);
				next(err);
			}
		);
	});
	it("when userName big, should fail", function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : '123456789012345678901234567890123', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].userName.should.equal(l.msg.SHORTEN_USERNAME);
				next(err);
			}
		);
	});
	it('when category is recycle bin, should fail', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('when category is recycle bin, should success', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
});

describe('creating reply', function () {
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it("should fail", function (next) {
		l.test.request.post('/api/thread/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var tid;
	it('and head tid', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid = res.body.threadId;
				next(err);
			}
		);
	});
	it('should success', function (next) {
		l.test.request.post('/api/thread/' + tid,
			{ userName : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				res.body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("when threadId is 99999, should fail", function (next) {
		l.test.request.post('/api/thread/99999',
			{ userName : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_THREAD);
				next(err);
			}
		);
	});
	it("when threadId is xxx, should fail", function (next) {
		l.test.request.post('/api/thread/xxx',
			{ userName : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(404);
				next(err);
			}
		);
	});
	it("when userName empty, should fail", function (next) {
		l.test.request.post('/api/thread/' + tid,
			{ userName : ' ', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].userName.should.equal(l.msg.FILL_USERNAME);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	var tid2;
	it('and head in recycle bin', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid2 = res.body.threadId;
				next(err);
			}
		);
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('when creating reply on recycle bin thread, should fail', function (next) {
		l.test.request.post('/api/thread/' + tid2,
			{ userName : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('when creating reply on recycle bin thread, should success', function (next) {
		l.test.request.post('/api/thread/' + tid2,
			{ userName : 'snowman', text: 'reply text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
});

describe('getting post', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('and head tid1, pid11', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply pid12', function (next) {
		l.test.request.post('/api/thread/' + tid1,
			{ userName : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				pid12 = res.body.postId;
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	var tid2, pid21, pid22;
	it('and head tid2, pid21 in recycle bin', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title 2', text: 'head text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				tid2 = res.body.threadId;
				pid21 = res.body.postId;
				next(err);
			}
		);
	});
	it('and reply pid22 in recycle bin', function (next) {
		l.test.request.post('/api/thread/' + tid2,
			{ userName : 'snowman', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				pid22 = res.body.postId;
				next(err);
			}
		);
	});
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it("should fail", function (next) {
		l.test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('for head, should success', function (next) {
		l.test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.head.should.true;
			res.body.categoryId.should.equal(101);
			res.body.userName.should.equal('snowman');
			res.body.title.should.equal('title 1');
			res.body.text.should.equal('head text 1');
			res.body.visible.should.ok;
			next(err);
		});
	});
	it('for reply, should success', function (next) {
		l.test.request.get('/api/thread/' + tid1 + '/' + pid12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.head.should.not.ok;
			should(!res.body.categoryId);
			should(!res.body.title);
			res.body.userName.should.equal('snowman');
			res.body.text.should.equal('reply text 1');
			next(err);
		});
	});
	it('for head head in recycle bin, should fail', function (next) {
		l.test.request.get('/api/thread/' + tid2 + '/' + pid21, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
			next(err);
		});
	});
	it('for reply in recycle bin, should fail', function (next) {
		l.test.request.get('/api/thread/' + tid2 + '/' + pid22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
			next(err);
		});
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('for head head in recycle bin, should success', function (next) {
		l.test.request.get('/api/thread/' + tid2 + '/' + pid22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
	it('for reply in recycle bin, should success', function (next) {
		l.test.request.get('/api/thread/' + tid2 + '/' + pid22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
});

describe('modifying head', function () {
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
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
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
			{ categoryId: 101, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: false },
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
			res.body.head.should.true;
			res.body.categoryId.should.equal(101);
			res.body.userName.should.equal('snowman u1');
			res.body.title.should.equal('title u1');
			res.body.text.should.equal('head text u1');
			res.body.visible.should.true;
			next(err);
		});
	});
	it('with category chagne, should success', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 102, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
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
			res.body.categoryId.should.equal(102);
			next(err);
		});
	});
	it('when thread is in recycle bin, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 40, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('when title empty, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, userName: 'snowman u1', title: ' ', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].title.should.equal(l.msg.FILL_TITLE);
				next(err);
			}
		);
	});
	it('when userName empty, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, userName: ' ', title: 'title', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].userName.should.equal(l.msg.FILL_USERNAME);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('when thread is in recyle bin, should success', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 40, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
});

describe('modifying reply', function () {
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
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
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
			{ userName : 'snowman', text: 'reply text 1' },
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
			{ userName: 'snowman u1', text: 'reply text u1', visible: false },
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
			res.body.head.should.false;
			res.body.userName.should.equal('snowman u1');
			res.body.text.should.equal('reply text u1');
			res.body.visible.should.true;
			next(err);
		});
	});
	it('when userName empty, should fail', function (next) {
		l.test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: ' ', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.INVALID_DATA);
				res.body.field[0].userName.should.equal(l.msg.FILL_USERNAME);
				next(err);
			}
		);
	});
});
