var should = require('should');
var request = require('superagent').agent();
var express = require('express');

var rcs = require('../main/rcs');

var config = require('../main/config')({ test: true });
var auth = require('../main/auth')({ config: config });

var app = express();

require('../main/express')({ config: config, auth: auth, app: app });
require('../main/session-api')({ config: config, auth: auth, app: app });

app.listen(config.port);

var url = 'http://localhost:' + config.port;

var USER_PASS = '1';
var ADMIN_PASS = '3';

describe('session', function () {
	it('can save value', function (next) {
		request.put(url + '/api/test/session').send({ book: 'book217', price: 112 }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('ok');
			next();
		});
	});
	it('can get value', function (next) {
		request.get(url + '/api/test/session').send([ 'book', 'price' ]).end(function (err, res) {
			res.status.should.equal(200);
			res.body.should.have.property('book', 'book217');
			res.body.should.have.property('price', 112);
			next();
		});
	});
	it('can terminate', function (next) {
		request.del(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('should return nothing after terminated', function (next) {
		request.get(url + '/api/test/session').send([ 'book', 'price' ]).end(function (err, res) {
			res.status.should.equal(200);
			res.body.should.not.have.property('book');
			res.body.should.not.have.property('price');
			next();
		});
	});
});

describe('session making', function () {
	it('should success for user', function (next) {
		request.post(url + '/api/session').send({ password: USER_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			next();
		});
	});
	it('should success for admin', function (next) {
		request.post(url + '/api/session').send({ password: ADMIN_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('admin');
			next();
		});
	});
	it('should fail with wrong password', function (next) {
		request.post(url + '/api/session').send({ password: 'xxx' }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.INVALID_PASSWORD);
			next();
		});
	});
});

describe('session info', function () {
	it('given no session', function (next) {
		request.del(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('should return error', function (next) {
		request.get(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		request.post(url + '/api/session').send({ password: USER_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			next();
		});
	});
	it('should success', function (next) {
		request.get(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			should.exist(res.body.role.categoriesForMenu);
			next();
		});
	});
});

describe('accessing /api/test/auth/any', function () {
	it('given no session', function (next) {
		request.del(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('should fail', function (next) {
		request.get(url + '/api/test/auth/any', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		request.post(url + '/api/session').send({ password: USER_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			next();
		});
	});
	it('should success', function (next) {
		request.get(url + '/api/test/auth/any', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('given no session', function (next) {
		request.del(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('should fail', function (next) {
		request.get(url + '/api/test/auth/any', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
});

describe('accessing /api/test/auth/user', function () {
	it('given no session', function (next) {
		request.del(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('should fail', function (next) {
		request.get(url + '/api/test/auth/user', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		request.post(url + '/api/session').send({ password: USER_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			next();
		});
	});
	it('should success', function (next) {
		request.get(url + '/api/test/auth/user', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});

describe('accessing /api/test/auth/admin', function () {
	it('given no session', function (next) {
		request.del(url + '/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
	it('should fail', function (next) {
		request.get(url + '/api/test/auth/admin', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHENTICATED);
			next();
		});
	});
	it('given user session', function (next) {
		request.post(url + '/api/session').send({ password: USER_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			next();
		});
	});
	it('should fail', function (next) {
		request.get(url + '/api/test/auth/admin', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.NOT_AUTHORIZED);
			next();
		});
	});
	it('given admin session', function (next) {
		request.post(url + '/api/session').send({ password: ADMIN_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('admin');
			next();
		});
	});
	it('should success', function (next) {
		request.get(url + '/api/test/auth/admin', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	});
});

describe('role.categoriesForMenu', function () {
	var categories;
	it('given user session', function (next) {
		request.post(url + '/api/session').send({ password: USER_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			next();
		});
	});
	it('given categoriesForMenu', function (next) {
		request.get(url + '/api/session', function (err, res) {
			categories = res.body.role.categoriesForMenu;
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
	it('should have categroy 100', function () {
		var cx = find(100);
		should.exist(cx);
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it('should not have category 40', function () {
		var cx = find(40);
		should.not.exist(cx);
	});
	it('given admin session', function (next) {
		request.post(url + '/api/session').send({ password: ADMIN_PASS }).end(function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('admin');
			next();
		});
	});
	it('given categoriesForMenu', function (next) {
		request.get(url + '/api/session', function (err, res) {
			categories = res.body.role.categoriesForMenu;
			next();
		});
	});
	it('should have category 100', function () {
		var cx = find(100);
		should.exist(cx);
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it('should have category 40', function () {
		var cx = find(40);
		should.exist(cx);
	});
});
