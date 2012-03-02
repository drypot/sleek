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

	before(function (done) {
		loginAsUser(done);
	});
	it('can add new thread', function (done) {
		_async.forEachSeries(samples, function (item, done) {
			_request.post({
				url: urlBase + '/api/thread'
				, body: item
			}, function (err, res, body) {
				res.should.status(200);
				done(err);
			});
		}, done);
	});

//	it("should return list", function (done) {
//		_request.get({url: urlBase + '/api/thread'}, function (err, res, body) {
//			res.should.status(200);
//			done(err);
//		});
//	});
});