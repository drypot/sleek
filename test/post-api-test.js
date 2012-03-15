var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var test = require('./test.js');

before(function (next) {
	test.prepare('config,mongo,express', next);
});

var pThreadId;
var pPostId;
var pReplyId;

describe("create-head", function () {
	it('assume logged out', function (next) {
		test.post('/api/logout', next);
	});
	it("should fail when not logged in", function (next) {
		test.post('/api/create-head', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.post('/api/login', {password: '1'}, next);
	});
	it('should success as user', function (next) {
		test.post('/api/create-head',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(200);
				body.should.have.property('threadId');
				body.should.have.property('postId');
				pThreadId = body.threadId;
				pPostId = body.postId;
				next(err);
			}
		);
	});
	it("should fail with invalid categoryId", function (next) {
		test.post('/api/create-head',
			{ categoryId: 10100, userName : 'snowman', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it("should fail with invalid title", function (next) {
		test.post('/api/create-head',
			{ categoryId: 101, userName : 'snowman', title: ' ', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].should.property('title');
				next(err);
			}
		);
	});
	it("should fail with invalid userName", function (next) {
		test.post('/api/create-head',
			{ categoryId: 101, userName : ' ', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].should.property('userName');
				next(err);
			}
		);
	});
});

describe("create-reply", function () {
	it('assume logged out', function (next) {
		test.post('/api/logout', next);
	});
	it("should fail when not logged in", function (next) {
		test.post('/api/create-reply', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		test.post('/api/login', {password: '1'}, next);
	});
	it('should success as user', function (next) {
		test.post('/api/create-reply',
			{ threadId: pThreadId, userName : 'snowman', title: 'title r1', text: 'text r1' },
			function (err, res, body) {
				res.should.status(200);
				body.should.have.property('postId');
				pReplyId = body.postId;
				next(err);
			}
		);
	});
	it("should fail with invalid threadId", function (next) {
		test.post('/api/create-reply',
			{ threadId: 99999, userName : 'snowman', title: 'title r2', text: 'text r2' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_THREAD);
				next(err);
			}
		);
	});
	it("can not create with invalid userName", function (next) {
		test.post('/api/create-reply',
			{ threadId: pThreadId, userName : ' ', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(msg.ERR_INVALID_DATA);
				body.field[0].should.property('userName');
				next(err);
			}
		);
	});
});

xdescribe("dao", function () {
	var samples = [
		{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'text 1' },
		{ categoryId: 101, userName : 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 101, userName : 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 101, userName : 'snowman', title: 'title 4', text: 'text 4' },
		{ categoryId: 103, userName : 'snowman', title: 'title 5', text: 'text 5' },
		{ categoryId: 103, userName : 'snowman', title: 'title 6', text: 'text 6' },
		{ categoryId: 104, userName : 'snowman', title: 'title 7', text: 'text 7' }
	];

	before(function (next) {
		loginAsUser(next);
	});
	xit('can add new thread', function (next) {
		async.forEachSeries(samples, function (item, next) {
			request.post({
				url: urlBase + '/api/thread'
				, body: item
			}, function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		}, next);
	});

//	xit("should return list", function (next) {
//		request.post({url: urlBase + '/api/thread'}, function (err, res, body) {
//			res.should.status(200);
//			next(err);
//		});
//	});
});
