var _ = require('underscore');
var _should = require('should');

var _l = require('../main/l');
var _config = require("../main/config");
var _db = require('../main/db');
var _form = require('../main/form/post-form');

var ERR_FILL_TITLE = '제목을 입력해 주십시오.';
var ERR_SHORTEN_TITLE = '제목을 줄여 주십시오.';
var ERR_FILL_USERNAME = '필명을 입력해 주십시오.';
var ERR_SHORTEN_USERNAME = '필명을 줄여 주십시오.';

before(function (next) {
	_l.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_l.runInit(next);
});

describe("form,", function () {
	it("can make form", function () {
		var req = { body: {
			threadId: 20, postId: 30, categoryId: 100,
			userName : ' snow man ', title: ' cool thread ', text: ' cool text ',
			visible: true, delFile: ['file1', 'file2']
		}};
		var form = _form.make(req);
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

describe("head validation,", function () {
	it("should be ok", function () {
		var req = { body: {
			title: ' cool thread ', userName : ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateHead(errors);
		errors.should.length(0);
	});
	it("should fail with empty title", function () {
		var req = { body: {
			title: ' ', userName : ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateHead(errors);
		errors.length.should.ok;
		errors[0].title.should.equal(ERR_FILL_TITLE);
	});
	it("should fail with big title", function () {
		var req = { body: {
			title: 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title',
			userName : ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateHead(errors);
		errors.length.should.ok;
		errors[0].title.should.equal(ERR_SHORTEN_TITLE);
	});
});

describe("reply validation,", function () {
	it("should be ok", function () {
		var req = { body: {
			userName : ' snow man '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateReply(errors);
		errors.should.length(0);
	});
	it("should fail with empty userName ", function () {
		var req = { body: {
			userName : ' '
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateReply(errors);
		errors.length.should.ok;
		errors[0].userName .should.equal(ERR_FILL_USERNAME);
	});
	it("should fail with big userName ", function () {
		var req = { body: {
			userName : '123456789012345678901234567890123'
		}};
		var form = _form.make(req);
		var errors = [];
		form.validateReply(errors);
		errors.length.should.ok;
		errors[0].userName .should.equal(ERR_SHORTEN_USERNAME);
	});
});

describe("create head,", function () {
	var req = { body: {
		categoryId: 100,
		userName : ' snow man ', title: ' cool thread ', text: ' cool text '
	}};
	var prevThreadId;
	var prevPostId;
	var form = _form.make(req);
	it("can create head", function () {
		form.createHead(function (err, thread, post) {
			thread.should.ok;
			thread._id.should.ok;
			post.should.ok;
			post._id.should.ok;
			prevThreadId = thread._id;
			prevPostId = post._id;
		});
	});
	it("can find thread", function (next) {
		var req = { body: {
			threadId: prevThreadId
		}};
		var form = _form.make(req);
		form.findThread(function (err, thread) {
			thread.should.ok;
			thread._id.should.equal(prevThreadId);
			thread.categoryId.should.equal(100);
			thread.userName .should.equal('snow man');
			thread.title.should.equal('cool thread');
			next(err);
		});
	});
	it("can find thread and post", function (next) {
		var req = { body: {
			threadId: prevThreadId, postId: prevPostId
		}};
		var form = _form.make(req);
		form.findThreadAndPost(function (err, thread, post) {
			thread.should.ok;
			thread._id.should.equal(prevThreadId);
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
			threadId: prevThreadId, postId: prevPostId,
			categoryId: 103,
			userName : 'snowman h2', title: 'cool thread h2', text: 'cool text h2'
		}};
		var form = _form.make(req);
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
			threadId: prevThreadId,
			userName : 'snowman 2', text: 'cool text 2'
		}};
		var thread = {_id: prevThreadId};
		var form = _form.make(req);
		form.createReply(thread, function (err, post) {
			post.should.ok;
			prevPostId = post._id;
			next(err);
		});
	});
	it("can find reply", function (next) {
		var req = { body: {
			threadId: prevThreadId, postId: prevPostId
		}};
		var form = _form.make(req);
		form.findThreadAndPost(function (err, thread, post) {
			post._id.should.equal(prevPostId);
			post.userName .should.equal('snowman 2');
			post.text.should.equal('cool text 2');
			next(err);
		});
	});
	it("can update reply", function (next) {
		var req = { body: {
			threadId: prevThreadId, postId: prevPostId,
			categoryId: 103,
			userName : 'snowman r2', text: 'cool text r2'
		}};
		var form = _form.make(req);
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
}); // create thread

