var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
var es = require('../main/es').options({ dropIndex: true });
var express = require('../main/express');
var rcs = require('../main/rcs');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe('reading post', function () {
	it('given user session', function (next) {
		request.post(test.url + '/api/sessions', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head t1, p11', function (next) {
		request.post(test.url + '/api/threads',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next();
			}
		);
	});
	it('and reply p12', function (next) {
		request.post(test.url + '/api/threads/' + t1,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p12 = res.body.postId;
				next();
			}
		);
	});
	it('given admin session', function (next) {
		request.post(test.url + '/api/sessions', { password: '3' }, next);
	});
	var t2, p21, p22;
	it('and head t2, p21 in recycle bin', function (next) {
		request.post(test.url + '/api/threads',
			{ categoryId: 40, writer : 'snowman', title: 'title 2', text: 'head text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t2 = res.body.threadId;
				p21 = res.body.postId;
				next();
			}
		);
	});
	it('and reply p22 in recycle bin', function (next) {
		request.post(test.url + '/api/threads/' + t2,
			{ writer : 'snowman', text: 'reply text 2' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p22 = res.body.postId;
				next();
			}
		);
	});
	it('given no session', function (next) {
		request.del('/api/sessions', next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		request.post(test.url + '/api/sessions', { password: '1' }, next);
	});
	it('for head, should success', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.head.should.true;
			res.body.category.id.should.equal(101);
			res.body.post.writer.should.equal('snowman');
			res.body.thread.title.should.equal('title 1');
			res.body.post.text.should.equal('head text 1');
			res.body.post.visible.should.ok;
			next();
		});
	});
	it('for reply, should success', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.head.should.not.ok;
			res.body.post.writer.should.equal('snowman');
			res.body.post.text.should.equal('reply text 1');
			next();
		});
	});
	it('for head head in recycle bin, should fail', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p21, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('for reply in recycle bin, should fail', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_CATEGORY);
			next();
		});
	});
	it('given admin session', function (next) {
		request.post(test.url + '/api/sessions', { password: '3' }, next);
	});
	it('for head head in recycle bin, should success', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('for reply in recycle bin, should success', function (next) {
		request.get(test.url + '/api/threads/' + t2 + '/' + p22, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});

describe('editable field', function () {
	it('given user session', function (next) {
		request.post(test.url + '/api/sessions', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head t1, p11', function (next) {
		request.post(test.url + '/api/threads',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next();
			}
		);
	});
	it('and reply p12', function (next) {
		request.post(test.url + '/api/threads/' + t1,
			{ writer : 'snowman', text: 'reply text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p12 = res.body.postId;
				next();
			}
		);
	});
	it('for p11, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it('for p12, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it('given new user session', function (next) {
		request.post(test.url + '/api/sessions', { password: '1' }, next);
	});
	it('for p11, should be false', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it('for p12, should be false', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.false;
			next();
		});
	});
	it('given admin session', function (next) {
		request.post(test.url + '/api/sessions', { password: '3' }, next);
	});
	it('for p11, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p11, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});
	it('for p12, should be true', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.editable.should.be.true;
			next();
		});
	});

});
