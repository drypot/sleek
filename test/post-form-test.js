var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _form = require('../main/form/post-form')

var ERR_FILL_TITLE = '제목을 입력해 주십시오.';
var ERR_SHORTEN_TITLE = '제목을 줄여 주십시오.';
var ERR_FILL_USERNAME = '필명을 입력해 주십시오.';
var ERR_SHORTEN_USERNAME = '필명을 줄여 주십시오.';

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.runInit(next);
});


describe("form make", function () {
	it("should success", function () {
		var req = { body: {
			threadId: 20, postId: 30, categoryId: 100,
			userName: ' snow man ', title: ' cool thread ', text: ' cool text ',
			visible: true, delFiles: ['file1', 'file2']
		}};
		var form = _form.make(req);
		form.threadId.should.equal(20);
		form.postId.should.equal(30);
		form.categoryId.should.equal(100);
		form.userName.should.equal('snow man');
		form.title.should.equal('cool thread');
		form.text.should.equal('cool text');
		form.visible.should.equal(true);
		form.delFiles.should.eql(['file1', 'file2']);
	});
});

describe("validate create thread", function () {
	it("should success", function () {
		var req = { body: {
			title: ' cool thread ', userName: ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateThread(errors);
		errors.should.length(0);
	});
	it("should fail with empty title", function () {
		var req = { body: {
			title: ' ', userName: ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateThread(errors);
		errors.length.should.above(0);
		errors[0].title.should.equal(ERR_FILL_TITLE);
	});
	it("should fail with big title", function () {
		var req = { body: {
			title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title',
			userName: ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateThread(errors);
		errors.length.should.above(0);
		errors[0].title.should.equal(ERR_SHORTEN_TITLE);
	});
});

describe("validate create reply", function () {
	it("should success", function () {
		var req = { body: {
			userName: ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateReply(errors);
		errors.should.length(0);
	});
	it("should fail with empty userName", function () {
		var req = { body: {
			userName: ' '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateReply(errors);
		errors.length.should.above(0);
		errors[0].userName.should.equal(ERR_FILL_USERNAME);
	});
	it("should fail with big userName", function () {
		var req = { body: {
			userName: '123456789012345678901234567890123'
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateReply(errors);
		errors.length.should.above(0);
		errors[0].userName.should.equal(ERR_SHORTEN_USERNAME);
	});
});

describe("thread io", function () {
	var postList = [];
	var threadId;
	describe("create thread", function () {
		var req = { body: {
			categoryId: 100,
			userName: ' snow man ', title: ' cool thread ', text: ' cool text '
		}};
		var form = _form.make(req);
		it("should success", function () {
			threadId = form.createThread(postList);
			threadId.should.ok;
			threadId.should.above(0);
			postList.should.not.empty;
		});
		describe("find thread", function () {
			it("should success", function (next) {
				var req = { body: {
					threadId: threadId
				}};
				var form = _form.make(req);
				form.findThread(function (err, thread) {
					thread.should.ok;
					thread._id.should.equal(threadId);
					thread.categoryId.should.equal(100);
					thread.userName.should.equal('snow man');
					thread.title.should.equal('cool thread');
					next(err);
				});
			});
		});
		describe("find thread and post", function () {
			it("should success", function (next) {
				var req = { body: {
					threadId: threadId, postId: postList[0]
				}};
				var form = _form.make(req);
				form.findThreadAndPost(function (err, thread, post) {
					thread.should.ok;
					thread._id.should.equal(threadId);
					thread.categoryId.should.equal(100);
					thread.userName.should.equal('snow man');
					thread.title.should.equal('cool thread');
					post.should.ok;
					post._id.should.equal(postList[0]);
					post.userName.should.equal('snow man');
					post.text.should.equal('cool text');
					next(err);
				});
			});
		});
		describe("update", function () {
			it("shoud success", function (next) {
				var req = { body: {
					threadId: threadId, postId: postList[0],
					categoryId: 103,
					userName: 'snowman u1', title: 'cool thread u1', text: 'cool text u1'
				}};
				var form = _form.make(req);
				form.findThreadAndPost(function (err, thread, post) {
					form.update(thread, post, true, true);
					var req = { body: {
						threadId: threadId, postId: postList[0]
					}};
					var form2 = _form.make(req);
					form2.findThreadAndPost(function (err, thread, post) {
						thread.should.ok;
						thread._id.should.equal(threadId);
						thread.categoryId.should.equal(103);
						thread.userName.should.equal('snowman u1');
						thread.title.should.equal('cool thread u1');
						post.should.ok;
						post._id.should.equal(postList[0]);
						post.userName.should.equal('snowman u1');
						post.text.should.equal('cool text u1');
						next(err);
					});
				});
			});
		});
		describe("create reply", function () {
			var postId;
			it("should success", function () {
				var req = { body: {
					threadId: threadId,
					userName: 'snow man 2', text: 'cool text 2'
				}};
				var form = _form.make(req);
				postId = form.createReply(postList);
				postId.should.ok;
				postId.should.equal(postList[1]);
			});
			describe("find reply", function () {
				it("should success", function (next) {
					var req = { body: {
						threadId: threadId, postId: postId
					}};
					var form = _form.make(req);
					form.findThreadAndPost(function (err, thread, post) {
						post.should.ok;
						post._id.should.equal(postId);
						post.userName.should.equal('snow man 2');
						post.text.should.equal('cool text 2');
						next(err);
					});
				});
			});
		});

	}); // create thread
}); // thread io

