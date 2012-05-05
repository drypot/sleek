var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var msg = require('../main/msg.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,express', next);
});

describe('hello', function () {
	it('should return hello', function (next) {
		test.request.get('/api/hello', function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('hello');
			next(err);
		});
	});
});

describe('session', function () {
	it('can save session value', function (next) {
		test.request.put('/api/test/session-var', {value: 'book217' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('ok');
			next(err);
		});
	});
	it('can get session value', function (next) {
		test.request.get('/api/test/session-var', function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('book217');
			next(err);
		});
	});
});

describe('logout', function () {
	it("should success", function (next) {
		test.request.post('/api/logout', function (err, res) {
			res.status.should.equal(200);
			next(err);
		});
	});
});

describe('login', function () {
	it('should success for user', function (next) {
		test.request.post('/api/login', { password: '1' }, function (err, res) {
			res.status.should.equal(200);
			res.body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should success for admin', function (next) {
		test.request.post('/api/login', { password: '3' }, function (err, res) {
			res.status.should.equal(200);
			res.body.role.name.should.equal('admin');
			next(err);
		});
	});
	it('should fail with wrong password', function (next) {
		test.request.post('/api/login', { password: 'xxx' }, function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FAILED);
			next(err);
		});
	});
});

describe('login category option', function () {
	it('should not return category', function (next) {
		test.request.post('/api/login', { password: '1' }, function (err, res) {
			res.status.should.equal(200);
			should.equal(undefined, res.body.role.category);
			next(err);
		});
	});
	it('should return category', function (next) {
		test.request.post('/api/login', { password: '1', returnCategory: true }, function (err, res) {
			res.status.should.equal(200);
			res.body.role.category.should.ok;
			next(err);
		});
	});
});

describe('login useCurrentSession option', function () {
	before(function (next) {
		test.request.post('/api/logout', function (err, res) {
			res.status.should.equal(200);
			next(err);
		});
	});
	it('should login as user', function (next) {
		test.request.post('/api/login', { password: '1' }, function (err, res) {
			res.status.should.equal(200);
			res.body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should login as admin', function (next) {
		test.request.post('/api/login', { password: '3' }, function (err, res) {
			res.status.should.equal(200);
			res.body.role.name.should.equal('admin');
			next(err);
		});
	});
	it('should login as admin with keepSession', function (next) {
		test.request.post('/api/login', { password: '1', keepCurrentSession: true }, function (err, res) {
			res.status.should.equal(200);
			res.body.role.name.should.equal('admin');
			next(err);
		});
	});
});

describe("test/role/any", function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	})
	it('should fail before login', function (next) {
		test.request.get('/api/test/role/any', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume logged in as user', function (next) {
		test.request.post('/api/login', { password: '1' }, function (err, res) {
			res.status.should.equal(200);
			res.body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should success after login', function (next) {
		test.request.get('/api/test/role/any', function (err, res) {
			res.status.should.equal(200);
			next(err);
		});
	});
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it('should fail after logout', function (next) {
		test.request.get('/api/test/role/any', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
});

describe("test/role/user", function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it('should fail before login', function (next) {
		test.request.get('/api/test/role/user', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume logged in as user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('should success after login', function (next) {
		test.request.get('/api/test/role/user', function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('ok');
			next(err);
		});
	});
});

describe("test/role/admin", function () {
	it('assume logged out', function (next) {
		test.request.post('/api/logout', next);
	});
	it('should fail before login', function (next) {
		test.request.get('/api/test/role/admin', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume logged in as user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	it('should fail as user', function (next) {
		test.request.get('/api/test/role/admin', function (err, res) {
			res.status.should.equal(400);
			res.body.error.should.equal(msg.ERR_NOT_AUTHORIZED);
			next(err);
		});
	});
	it('assume logged in as admin', function (next) {
		test.request.post('/api/login', { password: '3' }, next);
	});
	it('should success as admin', function (next) {
		test.request.get('/api/test/role/admin', function (err, res) {
			res.status.should.equal(200);
			next(err);
		});
	});
});

describe("category for user", function () {
	var c;
	before(function (next) {
		test.request.post('/api/login', { password: '1', returnCategory: true }, function (err, res) {
			c = res.body.role.category;
			next(err);
		});
	});
	it('has categroy 100', function () {
		var cx = _.find(c, function (c) { return c.id == 100; });
		cx.should.ok;
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it('has not category 40', function () {
		var cx = _.find(c, function (c) { return c.id == 40; });
		should(!cx);
	});
});

describe("category for admin", function () {
	var c;
	before(function (next) {
		test.request.post('/api/login', { password: '3', returnCategory: true }, function (err, res) {
			c = res.body.role.category;
			next(err);
		});
	});
	it('has category 100', function () {
		var cx = _.find(c, function (c) { return c.id == 100; });
		cx.should.ok;
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it('has category 40', function () {
		var cx = _.find(c, function (c) { return c.id == 40; });
		should(cx);
	});
});
