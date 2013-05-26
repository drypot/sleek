var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var express = require('../main/express');
var error = require('../main/error');

require('../main/hello-api');

before(function (next) {
	init.run(next);
});

before(function(next) {
	express.listen();
	next();
});

describe("/api/hello", function () {
	it("should return 'hello'", function (next) {
		express.get('/api/hello', function (err, res) {
			should(!err);
			should(!res.error);
			res.should.be.json;
			res.body.should.equal('hello');
			next();
		});
	});
});

describe("/api/time", function () {
	it("should return server time in milliseconds", function (next) {
		express.get('/api/time', function (err, res) {
			should(!err);
			should(!res.error);
			res.should.be.json;
			var time = parseInt(res.body || 0);
			var now = Date.now();
			should(time <= now);
			should(time >= now - 100);
			next();
		});
	});
});