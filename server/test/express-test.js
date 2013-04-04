var should = require('should');
var request = require('superagent').agent();

var config = require('../main/config');
var role = require('../main/role');
var express = require('../main/express');
var hello = require('../main/hello-api');

before(function (next) {
	config.init({ test: true }, next);
});

before(function (next) {
	role.init(next);
});

before(function (next) {
	express.init(next);
});

before(function (next) {
	hello.init(next);
});

var url;

before(function () {
	url = 'http://localhost:' + config.port;
	express.app.listen(config.port);
});

describe('hello', function () {
	it('should return hello', function (next) {
		request.get(url + '/api/hello', function (err, res) {
			res.should.status(200);
			res.body.should.equal('hello');
			next();
		});
	});
});
