var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var express = require('../main/express');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');

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

	app.get('/test/any', function (req, res) {
		req.findUser(function (err) {
			if (err) return res.jsonErr(err);
			res.json({});
		})
	});

	app.get('/test/user', function (req, res) {
		req.findUser('user', function (err) {
			if (err) return res.jsonErr(err);
			res.json({});
		});
	});

	app.get('/test/admin', function (req, res) {
		req.findUser('admin', function (err) {
			if (err) return res.jsonErr(err);
			res.json({});
		});
	});

	app.del('/test/del-session', function (req, res) {
		req.session.destroy();
		res.json({});
	});

	express.listen();
});

describe("getting session var", function () {
	it("given session var", function (next) {
		express.put('/test/session').send({ book: 'book217', price: 112 }).end(function (err, res) {
			should(!res.error);
			res.body.should.equal('ok');
			next();
		});
	});
	it("should success", function (next) {
		express.get('/test/session').send([ 'book', 'price' ]).end(function (err, res) {
			should(!res.error);
			res.body.should.have.property('book', 'book217');
			res.body.should.have.property('price', 112);
			next();
		});
	});
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/session').send([ 'book', 'price' ]).end(function (err, res) {
			should(!res.error);
			res.body.should.not.have.property('book');
			res.body.should.not.have.property('price');
			next();
		});
	});
});

describe("making session", function () {
	it("should success for user", function (next) {
		ufix.loginUser(next);
	});
	it("should success for admin", function (next) {
		ufix.loginAdmin(next);
	});
	it("should fail with wrong password", function (next) {
		express.post('/api/sessions').send({ password: 'xxx' }).end(function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.ERROR_SET);
			res.body.err.errors[0].name.should.equal('password');
			res.body.err.errors[0].msg.should.equal(error.msg.USER_NOT_FOUND);
			next();
		});
	});
});

describe("getting session info", function () {
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
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
			should.exist(res.body.user.categoriesOrdered);
			next();
		});
	});
});

describe("accessing /test/any", function () {
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/any', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		express.get('/test/any', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/any', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
});

describe("accessing /test/user", function () {
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/user', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		express.get('/test/user', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
});

describe("accessing /test/admin", function () {
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/admin', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
			next();
		});
	});
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should fail", function (next) {
		express.get('/test/admin', function (err, res) {
			should(!res.error);
			res.body.err.rc.should.equal(error.NOT_AUTHORIZED);
			next();
		});
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("should success", function (next) {
		express.get('/test/admin', function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
});

describe("accessing /test/user with auto login", function () {
	it("given new test session", function (next) {
		express.newTestSession();
		next();
	});
	it("should fail", function (next) {
		express.get('/test/user').end(function (err, res) {
			should(res.body.err);
			next();
		});
	});
	it("given user session", function (next) {
		express.post('/api/sessions').send({ password: '1' }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			res.body.user.name.should.equal('user');
			next();
		});
	});
	it("should success", function (next) {
		express.get('/test/user').end(function (err, res) {
			should(!res.body.err);
			next();
		})
	});
	it("given new test sesssion", function (next) {
		express.newTestSession();
		next();
	});
	it("should fail", function (next) {
		express.get('/test/user').end(function (err, res) {
			should(res.body.err);
			next();
		})
	});
	it("given user session with auto login", function (next) {
		express.post('/api/sessions').send({ password: '1', remember: true }).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			res.body.user.name.should.equal('user');
			next();
		});
	});
	it("should success", function (next) {
		express.get('/test/user').end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("given new session", function (next) {
		express.del('/test/del-session').end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
	it("should success", function (next) {
		express.get('/test/user').end(function (err, res) {
			should(!res.body.err);
			next();
		})
	});
	it("given logged out", function (next) {
		ufix.logout(next);
	});
	it("should fail", function (next) {
		express.get('/test/user').end(function (err, res) {
			should(res.body.err);
			next();
		})
	});
});

describe("user.categoriesOrdered", function () {
	var categories;
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("given categoriesOrdered", function (next) {
		express.get('/api/sessions', function (err, res) {
			categories = res.body.user.categoriesOrdered;
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
	});
	it("should not have category 40", function () {
		var cx = find(40);
		should.not.exist(cx);
	});
	it("given admin session", function (next) {
		ufix.loginAdmin(next);
	});
	it("given categoriesOrdered", function (next) {
		express.get('/api/sessions', function (err, res) {
			categories = res.body.user.categoriesOrdered;
			next();
		});
	});
	it("should have category 100", function () {
		var cx = find(100);
		should.exist(cx);
		cx.should.property('name');
	});
	it("should have category 40", function () {
		var cx = find(40);
		should.exist(cx);
	});
});
