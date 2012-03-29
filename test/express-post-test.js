var _ = require('underscore');
var should = require('should');
var path = require('path');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var upload = require('../main/upload.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo,esearch,express', next);
});

describe('create-post-head', function () {
	it('assume logged out', function (next) {
		test.request('/api/logout', next);
	});
	it("can not create head when not logged in", function (next) {
		test.request('/api/create-post-head', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	it('can create head', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res, body) {
				res.should.status(200);
				body.should.have.property('threadId');
				body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("can not create head with invalid categoryId", function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 10100, userName : 'snowman', title: 'title', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it("can not create head with empty title", function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : 'snowman', title: ' ', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].title.should.equal(msg.ERR_FILL_TITLE);
				next(err);
			}
		);
	});
	it("can not create head with big title", function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : 'snowman', text: 'text', title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title'},
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].title.should.equal(msg.ERR_SHORTEN_TITLE);
				next(err);
			}
		);
	});
	it("can not create head with empty userName", function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : ' ', title: 'title', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
	it("can not create head with big userName", function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : '123456789012345678901234567890123', title: 'title', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].userName.should.equal(msg.ERR_SHORTEN_USERNAME);
				next(err);
			}
		);
	});
	it('can not create head in recycle bin as user', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 40, userName : 'snowman', title: 'title', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request('/api/login', {password: '3'}, next);
	});
	it('can create head in recycle bin as admin', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 40, userName : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
});

describe('create-post-reply', function () {
	it('assume logged out', function (next) {
		test.request('/api/logout', next);
	});
	it("can not create head when not logged in", function (next) {
		test.request('/api/create-post-reply', function (err, res, body) {
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
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res, body) {
				res.should.status(200);
				tid = body.threadId;
				next(err);
			}
		);
	});
	it('can create reply', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid, userName : 'snowman', text: 'reply text 1' },
			function (err, res, body) {
				res.should.status(200);
				body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("can not create reply with invalid threadId", function (next) {
		test.request('/api/create-post-reply',
			{ threadId: 99999, userName : 'snowman', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_THREAD);
				next(err);
			}
		);
	});
	it("can not create reply with empty userName", function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid, userName : ' ', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request('/api/login', {password: '3'}, next);
	});
	var tid2;
	it('prepare head in recycle bin as admin', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 40, userName : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res, body) {
				res.should.status(200);
				tid2 = body.threadId;
				next(err);
			}
		);
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	it('can not create reply in recycle bin as user', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid2, userName : 'snowman', text: 'text' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request('/api/login', {password: '3'}, next);
	});
	it('can create reply in recycle bin as admin', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid2, userName : 'snowman', text: 'reply text in recycle bin' },
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
});

describe('get-post', function () {
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res, body) {
				res.should.status(200);
				tid1 = body.threadId;
				pid11 = body.postId;
				next(err);
			}
		);
	});
	it('prepare reply', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid1, userName : 'snowman', text: 'reply text 1' },
			function (err, res, body) {
				res.should.status(200);
				pid12 = body.postId;
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request('/api/login', {password: '3'}, next);
	});
	var tid2, pid21, pid22;
	it('prepare head in recycle bin', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 40, userName : 'snowman', title: 'title 2', text: 'head text 2' },
			function (err, res, body) {
				res.should.status(200);
				tid2 = body.threadId;
				pid21 = body.postId;
				next(err);
			}
		);
	});
	it('prepare reply in recycle bin', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid2, userName : 'snowman', text: 'reply text 2' },
			function (err, res, body) {
				res.should.status(200);
				pid22 = body.postId;
				next(err);
			}
		);
	});
	it('assume logged out', function (next) {
		test.request('/api/logout', next);
	});
	it("can not get post when not logged in", function (next) {
		test.request('/api/get-post', {threadId: tid1, postId: pid11}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	it('can get head', function (next) {
		test.request('/api/get-post', {threadId: tid1, postId: pid11}, function (err, res, body) {
			res.should.status(200);
			body.head.should.true;
			body.categoryId.should.equal(101);
			body.userName.should.equal('snowman');
			body.title.should.equal('title 1');
			body.text.should.equal('head text 1');
			body.visible.should.ok;
			next(err);
		});
	});
	it('can get reply', function (next) {
		test.request('/api/get-post', {threadId: tid1, postId: pid12}, function (err, res, body) {
			res.should.status(200);
			body.head.should.not.ok;
			should(!body.categoryId);
			should(!body.title);
			body.userName.should.equal('snowman');
			body.text.should.equal('reply text 1');
			next(err);
		});
	});
	it('can not get head in recycle bin', function (next) {
		test.request('/api/get-post', {threadId: tid2, postId: pid21}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_INVALID_CATEGORY);
			next(err);
		});
	});
	it('can not get reply in recycle bin', function (next) {
		test.request('/api/get-post', {threadId: tid2, postId: pid22}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_INVALID_CATEGORY);
			next(err);
		});
	});
	it('assume admin', function (next) {
		test.request('/api/login', {password: '3'}, next);
	});
	it('can get head in recycle bin as admin', function (next) {
		test.request('/api/get-post', {threadId: tid2, postId: pid22}, function (err, res, body) {
			res.should.status(200);
			next(err);
		});
	});
	it('can get head in recycle bin as admin', function (next) {
		test.request('/api/get-post', {threadId: tid2, postId: pid22}, function (err, res, body) {
			res.should.status(200);
			next(err);
		});
	});
});

describe('update-post-head', function () {
	it('assume logged out', function (next) {
		test.request('/api/logout', next);
	});
	it("can not update head when not logged in", function (next) {
		test.request('/api/update-post-head', {threadId: 0, postId: 0}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request('/api/create-post-head',
			{categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1'},
			function (err, res, body) {
				res.should.status(200);
				tid1 = body.threadId;
				pid11 = body.postId;
				next(err);
			}
		);
	});
	it('can update head except visible', function (next) {
		test.request('/api/update-post-head', {
				threadId: tid1, postId: pid11, categoryId: 101,
				userName: 'snowman u1', title: 'title u1', text: 'head text u1',
				visible: false
			},
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
	it('confirm changed', function (next) {
		test.request('/api/get-post', {threadId: tid1, postId: pid11}, function (err, res, body) {
			res.should.status(200);
			body.head.should.true;
			body.categoryId.should.equal(101);
			body.userName.should.equal('snowman u1');
			body.title.should.equal('title u1');
			body.text.should.equal('head text u1');
			body.visible.should.true;
			next(err);
		});
	});
	it('can update head category', function (next) {
		test.request('/api/update-post-head', {
				threadId: tid1, postId: pid11, categoryId: 102,
				userName: 'snowman u1', title: 'title u1', text: 'head text u1',
				visible: true
			},
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
	it('confirm changed', function (next) {
		test.request('/api/get-post', {threadId: tid1, postId: pid11}, function (err, res, body) {
			res.should.status(200);
			body.categoryId.should.equal(102);
			next(err);
		});
	});
	it('can not update head category to recycle bin as user', function (next) {
		test.request('/api/update-post-head', {
				threadId: tid1, postId: pid11, categoryId: 40,
				userName: 'snowman u1', title: 'title u1', text: 'head text u1',
				visible: true
			},
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('can not update head with empty title', function (next) {
		test.request('/api/update-post-head', {
				threadId: tid1, postId: pid11, categoryId: 101,
				userName: 'snowman u1', title: ' ', text: 'text',
				visible: true
			},
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].title.should.equal(msg.ERR_FILL_TITLE);
				next(err);
			}
		);
	});
	it('can not update head with empty userName', function (next) {
		test.request('/api/update-post-head', {
				threadId: tid1, postId: pid11, categoryId: 101,
				userName: ' ', title: 'title', text: 'text',
				visible: true
			},
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
	it('assume admin', function (next) {
		test.request('/api/login', {password: '3'}, next);
	});
	it('can update head category to recycle bin as admin', function (next) {
		test.request('/api/update-post-head', {
				threadId: tid1, postId: pid11, categoryId: 40,
				userName: 'snowman u1', title: 'title u1', text: 'head text u1',
				visible: true
			},
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
});

describe('update-post-reply', function () {
	it('assume logged out', function (next) {
		test.request('/api/logout', next);
	});
	it("can not update reply when not logged in", function (next) {
		test.request('/api/update-post-reply', {threadId: 0, postId: 0}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res, body) {
				res.should.status(200);
				tid1 = body.threadId;
				pid11 = body.postId;
				next(err);
			}
		);
	});
	it('prepare reply', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid1, userName : 'snowman', text: 'reply text 1' },
			function (err, res, body) {
				res.should.status(200);
				pid12 = body.postId;
				next(err);
			}
		);
	});
	it('can update reply except visible', function (next) {
		test.request('/api/update-post-reply', {
				threadId: tid1, postId: pid12,
				userName: 'snowman u1', text: 'reply text u1',
				visible: false
			},
			function (err, res, body) {
				res.should.status(200);
				next(err);
			}
		);
	});
	it('confirm changed', function (next) {
		test.request('/api/get-post', {threadId: tid1, postId: pid12}, function (err, res, body) {
			res.should.status(200);
			body.head.should.false;
			body.userName.should.equal('snowman u1');
			body.text.should.equal('reply text u1');
			body.visible.should.true;
			next(err);
		});
	});
	it('can not update reply with empty userName', function (next) {
		test.request('/api/update-post-reply', {
				threadId: tid1, postId: pid12,
				userName: ' ', text: 'text',
				visible: true
			},
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].userName.should.equal(msg.ERR_FILL_USERNAME);
				next(err);
			}
		);
	});
});

describe('file upload', function () {
	it('assume user', function (next) {
		test.request('/api/login', {password: '1'}, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request('/api/create-post-head',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res, body) {
				res.should.status(200);
				tid1 = body.threadId;
				pid11 = body.postId;
				next(err);
			}
		);
	});
	function fexists(id, file) {
		return path.existsSync(upload.getPostDir({_id: id}) + '/' + file);
	}
	it('can upload file', function (next) {
		test.request('/api/create-post-reply',
			{ threadId: tid1, userName : 'snowman', text: 'reply text 1' },
			['file1.txt', 'file22.txt'],
			function (err, res, body) {
				res.should.status(200);
				pid12 = body.postId;
				should(fexists(pid12, 'file1.txt'));
				should(fexists(pid12, 'file22.txt'));
				next(err);
			}
		);
	});
	it('can delete file1.txt', function (next) {
		test.request('/api/update-post-reply', {
				threadId: tid1, postId: pid12, userName: 'snowman', text: 'reply text',
				delFile: ['file1.txt']
			},
			function (err, res, body) {
				res.should.status(200);
				should(!fexists(pid12, 'file1.txt'));
				should(fexists(pid12, 'file22.txt'));
				next(err);
			}
		);
	});
	it('can upload file1.txt again', function (next) {
		test.request('/api/update-post-reply', {
				threadId: tid1, postId: pid12, userName: 'snowman', text: 'reply text'
			},
			['file1.txt'],
			function (err, res, body) {
				res.should.status(200);
				should(fexists(pid12, 'file1.txt'));
				should(fexists(pid12, 'file22.txt'));
				next(err);
			}
		);
	});
	it('can delete file1.txt and file22.txt', function (next) {
		test.request('/api/update-post-reply', {
				threadId: tid1, postId: pid12, userName: 'snowman', text: 'reply text',
				delFile: ['file1.txt', 'file22.txt']
			},
			function (err, res, body) {
				res.should.status(200);
				should(!fexists(pid12, 'file1.txt'));
				should(!fexists(pid12, 'file22.txt'));
				next(err);
			}
		);
	});
});
