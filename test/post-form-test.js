var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var Form = require('../main/post-form.js');
var msg = require('../main/msg.js');
var test = require('./test.js');

before(function (next) {
	test.prepare('config,mongo', next);
});

describe("make", function () {
	it("can make form", function () {
		var req = { body: {
			threadId: 20, postId: 30, categoryId: 100,
			userName : ' snow man ', title: ' cool thread ', text: ' cool text ',
			visible: true, delFile: ['file1', 'file2']
		}};
		var form = new Form(req);
		form.threadId.should.equal(20);
		form.postId.should.equal(30);
		form.categoryId.should.equal(100);
		form.userName .should.equal('snow man');
		form.title.should.equal('cool thread');
		form.text.should.equal('cool text');
		form.visible.should.true;
		form.delFile.should.eql(['file1', 'file2']);
	});
});

describe("validateHead", function () {
	it("should success", function () {
		var req = { body: {
			title: ' cool thread ', userName : ' snow man '
		}};
		var form = new Form(req);
		form.validateHead();
		form.error.should.length(0);
	});
	it("should find empty title", function () {
		var req = { body: {
			title: ' ', userName : ' snow man '
		}};
		var form = new Form(req);
		form.validateHead();
		form.error.length.should.ok;
		form.error[0].title.should.equal(msg.ERR_FILL_TITLE);
	});
	it("should find big title", function () {
		var req = { body: {
			title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title',
			userName : ' snow man '
		}};
		var form = new Form(req);
		form.validateHead();
		form.error.length.should.ok;
		form.error[0].title.should.equal(msg.ERR_SHORTEN_TITLE);
	});
});

describe("validateReply", function () {
	it("should success", function () {
		var req = { body: {
			userName : ' snow man '
		}};
		var form = new Form(req);
		var error = [];
		form.validateReply(error);
		error.should.length(0);
	});
	it("should find empty userName ", function () {
		var req = { body: {
			userName : ' '
		}};
		var form = new Form(req);
		form.validateReply();
		form.error.length.should.ok;
		form.error[0].userName .should.equal(msg.ERR_FILL_USERNAME);
	});
	it("should find big userName ", function () {
		var req = { body: {
			userName : '123456789012345678901234567890123'
		}};
		var form = new Form(req);
		form.validateReply();
		form.error.length.should.ok;
		form.error[0].userName .should.equal(msg.ERR_SHORTEN_USERNAME);
	});
});

describe("PostForm", function () {
	var req = { body: {
		categoryId: 100,
		userName : ' snow man ', title: ' cool thread ', text: ' cool text '
	}};
	var pThreadId;
	var pPostId;
	var form = new Form(req);
	it("can create head", function () {
		form.createHead(function (err, thread, post) {
			thread.should.ok;
			thread._id.should.ok;
			post.should.ok;
			post._id.should.ok;
			pThreadId = thread._id;
			pPostId = post._id;
		});
	});
	it("can find thread", function (next) {
		var req = { body: {
			threadId: pThreadId
		}};
		var form = new Form(req);
		form.findThread(function (err, thread) {
			thread.should.ok;
			thread._id.should.equal(pThreadId);
			thread.categoryId.should.equal(100);
			thread.userName .should.equal('snow man');
			thread.title.should.equal('cool thread');
			next(err);
		});
	});
	it("can find thread and post", function (next) {
		var req = { body: {
			threadId: pThreadId, postId: pPostId
		}};
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			thread.should.ok;
			thread._id.should.equal(pThreadId);
			thread.categoryId.should.equal(100);
			thread.userName .should.equal('snow man');
			thread.title.should.equal('cool thread');
			post.should.ok;
			post.userName .should.equal('snow man');
			post.text.should.equal('cool text');
			next(err);
		});
	});
	it("can update head", function (next) {
		var req = { body: {
			threadId: pThreadId, postId: pPostId,
			categoryId: 103,
			userName : 'snowman h2', title: 'cool thread h2', text: 'cool text h2'
		}};
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			form.updateHead(thread, post, true, function (err) {
				form.findThreadAndPost(function (err, thread, post) {
					thread.categoryId.should.equal(103);
					thread.userName .should.equal('snowman h2');
					thread.title.should.equal('cool thread h2');
					post.userName .should.equal('snowman h2');
					post.text.should.equal('cool text h2');
					next(err);
				});
			});
		});
	});
	it("can create reply", function (next) {
		var req = { body: {
			threadId: pThreadId,
			userName : 'snowman 2', text: 'cool text 2'
		}};
		var thread = {_id: pThreadId};
		var form = new Form(req);
		form.createReply(thread, function (err, post) {
			post.should.ok;
			pPostId = post._id;
			next(err);
		});
	});
	it("can find reply", function (next) {
		var req = { body: {
			threadId: pThreadId, postId: pPostId
		}};
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			post._id.should.equal(pPostId);
			post.userName.should.equal('snowman 2');
			post.text.should.equal('cool text 2');
			next(err);
		});
	});
	it("can update reply", function (next) {
		var req = { body: {
			threadId: pThreadId, postId: pPostId,
			categoryId: 103,
			userName : 'snowman r2', text: 'cool text r2'
		}};
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			form.updateReply(post, true, function (err) {
				form.findThreadAndPost(function (err, thread, post) {
					post.userName.should.equal('snowman r2');
					post.text.should.equal('cool text r2');
					next(err);
				});
			});
		});
	});
});