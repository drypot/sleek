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


describe("form creation", function () {
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

describe("new thread validation", function () {
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

describe("new reply validation", function () {
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
