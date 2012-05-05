var _ = require('underscore');
var should = require('should');
var path = require('path');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var upload = require('../main/upload.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo,es,express', next);
});

describe('post new thread', function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it("can not create head when not logged in", function (next) {
		test.request.post('/api/thread', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('can create head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.should.have.property('threadId');
				res.body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("can not create head with invalid categoryId", function (next) {
		test.request.post('/api/thread',
			{ categoryId: 10100, userName : 'snowman', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it("can not create head with empty title", function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: ' ', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].title.should.equal(msg.ERR_FILL_TITLE);
				next(err);
			}
		);
	});
	it("can not create head with big title", function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', text: 'text', title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title'},
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].title.should.equal(msg.ERR_SHORTEN_TITLE);
				next(err);
			}
		);
	});
	it("can not create head with empty userName", function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : ' ', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
	it("can not create head with big userName", function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : '123456789012345678901234567890123', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].userName.should.equal(msg.ERR_SHORTEN_USERNAME);
				next(err);
			}
		);
	});
	it('can not create head in recycle bin as user', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it('can create head in recycle bin as admin', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
});

describe('post reply', function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it("can not create head when not logged in", function (next) {
		test.request.post('/api/thread/0', function (err, res) {
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
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				tid = res.body.threadId;
				next(err);
			}
		);
	});
	it('can create reply', function (next) {
		test.request.post('/api/thread/' + tid,
			{ userName : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("can not create reply with invalid threadId", function (next) {
		test.request.post('/api/thread/99999',
			{ userName : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_THREAD);
				next(err);
			}
		);
	});
	it("can not create reply with invalid threadId 2", function (next) {
		test.request.post('/api/thread/xxx',
			{ userName : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(404);
				next(err);
			}
		);
	});
	it("can not create reply with empty userName", function (next) {
		test.request.post('/api/thread/' + tid,
			{ userName : ' ', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	var tid2;
	it('prepare head in recycle bin as admin', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				tid2 = res.body.threadId;
				next(err);
			}
		);
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('can not create reply in recycle bin as user', function (next) {
		test.request.post('/api/thread/' + tid2,
			{ userName : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it('can create reply in recycle bin as admin', function (next) {
		test.request.post('/api/thread/' + tid2,
			{ userName : 'snowman', text: 'reply text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
});

describe('get post', function () {
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	it('prepare reply', function (next) {
		test.request.post('/api/thread/' + tid1,
			{ userName : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				pid12 = res.body.postId;
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	var tid2, pid21, pid22;
	it('prepare head in recycle bin', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 40, userName : 'snowman', title: 'title 2', text: 'head text 2' },
			function (err, res) {
				res.status.should.equal(200);
				tid2 = res.body.threadId;
				pid21 = res.body.postId;
				next(err);
			}
		);
	});
	it('prepare reply in recycle bin', function (next) {
		test.request.post('/api/thread/' + tid2,
			{ userName : 'snowman', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				pid22 = res.body.postId;
				next(err);
			}
		);
	});
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it("can not get post when not logged in", function (next) {
		test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('can get head', function (next) {
		test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.head.should.true;
			res.body.categoryId.should.equal(101);
			res.body.userName.should.equal('snowman');
			res.body.title.should.equal('title 1');
			res.body.text.should.equal('head text 1');
			res.body.visible.should.ok;
			next(err);
		});
	});
	it('can get reply', function (next) {
		test.request.get('/api/thread/' + tid1 + '/' + pid12, function (err, res) {
			res.status.should.equal(200);
			res.body.head.should.not.ok;
			should(!res.body.categoryId);
			should(!res.body.title);
			res.body.userName.should.equal('snowman');
			res.body.text.should.equal('reply text 1');
			next(err);
		});
	});
	it('can not get head in recycle bin', function (next) {
		test.request.get('/api/thread/' + tid2 + '/' + pid21, function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_INVALID_CATEGORY);
			next(err);
		});
	});
	it('can not get reply in recycle bin', function (next) {
		test.request.get('/api/thread/' + tid2 + '/' + pid22, function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_INVALID_CATEGORY);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it('can get head in recycle bin as admin', function (next) {
		test.request.get('/api/thread/' + tid2 + '/' + pid22, function (err, res) {
			res.status.should.equal(200);
			next(err);
		});
	});
	it('can get head in recycle bin as admin', function (next) {
		test.request.get('/api/thread/' + tid2 + '/' + pid22, function (err, res) {
			res.status.should.equal(200);
			next(err);
		});
	});
});

describe('put head post', function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it("can not update head when not logged in", function (next) {
		test.request.put('/api/thread/0/0', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	it('can update head except visible', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
	it('confirm changed', function (next) {
		test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.head.should.true;
			res.body.categoryId.should.equal(101);
			res.body.userName.should.equal('snowman u1');
			res.body.title.should.equal('title u1');
			res.body.text.should.equal('head text u1');
			res.body.visible.should.true;
			next(err);
		});
	});
	it('can update head category', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 102, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
	it('confirm changed', function (next) {
		test.request.get('/api/thread/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.categoryId.should.equal(102);
			next(err);
		});
	});
	it('can not update head category to recycle bin as user', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 40, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('can not update head with empty title', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, userName: 'snowman u1', title: ' ', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].title.should.equal(msg.ERR_FILL_TITLE);
				next(err);
			}
		);
	});
	it('can not update head with empty userName', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 101, userName: ' ', title: 'title', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it('can update head category to recycle bin as admin', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid11,
			{ categoryId: 40, userName: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
});

describe('put reply', function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it("can not update reply when not logged in", function (next) {
		test.request.put('/api/thread/0/0', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	it('prepare reply', function (next) {
		test.request.post('/api/thread/' + tid1,
			{ userName : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				pid12 = res.body.postId;
				next(err);
			}
		);
	});
	it('can update reply except visible', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman u1', text: 'reply text u1', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
	it('confirm changed', function (next) {
		test.request.get('/api/thread/' + tid1 + '/' + pid12, function (err, res) {
			res.status.should.equal(200);
			res.body.head.should.false;
			res.body.userName.should.equal('snowman u1');
			res.body.text.should.equal('reply text u1');
			res.body.visible.should.true;
			next(err);
		});
	});
	it('can not update reply with empty userName', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: ' ', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(400);
				res.body.error.should.equal(msg.ERR_INVALID_DATA);
				res.body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
});
