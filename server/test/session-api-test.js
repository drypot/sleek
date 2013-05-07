var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var express = require('../main/express');
var error = require('../main/error');
var ufix = require('../test/user-fixture');

require('../main/session-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

describe("session", function () {
	it("can save value", function (next) {
		request.put(test.url + '/api/test/session').send({ book: 'book217', price: 112 }).end(function (err, res) {
			should(!res.error);
			res.body.should.equal('ok');
			next();
		});
	});
	it("can get value", function (next) {
		request.get(test.url + '/api/test/session').send([ 'book', 'price' ]).end(function (err, res) {
			should(!res.error);
			res.body.should.have.property('book', 'book217');
			res.body.should.have.property('price', 112);
			next();
		});
	});
	it("can terminate", function (next) {
		ufix.logout(next);
	});
	it("should return nothing after terminated", function (next) {
		request.get(test.url + '/api/test/session').send([ 'book', 'price' ]).end(function (err, res) {
			should(!res.error);
			res.body.should.not.have.property('book');
			res.body.should.not.have.property('price');
			next();
		});
	});
});

describe("session making", function () {
	it("should success for user", function (next) {
		ufix.loginUser(next);
	});
	it("should success for admin", function (next) {
		ufix.loginAdmin(next);
	});
	it("should fail with wrong password", function (next) {
		express.post('/api/sessions').send({ password: 'xxx' }).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.INVALID_PASSWORD);
			next();
		});
	});
});

describe("session info", function () {
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should return error", function (next) {
		request.get(test.url + '/api/sessions', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		request.get(test.url + '/api/sessions', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.user.name.should.equal('user');
			should.exist(res.body.user.categoriesForMenu);
			next();
		});
	});
});

describe("accessing /api/test/user/any", function () {
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/test/user/any', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		request.get(test.url + '/api/test/user/any', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/test/user/any', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
});

describe("accessing /api/test/user/user", function () {
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/test/user/user', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		request.get(test.url + '/api/test/user/user', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
});

describe("accessing /api/test/user/admin", function () {
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/test/user/admin', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should fail", function (next) {
		request.get(test.url + '/api/test/user/admin', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHORIZED);
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should success", function (next) {
		request.get(test.url + '/api/test/user/admin', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
});

describe("user.categoriesForMenu", function () {
	var categories;
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("given categoriesForMenu", function (next) {
		request.get(test.url + '/api/sessions', function (err, res) {
			categories = res.body.user.categoriesForMenu;
			next();
		});
	});
	function find(id) {
		for (var i = 0; i < categories.length; i++) {
			var c = categories[i];
			if (c.id == id) return c;
		}
		return null;
	}
	it("should have categroy 100", function () {
		var cx = find(100);
		should.exist(cx);
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it("should not have category 40", function () {
		var cx = find(40);
		should.not.exist(cx);
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("given categoriesForMenu", function (next) {
		request.get(test.url + '/api/sessions', function (err, res) {
			categories = res.body.user.categoriesForMenu;
			next();
		});
	});
	it("should have category 100", function () {
		var cx = find(100);
		should.exist(cx);
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it("should have category 40", function () {
		var cx = find(40);
		should.exist(cx);
	});
});
