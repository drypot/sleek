var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,express', next);
});

describe("get-category", function () {
	describe("for user", function () {
		var c;
		it('assume user', function (next) {
			test.request('/api/login', {password: '1'}, next);
		});
		it('can get category', function (next) {
			test.request('/api/get-category', function (err, res, body) {
				res.should.status(200);
				c = body;
				c.should.ok;
				next(err);
			});
		});
		it('has categroy 100', function () {
			var cx = c[100];
			cx.should.ok;
			cx.should.property('name');
			cx.should.property('readable');
			cx.should.property('writable');
		});
		it('has not category 40', function () {
			var cx = c[40];
			should(!cx);
		});
	});
	describe("for admin", function () {
		var c;
		it('assume admin', function (next) {
			test.request('/api/login', {password: '3'}, next);
		});
		it('can get category', function (next) {
			test.request('/api/get-category', function (err, res, body) {
				res.should.status(200);
				c = body;
				c.should.ok;
				next(err);
			});
		});
		it('has category 100', function () {
			var cx = c[100];
			cx.should.ok;
			cx.should.property('name');
			cx.should.property('readable');
			cx.should.property('writable');
		});
		it('has category 40', function () {
			var cx = c[40];
			should(cx);
		});
	});
});
