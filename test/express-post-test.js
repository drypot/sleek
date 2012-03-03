var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _express = require("../main/express");

var ERR_LOGIN_FIRST = 'login first';
var ERR_LOGIN_FAILED = 'login failed';
var ERR_NOT_AUTHORIZED = 'not authorized';
var ERR_INVALID_DATA = 'invalid data';

var urlBase;

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.addAfterInit(function (next) {
		urlBase = "http://localhost:" + _config.appServerPort;
		next();
	});
	_lang.runInit(next);
});

describe("parseQuery", function () {
	it("can parse params", function (next) {
		_request.get({
			url: urlBase + '/api/test/parse-query',
			qs: {
				categoryId: 10, threadId: 20, postId: 30
			}
		}, function (err, res, body) {
			res.should.status(200);
			body.categoryId.should.equal(10);
			body.threadId.should.equal(20);
			body.postId.should.equal(30);
			next(err);
		});
	});
	it("can supply defaults", function (next) {
		_request.get({
			url: urlBase + '/api/test/parse-query'
		}, function (err, res, body) {
			res.should.status(200);
			body.categoryId.should.equal(0);
			body.threadId.should.equal(0);
			body.postId.should.equal(0);
			next(err);
		});
	});
});


describe("parsePostForm", function () {
	it("can parse form", function (next) {
		_request.post({
			url: urlBase + '/api/test/parse-post-form',
			qs: {
				categoryId: 10, threadId: 20, postId: 30
			},
			body: {
				categoryId: 100, userName: ' snow man ',
				title: ' cool thread ', text: ' cool text ',
				visible: true,
				delFiles: ['file1', 'file2']
			}
		}, function (err, res, body) {
			res.should.status(200);
			body.now.should.ok;
			body.threadId.should.equal(20);
			body.postId.should.equal(30);
			body.categoryId.should.equal(100);
			body.userName.should.equal('snow man');
			body.title.should.equal('cool thread');
			body.text.should.equal('cool text');
			body.visible.should.equal(true);
			body.delFiles.should.eql(['file1', 'file2']);
			next(err);
		});
	});
});

describe("thread validation", function () {
	it("should success", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: ' cool thread ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(0);
			next(err);
		});
	});
	it("should fail with empty title", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: '  ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
	it("should fail with big title", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: ' big title title title title title title title title title title title title title title title title title title title title title title title title title title title title ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
});

describe("post validation", function () {
	it("should success", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: ' snow man ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(0);
			next(err);
		});
	});
	it("should fail with empty userName", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: ' ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
	it("should fail with big userName", function (next) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: '123456789012345678901234567890123' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			next(err);
		});
	});
});

describe("insert-thread", function () {
	before(function (next) {
		_request.post({ url: urlBase + '/api/auth/logout' }, next);
	});
	it("should fail when not logged in", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 101, userName: 'snowman', title: 'title 1', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('should success to login as user', function (next) {
		_request.post({ url: urlBase + '/api/auth/login', body: { password: '1' } }, next);
	});
	it("should success", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 101, userName: 'snowman', title: 'title 1', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(200);
			body.should.have.property('threadId');
			next(err);
		});
	});
	it("should fail with invalid categoryId", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 10100, userName: 'snowman', title: 'title 1', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(200);
			body.should.have.property('threadId');
			next(err);
		});
	});

});

xdescribe("thread", function () {
	var samples = [
		{ categoryId: 101, userName: 'snowman', title: 'title 1', text: 'text 1' },
		{ categoryId: 101, userName: 'snowman', title: 'title 2', text: 'text 2' },
		{ categoryId: 101, userName: 'snowman', title: 'title 3', text: 'text 3' },
		{ categoryId: 101, userName: 'snowman', title: 'title 4', text: 'text 4' },
		{ categoryId: 103, userName: 'snowman', title: 'title 5', text: 'text 5' },
		{ categoryId: 103, userName: 'snowman', title: 'title 6', text: 'text 6' },
		{ categoryId: 104, userName: 'snowman', title: 'title 7', text: 'text 7' }
	];

	before(function (next) {
		loginAsUser(next);
	});
	it('can add new thread', function (next) {
		_async.forEachSeries(samples, function (item, next) {
			_request.post({
				url: urlBase + '/api/thread'
				, body: item
			}, function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		}, next);
	});

//	it("should return list", function (next) {
//		_request.get({url: urlBase + '/api/thread'}, function (err, res, body) {
//			res.should.status(200);
//			next(err);
//		});
//	});
});