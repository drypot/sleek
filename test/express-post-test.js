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

function post(url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = null;
	}
	_request.post({ url: urlBase + url, body: body }, next);
}

describe("parseParams", function () {
	it("can parse params", function (next) {
		post('/api/test/parse-params', {categoryId: 10, threadId: 20, postId: 30}, function (err, res, body) {
			res.should.status(200);
			body.categoryId.should.equal(10);
			body.threadId.should.equal(20);
			body.postId.should.equal(30);
			next(err);
		});
	});
	it("can supply defaults", function (next) {
		post('/api/test/parse-params', function (err, res, body) {
			res.should.status(200);
			body.categoryId.should.equal(0);
			body.threadId.should.equal(0);
			body.postId.should.equal(0);
			next(err);
		});
	});
});



xdescribe("insert-thread", function () {
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
			res.should.status(500);
			next(err);
		});
	});
	it("should fail with invalid title", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 101, userName: 'snowman', title: ' ', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_INVALID_DATA);
			next(err);
		});
	});
	it("should fail with invalid userName", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 101, userName: ' ', title: 'title 1', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_INVALID_DATA);
			next(err);
		});
	});
});

xdescribe("insert-reply", function () {
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
	xit('should success to login as user', function (next) {
		_request.post({ url: urlBase + '/api/auth/login', body: { password: '1' } }, next);
	});
	xit("should success", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 101, userName: 'snowman', title: 'title 1', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(200);
			body.should.have.property('threadId');
			next(err);
		});
	});
	xit("should fail with invalid categoryId", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 10100, userName: 'snowman', title: 'title 1', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(500);
			next(err);
		});
	});
	xit("should fail with invalid title", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 101, userName: 'snowman', title: ' ', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_INVALID_DATA);
			next(err);
		});
	});
	xit("should fail with invalid userName", function (next) {
		_request.post({
			url: urlBase + '/api/insert-thread',
			body: { categoryId: 101, userName: ' ', title: 'title 1', text: 'text 1' }
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_INVALID_DATA);
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
//		_request.post({url: urlBase + '/api/thread'}, function (err, res, body) {
//			res.should.status(200);
//			next(err);
//		});
//	});
});