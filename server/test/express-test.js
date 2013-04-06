var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var config = require('../main/config')({ test: true });
var role = require('../main/role')({ config: config });
var url = 'http://localhost:' + config.port;

var app = express();

require('../main/express')({ config: config, role: role, app: app });
require('../main/hello-api')({ app: app });

app.get('/no-action', function (req, res, next) {
	next();
});

app.get('/plain-text-end', function (req, res) {
	var body = 'end text';
	res.setHeader('Content-Type', 'text/plain');
	//res.setHeader('Content-Length', body.length);
	res.end(body);
});

app.get('/plain-text-send', function (req, res) {
	res.send('send text');
});

app.listen(config.port);

describe('hello', function () {
	it('should return hello', function (next) {
		request.get(url + '/api/hello', function (err, res) {
			res.should.status(200);
			res.text.should.equal('hello');
			next();
		});
	});
});

describe('no-action', function () {
	it('should return not found', function (next) {
		request.get(url + '/no-action', function (err, res) {
			res.should.status(404);
			next();
		});
	});
});

describe('plain-text-end', function () {
	it('should success', function (next) {
		request.get(url + '/plain-text-end', function (err, res) {
			res.should.status(200);
			res.text.should.equal('end text');
			next();
		});
	});
});

describe('plain-text-send', function () {
	it('should success', function (next) {
		request.get(url + '/plain-text-send', function (err, res) {
			res.should.status(200);
			res.text.should.equal('send text');
			next();
		});
	});
});

