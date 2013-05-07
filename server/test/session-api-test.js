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

	var app = express.app;

	app.put('/test/session', function (req, res) {
		for (var key in req.body) {
			req.session[key] = req.body[key];
		}
		res.json('ok');
	});

	app.get('/test/session', function (req, res) {
		var obj = {};
		for (var i = 0; i < req.body.length; i++) {
			var key = req.body[i];
			obj[key] = req.session[key];
		}
		res.json(obj);
	});

	app.get('/test/user/any', function (req, res) {
		req.findUser(function (err) {
			if (err) return res.jsonErr(err);
			res.jsonEmpty();
		})
	});

	app.get('/test/user/user', function (req, res) {
		req.findUser('user', function (err) {
			if (err) return res.jsonErr(err);
			res.jsonEmpty();
		});
	});

	app.get('/test/user/admin', function (req, res) {
		req.findUser('admin', function (err) {
			if (err) return res.jsonErr(err);
			res.jsonEmpty();
		});
	});

	express.listen();
});

describe("session", function () {
	it("can save value", function (next) {
		express.put('/test/session').send({ book: 'book217', price: 112 }).end(function (err, res) {
			should(!res.error);
			res.body.should.equal('ok');
			next();
		});
	});
	it("can get value", function (next) {
		express.get('/test/session').send([ 'book', 'price' ]).end(function (err, res) {
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
		express.get('/test/session').send([ 'book', 'price' ]).end(function (err, res) {
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
		express.get('/api/sessions', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		express.get('/api/sessions', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.user.name.should.equal('user');
			should.exist(res.body.user.categoriesForMenu);
			next();
		});
	});
});

describe("accessing /test/user/any", function () {
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/user/any', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		express.get('/test/user/any', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/user/any', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
});

describe("accessing /test/user/user", function () {
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/user/user', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		express.get('/test/user/user', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
});

describe("accessing /test/user/admin", function () {
	it("given no session", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/user/admin', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should fail", function (next) {
		express.get('/test/user/admin', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHORIZED);
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should success", function (next) {
		express.get('/test/user/admin', function (err, res) {
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
		express.get('/api/sessions', function (err, res) {
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
		express.get('/api/sessions', function (err, res) {
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
