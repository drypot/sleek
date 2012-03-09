var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _thread = require('../main/model/thread');
var _form = require('../main/form/post-form');

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


describe("form make,", function () {
	it("should success", function () {
		var req = { body: {
			threadId: 20, postId: 30, categoryId: 100,
			username : ' snow man ', title: ' cool thread ', text: ' cool text ',
			visible: true, delFile: ['file1', 'file2']
		}};
		var form = _form.make(req);
		form.threadId.should.equal(20);
		form.postId.should.equal(30);
		form.categoryId.should.equal(100);
		form.username .should.equal('snow man');
		form.title.should.equal('cool thread');
		form.text.should.equal('cool text');
		form.visible.should.equal(true);
		form.delFile.should.eql(['file1', 'file2']);
	});
});

describe("validate create thread,", function () {
	it("should success", function () {
		var req = { body: {
			title: ' cool thread ', username : ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateThread(errors);
		errors.should.length(0);
	});
	it("should fail with empty title", function () {
		var req = { body: {
			title: ' ', username : ' snow man '
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
			username : ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreateThread(errors);
		errors.length.should.above(0);
		errors[0].title.should.equal(ERR_SHORTEN_TITLE);
	});
});

describe("validate create post,", function () {
	it("should success", function () {
		var req = { body: {
			username : ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreatePost(errors);
		errors.should.length(0);
	});
	it("should fail with empty username ", function () {
		var req = { body: {
			username : ' '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreatePost(errors);
		errors.length.should.above(0);
		errors[0].username .should.equal(ERR_FILL_USERNAME);
	});
	it("should fail with big username ", function () {
		var req = { body: {
			username : '123456789012345678901234567890123'
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateCreatePost(errors);
		errors.length.should.above(0);
		errors[0].username .should.equal(ERR_SHORTEN_USERNAME);
	});
});

describe("thread io,", function () {
	describe("create thread,", function () {
		var req = { body: {
			categoryId: 100,
			username : ' snow man ', title: ' cool thread ', text: ' cool text '
		}};
		var prevThreadId;
		var prevPostId;
		var form = _form.make(req);
		it("should success", function () {
			form.createThread(function (err, thread, post) {
				thread.should.ok;
				thread._id.should.above(0);
				post.should.ok;
				post._id.should.above(0);
				prevThreadId = thread._id;
				prevPostId = post._id;
			});
		});
		describe("find thread,", function () {
			it("should success", function (next) {
				var req = { body: {
					threadId: prevThreadId
				}};
				var form = _form.make(req);
				form.findThread(function (err, thread) {
					thread.should.ok;
					thread._id.should.equal(prevThreadId);
					thread.categoryId.should.equal(100);
					thread.username .should.equal('snow man');
					thread.title.should.equal('cool thread');
					next(err);
				});
			});
		});
		describe("find thread and post,", function () {
			it("should success", function (next) {
				var req = { body: {
					threadId: prevThreadId, postId: prevPostId
				}};
				var form = _form.make(req);
				form.findThreadAndPost(function (err, thread, post) {
					thread.should.ok;
					thread._id.should.equal(prevThreadId);
					thread.categoryId.should.equal(100);
					thread.username .should.equal('snow man');
					thread.title.should.equal('cool thread');
					post.should.ok;
					post.username .should.equal('snow man');
					post.text.should.equal('cool text');
					next(err);
				});
			});
		});
		describe("update,", function () {
			it("shoud success", function (next) {
				var req = { body: {
					threadId: prevThreadId, postId: prevPostId,
					categoryId: 103,
					username : 'snowman u1', title: 'cool thread u1', text: 'cool text u1'
				}};
				var form = _form.make(req);
				form.findThreadAndPost(function (err, thread, post) {
					form.update(thread, post, true, true, function (err) {
						var req = { body: {
							threadId: prevThreadId, postId: prevPostId
						}};
						var form2 = _form.make(req);
						form2.findThreadAndPost(function (err, thread, post) {
							thread.should.ok;
							thread._id.should.equal(prevThreadId);
							thread.categoryId.should.equal(103);
							thread.username .should.equal('snowman u1');
							thread.title.should.equal('cool thread u1');
							post.should.ok;
							post._id.should.equal(prevPostId);
							post.username .should.equal('snowman u1');
							post.text.should.equal('cool text u1');
							next(err);
						});
					});
				});
			});
		});
		describe("create post,", function () {
			it("should success", function () {
				var req = { body: {
					threadId: prevThreadId,
					username : 'snow man 2', text: 'cool text 2'
				}};
				var thread = _thread.make({_id: prevThreadId});
				var form = _form.make(req);
				form.createPost(thread, function (err, post) {
					post.should.ok;
					prevPostId = post._id;
				});
			});
			describe("find post,", function () {
				it("should success", function (next) {
					var req = { body: {
						threadId: prevThreadId, postId: prevPostId
					}};
					var form = _form.make(req);
					form.findThreadAndPost(function (err, thread, post) {
						post.should.ok;
						post._id.should.equal(prevPostId);
						post.username .should.equal('snow man 2');
						post.text.should.equal('cool text 2');
						next(err);
					});
				});
			});
		});

	}); // create thread
}); // thread io

