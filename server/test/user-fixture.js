var should = require('should');

var init = require('../main/init');
var config = require('../main/config');
var error = require('../main/error');
var express = require('../main/express');

init.add(function () {

	exports.logout = function (next) {
		express.del('/api/sessions', function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			next();
		});
	}

	exports.loginUser = function (next) {
		express.post('/api/sessions').send({ password: '1' }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			res.body.user.name.should.equal('user');
			next();
		});
	}

	exports.loginAdmin = function (next) {
		express.post('/api/sessions').send({ password: '3' }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			res.body.user.name.should.equal('admin');
			next();
		});
	}

});
