var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var config = require('../main/config')({ test: true });
var role = require('../main/role')({ config: config });
var url = 'http://localhost:' + config.port;

var app = express();
require('../main/express')({ config: config, role: role, app: app });
require('../main/hello-api')({ app: app });
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
