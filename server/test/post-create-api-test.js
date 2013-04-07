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

describe('creating head', function () {
	it('given no session', function (next) {
		request.del('/api/session', next);
	});
	it("should fail", function (next) {
		request.post('/api/thread', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		request.post('/api/session', { password: '1' }, next);
	});
	it('should success', function (next) {
		request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				res.body.should.have.property('threadId');
				res.body.should.have.property('postId');
				next(err);
			}
		);
	});
	it("when categoryId invalid, should fail", function (next) {
		request.post('/api/thread',
			{ categoryId: 10100, writer : 'snowman', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it("when title empty, should fail", function (next) {
		request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: ' ', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_DATA);
				res.body.error.title[0].should.equal(l.msg.FILL_TITLE);
				next(err);
			}
		);
	});
	it("when title big, should fail", function (next) {
		request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', text: 'text', title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title'},
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_DATA);
				res.body.error.title[0].should.equal(l.msg.SHORTEN_TITLE);
				next(err);
			}
		);
	});
	it("when writer empty, should fail", function (next) {
		request.post('/api/thread',
			{ categoryId: 101, writer : ' ', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_DATA);
				res.body.error.writer[0].should.equal(l.msg.FILL_WRITER);
				next(err);
			}
		);
	});
	it("when writer big, should fail", function (next) {
		request.post('/api/thread',
			{ categoryId: 101, writer : '123456789012345678901234567890123', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_DATA);
				res.body.error.writer[0].should.equal(l.msg.SHORTEN_WRITER);
				next(err);
			}
		);
	});
	it('when category is recycle bin, should fail', function (next) {
		request.post('/api/thread',
			{ categoryId: 40, writer : 'snowman', title: 'title', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		request.post('/api/session', { password: '3' }, next);
	});
	it('when category is recycle bin, should success', function (next) {
		request.post('/api/thread',
			{ categoryId: 40, writer : 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
});

describe('creating reply', function () {
	it('given no session', function (next) {
		request.del('/api/session', next);
	});
	it("should fail", function (next) {
		request.post('/api/thread/0', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		request.post('/api/session', { password: '1' }, next);
	});
	var tid;
	it('and head tid', function (next) {
		request.post('/api/thread',
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
		request.post('/api/thread/' + tid,
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
		request.post('/api/thread/99999',
			{ writer : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_THREAD);
				next(err);
			}
		);
	});
	it("when threadId is xxx, should fail", function (next) {
		request.post('/api/thread/xxx',
			{ writer : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(404);
				next(err);
			}
		);
	});
	it("when writer empty, should fail", function (next) {
		request.post('/api/thread/' + tid,
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
		request.post('/api/session', { password: '3' }, next);
	});
	var tid2;
	it('and head in recycle bin', function (next) {
		request.post('/api/thread',
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
		request.post('/api/session', { password: '1' }, next);
	});
	it('when creating reply on recycle bin thread, should fail', function (next) {
		request.post('/api/thread/' + tid2,
			{ writer : 'snowman', text: 'text' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it('given admin session', function (next) {
		request.post('/api/session', { password: '3' }, next);
	});
	it('when creating reply on recycle bin thread, should success', function (next) {
		request.post('/api/thread/' + tid2,
			{ writer : 'snowman', text: 'reply text in recycle bin' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
});
