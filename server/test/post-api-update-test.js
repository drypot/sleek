var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
var es = require('../main/es').options({ dropIndex: true });
var express = require('../main/express');
var rcs = require('../main/rcs');
var msgs = require('../main/msgs');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe('updating head', function () {
	it('given no session', function (next) {
		test.logout(next);
	});
	it('should fail', function (next) {
		request.put(test.url + '/api/threads/0/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		test.loginUser(next);
	});
	var tid1, pid11, pid12;
	it('given p11', function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title 1', text: 'post11' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			tid1 = res.body.threadId;
			pid11 = res.body.postId;
			next(err);
		});
	});
	it('should fail when title empty', function (next) {
		var form = { categoryId: 101, writer: 'snowman u1', title: ' ', text: 'text', visible: true };
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid11).send(form).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_DATA);
			res.body.fields.title.indexOf(msgs.FILL_TITLE);
			next(err);
		});
	});
	it.skip('when writer empty, should fail', function (next) {
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid11,
			{ categoryId: 101, writer: ' ', title: 'title', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_DATA);
				res.body.fields.writer[0].should.equal(l.msg.FILL_WRITER);
				next(err);
			}
		);
	});

	it.skip('should success, except visible field without category change, ', function (next) {
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid11,
			{ categoryId: 101, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
	it.skip('and can confirm changed', function (next) {
		request.get(test.url + '/api/threads/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.head.should.true;
			res.body.category.id.should.equal(101);
			res.body.post.writer.should.equal('snowman u1');
			res.body.thread.title.should.equal('title u1');
			res.body.post.text.should.equal('head text u1');
			res.body.post.visible.should.true;
			next(err);
		});
	});
	it.skip('with category chagne, should success', function (next) {
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid11,
			{ categoryId: 102, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
	it.skip('and can confirm changed', function (next) {
		request.get(test.url + '/api/threads/' + tid1 + '/' + pid11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.category.id.should.equal(102);
			next(err);
		});
	});
	it.skip('when thread is in recycle bin, should fail', function (next) {
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid11,
			{ categoryId: 40, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it.skip('given admin session', function (next) {
		request.post(test.url + '/api/sessions', { password: '3' }, next);
	});
	it.skip('when thread is in recyle bin, should success', function (next) {
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid11,
			{ categoryId: 40, writer: 'snowman u1', title: 'title u1', text: 'head text u1', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
});

describe('updating reply', function () {
	it.skip('given no session', function (next) {
		test.logout(next);
	});
	it.skip("should fail", function (next) {
		request.put(test.url + '/api/threads/0/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it.skip('given user session', function (next) {
		test.loginUser(next);
	});
	var tid1, pid11, pid12;
	it.skip('and head', function (next) {
		request.post(test.url + '/api/threads',
			{ categoryId: 101, writer: 'snowman', title: 'title 1', text: 'post11' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	it.skip('and replay', function (next) {
		request.post(test.url + '/api/threads/' + tid1,
			{ writer: 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				pid12 = res.body.postId;
				next(err);
			}
		);
	});
	it.skip('should success, except visible field', function (next) {
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid12,
			{ writer: 'snowman u1', text: 'reply text u1', visible: false },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
	it.skip('and can confirm changed', function (next) {
		request.get(test.url + '/api/threads/' + tid1 + '/' + pid12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.head.should.false;
			res.body.post.writer.should.equal('snowman u1');
			res.body.post.text.should.equal('reply text u1');
			res.body.post.visible.should.true;
			next(err);
		});
	});
	it.skip('when writer empty, should fail', function (next) {
		request.put(test.url + '/api/threads/' + tid1 + '/' + pid12,
			{ writer: ' ', text: 'text', visible: true },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_DATA);
				res.body.fields.writer[0].should.equal(l.msg.FILL_WRITER);
				next(err);
			}
		);
	});
});
