var _ = require('underscore');
var should = require('should');
var request = require('request').defaults({json: true});
var async = require('async');

var l = require('../main/l');
var config = require("../main/config");
var mongo = require('../main/mongo');
var express = require("../main/express");

var ERR_LOGIN_FIRST = 'login first';
var ERR_LOGIN_FAILED = 'login failed';
var ERR_NOT_AUTHORIZED = 'not authorized';
var ERR_INVALID_DATA = 'invalid data';
var ERR_INVALID_CATEGORY = 'invalid category';

var urlBase;

before(function (next) {
	l.addBeforeInit(function (next) {
		config.param = { configPath: "config-dev/config-dev.xml" }
		mongo.param = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	l.addAfterInit(function (next) {
		urlBase = "http://localhost:" + config.appServerPort;
		next();
	});
	l.runInit(next);
});

function post(url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = {};
	}
	request.post({ url: urlBase + url, body: body, json: true }, next);
}

var prevThreadId;
var prevPostId;
var prevReplyId;

describe("create-head", function () {
	it('assume logged out', function (next) {
		post('/api/logout', next);
	});
	it("should fail when not logged in", function (next) {
		post('/api/create-head', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		post('/api/login', {password: '1'}, next);
	});
	it('should success as user', function (next) {
		post('/api/create-head',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(200);
				body.should.have.property('threadId');
				body.should.have.property('postId');
				prevThreadId = body.threadId;
				prevPostId = body.postId;
				next(err);
			}
		);
	});
	it("should fail with invalid categoryId", function (next) {
		post('/api/create-head',
			{ categoryId: 10100, userName : 'snowman', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	it("should fail with invalid title", function (next) {
		post('/api/create-head',
			{ categoryId: 101, userName : 'snowman', title: ' ', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_INVALID_DATA);
				body.field[0].should.property('title');
				next(err);
			}
		);
	});
	it("should fail with invalid userName", function (next) {
		post('/api/create-head',
			{ categoryId: 101, userName : ' ', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_INVALID_DATA);
				body.field[0].should.property('userName');
				next(err);
			}
		);
	});
});

xdescribe("create-reply", function () {
	it('assume logged out', function (next) {
		post('/api/logout', next);
	});
	it("should fail when not logged in", function (next) {
		post('/api/create-reply', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume user', function (next) {
		post('/api/login', {password: '1'}, next);
	});
	it('should success as user', function (next) {
		post('/api/create-reply',
			{ threadId: prevThreadId, userName : 'snowman', title: 'title r1', text: 'text r1' },
			function (err, res, body) {
				res.should.status(200);
				body.should.have.property('postId');
				prevReplyId = body.postId;
				next(err);
			}
		);
	});
	it("should fail with invalid threadId", function (next) {
		post('/api/create-reply',
			{ threadId: 99999, userName : 'snowman', title: 'title r2', text: 'text r2' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_INVALID_CATEGORY);
				next(err);
			}
		);
	});
	xit("can not create with invalid title", function (next) {
		post('/api/create-reply',
			{ categoryId: 101, userName : 'snowman', title: ' ', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_INVALID_DATA);
				body.field[0].should.property('title');
				next(err);
			}
		);
	});
	xit("can not create with invalid userName", function (next) {
		post('/api/create-reply',
			{ categoryId: 101, userName : ' ', title: 'title 1', text: 'text 1' },
			function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_INVALID_DATA);
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