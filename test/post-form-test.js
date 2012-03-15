var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var Form = require('../main/post-form.js');
var msg = require('../main/msg.js');
var test = require('./test.js');

before(function (next) {
	test.prepare('config,mongo', next);
});

describe("PostForm", function () {
	it("can be created", function () {
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

	describe("validateThreadAndPost", function () {
		it("should success", function () {
			var req = { body: {
				title: ' cool thread ', userName : ' snow man '
			}};
			var form = new Form(req);
			form.validateThreadAndPost();
			form.error.should.length(0);
		});
		it("should find empty title", function () {
			var req = { body: {
				title: ' ', userName : ' snow man '
			}};
			var form = new Form(req);
			form.validateThreadAndPost();
			form.error.length.should.ok;
			form.error[0].title.should.equal(msg.ERR_FILL_TITLE);
		});
		it("should find big title", function () {
			var req = { body: {
				title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title',
				userName : ' snow man '
			}};
			var form = new Form(req);
			form.validateThreadAndPost();
			form.error.length.should.ok;
			form.error[0].title.should.equal(msg.ERR_SHORTEN_TITLE);
		});
	});

	describe("validatePost", function () {
		it("should success", function () {
			var req = { body: {
				userName : ' snow man '
			}};
			var form = new Form(req);
			var error = [];
			form.validatePost(error);
			error.should.length(0);
		});
		it("should find empty userName ", function () {
			var req = { body: {
				userName : ' '
			}};
			var form = new Form(req);
			form.validatePost();
			form.error.length.should.ok;
			form.error[0].userName .should.equal(msg.ERR_FILL_USERNAME);
		});
		it("should find big userName ", function () {
			var req = { body: {
				userName : '123456789012345678901234567890123'
			}};
			var form = new Form(req);
			form.validatePost();
			form.error.length.should.ok;
			form.error[0].userName .should.equal(msg.ERR_SHORTEN_USERNAME);
		});
	});
});

describe("PostForm/mongo", function () {
	var req = { body: {
		categoryId: 100,
		userName : ' snow man ', title: ' cool thread ', text: ' cool text '
	}};
	var form = new Form(req);
	var thread1;
	var post1, post2;
	it("can insert thread", function () {
		form.insertThread(function (err, thread) {
			thread.should.ok;
			thread._id.should.ok;
			thread1 = thread;
		});
	});
	it("can insert post", function () {
		form.insertPost(thread1, function (err, post) {
			post.should.ok;
			post._id.should.ok;
			post1 = post;
		});
	});
	it("can find thread", function (next) {
		var req = { body: {
			threadId: thread1._id
		}};
		var form = new Form(req);
		form.findThread(function (err, thread) {
			thread.should.ok;
			thread._id.should.equal(thread1._id);
			thread.categoryId.should.equal(100);
			thread.userName .should.equal('snow man');
			thread.title.should.equal('cool thread');
			next(err);
		});
	});
	it("can find thread and post", function (next) {
		var req = { body: {
			threadId: thread1._id, postId: post1._id
		}};
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			thread.should.ok;
			thread._id.should.equal(thread1._id);
			thread.categoryId.should.equal(100);
			thread.userName .should.equal('snow man');
			thread.title.should.equal('cool thread');
			post.should.ok;
			post.userName .should.equal('snow man');
			post.text.should.equal('cool text');
			next(err);
		});
	});
	it("can update thread", function (next) {
		var req = { body: {
			threadId: thread1._id, postId: post1._id,
			categoryId: 103,
			userName : 'snowman h2', title: 'cool thread h2'
		}};
		var form = new Form(req);
		form.findThread(function (err, thread) {
			form.updateThread(thread, function (err) {
				form.findThread(function (err, thread) {
					thread.categoryId.should.equal(103);
					thread.userName .should.equal('snowman h2');
					thread.title.should.equal('cool thread h2');
					next(err);
				});
			});
		});
	});
	it("can create reply", function (next) {
		var req = { body: {
			userName : 'snowman 2', text: 'cool text 2'
		}};
		var form = new Form(req);
		form.insertPost(thread1, function (err, post) {
			post.should.ok;
			post2 = post;
			next(err);
		});
	});
	it("can find reply", function (next) {
		var req = { body: {
			threadId: thread1._id, postId: post2._id
		}};
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			post._id.should.equal(post2._id);
			post.userName.should.equal('snowman 2');
			post.text.should.equal('cool text 2');
			next(err);
		});
	});
	it("can update reply", function (next) {
		var req = { body: {
			threadId: thread1._id, postId: post2._id,
			categoryId: 103,
			userName : 'snowman r2', text: 'cool text r2'
		}};
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			form.updatePost(post, function (err) {
				form.findThreadAndPost(function (err, thread, post) {
					post.userName.should.equal('snowman r2');
					post.text.should.equal('cool text r2');
					next(err);
				});
			});
		});
	});
});