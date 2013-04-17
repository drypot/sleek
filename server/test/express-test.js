var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var express = require('../main/express');

require('../main/hello-api');

before(function (next) {
	init.run(next);
});

before(function(next) {
	var app = express.app;

	app.get('/test', function (req, res) {
		res.send('test home');
	});

	app.get('/test/no-action', function (req, res, next) {
		next();
	});

	app.get('/api/send-rc-33', function (req, res) {
		res.json({ rc: 33 });
	});

	express.listen();

	url = 'http://localhost:' + config.data.port;

	next();
});

var url;

describe("/hello", function () {
	it("should return 'hello'", function (next) {
		request.get(url + '/api/hello', function (err, res) {
			res.should.status(200);
			res.should.be.json;
			res.body.should.equal('hello');
			next();
		});
	});
});

describe("/test", function () {
	it("should return 'test home'", function (next) {
		request.get(url + '/test', function (err, res) {
			res.should.status(200);
			res.type.should.equal
			res.text.should.equal('test home');
			next();
		});
	});
});

describe("/test/no-action", function () {
	it("should return not found", function (next) {
		request.get(url + '/no-action', function (err, res) {
			res.should.status(404);
			next();
		});
	});
});

describe("/api/send-rc-33", function () {
	it("should return rc", function (next) {
		request.get(url + '/api/send-rc-33').end(function (err, res) {
			res.should.status(200);
			res.should.be.json;
			res.body.rc.should.equal(33);
			next();
		});
	});
});

