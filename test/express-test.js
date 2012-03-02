var _ = require('underscore');
var _should = require('should');
var _request = require('request').defaults({json: true});
var _async = require('async');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _express = require("../main/express");

_config.initParam = { configPath: "config-dev/config-dev.xml" }
_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };

before(function (done) {
	_lang.runInit(done);
});

var urlBase;

before(function () {
	urlBase = "http://localhost:" + _config.appServerPort;
});

function loginAsUser(callback) {
	_request.post({
		url: urlBase + '/api/auth/login',
		body: {password: '1'}
	}, callback);
}

function loginAsAdmin(callback) {
	_request.post({
		url: urlBase + '/api/auth/login',
		body: {password: '3'}
	}, callback);
}

describe('hello', function () {
	it('should return "hello"', function (done) {
		_request.get({
			url: urlBase + '/api/hello'
		}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('hello');
			done(err);
		});
	});
});

describe('ping', function () {
	it('should ok', function (done) {
		_request.post({
			url: urlBase + '/api/ping'
		}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			done(err);
		});
	});
});

describe('session', function () {
	it('can save value', function (done) {
		_request.post({
			url: urlBase + '/api/test/session-set', body: { value: 'book217'}
		}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			done(err);
		});
	});
	it('can read value', function (done) {
		_request.get({
			url: urlBase + '/api/test/session-get'
		}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('book217');
			done(err);
		});
	});
});

describe('auth', function () {
	it('should fail before login', function (done) {
		_request.get({
			url: urlBase + '/api/test/assert-role-user'
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal('login first');
			done(err);
		});
	});
	it('should fail with wrong password', function (done) {
		_request.post({
			url: urlBase + '/api/auth/login',
			body: {password: 'xxx'}
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal('login failed');
			done(err);
		});
	});
	it('should success to login as user', function (done) {
		loginAsUser(function (err, res, body) {
			res.should.status(200);
			body.role.name.should.equal('user');
			done(err);
		});
	});
	it('should success after login', function (done) {
		_request.get({
			url: urlBase + '/api/test/assert-role-user'
		}, function (err, res, body) {
			_should.equal(undefined, body.error);
			res.should.status(200);
			body.should.equal('ok');
			done(err);
		});
	});
	it('should fail as user', function (done) {
		_request.get({
			url: urlBase + '/api/test/assert-role-admin'
		}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal('not authorized');
			done(err);
		});
	});
	it('should success to login as admin', function (done) {
		loginAsAdmin(function (err, res, body) {
			res.should.status(200);
			body.role.name.should.equal('admin');
			done(err);
		});
	});
	it('should success as admin', function (done) {
		_request.get({
			url: urlBase + '/api/test/assert-role-admin'
		}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			done(err);
		});
	});
});

describe("category", function () {
	describe("user category", function () {
		var cl;
		before(function (done) {
			loginAsUser(done);
		});
		before(function (done) {
			_request.get({
				url: urlBase + '/api/category'
			}, function (err, res, body) {
				res.should.status(200);
				cl = body;
				done(err);
			});
		});
		it("should ok", function () {
			cl.should.ok;
		});
		it('should have category 100', function () {
			var c = cl[100];
			c.should.ok;
			c.should.property('name');
			c.should.property('readable');
			c.should.property('writable');
		});
		it('should not have category 40', function () {
			var c = cl[40];
			_should.equal(c, undefined);
		});
	});
	describe("admin category", function () {
		var cl;
		before(function (done) {
			loginAsAdmin(done);
		});
		before(function (done) {
			_request.get({
				url: urlBase + '/api/category'
			}, function (err, res, body) {
				res.should.status(200);
				cl = body;
				done(err);
			});
		});
		it("should ok", function () {
			cl.should.ok;
		});
		it('should have category 100', function () {
			var c = cl[100];
			c.should.ok;
			c.should.property('name');
			c.should.property('readable');
			c.should.property('writable');
		});
		it('should have category 40', function () {
			var c = cl[40];
			c.should.ok;
		});
	});
});

describe("parseQuery", function () {
	it("can parse params", function (done) {
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
			done(err);
		});
	});
	it("can supply defaults", function (done) {
		_request.get({
			url: urlBase + '/api/test/parse-query'
		}, function (err, res, body) {
			res.should.status(200);
			body.categoryId.should.equal(0);
			body.threadId.should.equal(0);
			body.postId.should.equal(0);
			done(err);
		});
	});
});

describe("parsePostForm", function () {
	it("it can parse form", function (done) {
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
			done(err);
		});
	});
});

describe("thread validation", function () {
	it("should success", function (done) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: ' cool thread ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(0);
			done(err);
		});
	});
	it("should fail with empty title", function (done) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: '  ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			done(err);
		});
	});
	it("should fail with big title", function (done) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-thread',
			body: { title: ' big title title title title title title title title title title title title title title title title title title title title title title title title title title title title ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			done(err);
		});
	});
});

describe("post validation", function () {
	it("should success", function (done) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: ' snow man ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(0);
			done(err);
		});
	});
	it("should fail with empty userName", function (done) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: ' ' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			done(err);
		});
	});
	it("should fail with big userName", function (done) {
		_request.post({
			url: urlBase + '/api/test/validate-post-form-post',
			body: { userName: '123456789012345678901234567890123' }
		}, function (err, res, body) {
			res.should.status(200);
			body.errors.should.ok;
			body.errors.should.length(1);
			done(err);
		});
	});
});

