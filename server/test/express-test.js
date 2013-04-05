var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var url;

before(function (next) {
	require('../main/config')({ test: true }, function (_config) {
		require('../main/role')({ config: _config }, function (_role) {
			var app = express();
			require('../main/express')({ config: _config, role: _role, app: app });
			require('../main/hello-api')({ app: app });
			url = 'http://localhost:' + _config.port;
			app.listen(_config.port);
			next();
		});
	});
});

describe('hello', function () {
	it('should return hello', function (next) {
		request.get(url + '/api/hello', function (err, res) {
			res.should.status(200);
			res.text.should.equal('hello');
			next();
		});
	});
});
