var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var config = require('../main/config')({ test: true });
var auth = require('../main/auth')({ config: config });

var app = express();

require('../main/express')({ config: config, auth: auth, app: app });
require('../main/hello-api')({ app: app });

app.get('/test', function (req, res) {
	res.send('test home');
});

app.get('/test/no-action', function (req, res, next) {
	next();
});

app.get('/api/send-rc-33', function (req, res) {
	res.json({ rc: 33 });
});

app.listen(config.port);

var url = 'http://localhost:' + config.port;

//

describe('/hello', function () {
	it('should return "hello"', function (next) {
		request.get(url + '/api/hello', function (err, res) {
			res.should.status(200);
			res.should.be.json;
			res.body.should.equal('hello');
			next();
		});
	});
});

describe('/test', function () {
	it('should return "test home"', function (next) {
		request.get(url + '/test', function (err, res) {
			res.should.status(200);
			res.type.should.equal
			res.text.should.equal('test home');
			next();
		});
	});
});

describe('/test/no-action', function () {
	it('should return not found', function (next) {
		request.get(url + '/no-action', function (err, res) {
			res.should.status(404);
			next();
		});
	});
});

describe('/api/send-rc-33', function () {
	it('should return rc', function (next) {
		request.get(url + '/api/send-rc-33').end(function (err, res) {
			res.should.status(200);
			res.should.be.json;
			res.body.rc.should.equal(33);
			next();
		});
	});
});

