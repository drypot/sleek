var _ = require('underscore');
var should = require('should');
var l = require('../main/l');

require('../main/session-api');
require('../main/test');

before(function (next) {
	l.init.run(next);
});

// exports.baseUrl = 'http://localhost:' + config.port;

describe('raw session', function () {
	it('can save session value', function (next) {
		l.test.request.put('/api/test/session-var', { value: 'book217' }, function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('ok');
			next(err);
		});
	});
	it('can get session value', function (next) {
		l.test.request.get('/api/test/session-var', function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('book217');
			next(err);
		});
	});
});

describe('session terminating', function () {
	it("should success", function (next) {
		l.test.request.del('/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
});

describe('session making', function () {
	it('should success for user', function (next) {
		l.test.request.post('/api/session', { password: '1' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should success for admin', function (next) {
		l.test.request.post('/api/session', { password: '3' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.role.name.should.equal('admin');
			next(err);
		});
	});
	it('should fail with wrong password', function (next) {
		l.test.request.post('/api/session', { password: 'xxx' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.INVALID_PASSWORD);
			next(err);
		});
	});
});

describe('session info retrieving', function () {
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it('should return error', function (next) {
		l.test.request.get('/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should success', function (next) {
		l.test.request.get('/api/session', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.role.name.should.equal('user');
			should.exist(res.body.role.readableCategory);
			next(err);
		});
	});
});

describe("authorized(res, next)", function () {
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	})
	it('should fail', function (next) {
		l.test.request.get('/api/test/role/any', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should success', function (next) {
		l.test.request.get('/api/test/role/any', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it('should fail', function (next) {
		l.test.request.get('/api/test/role/any', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
});

describe("authorized(res, roleName, next)", function () {
	it('given no session', function (next) {
		l.test.request.del('/api/session', next);
	});
	it('when accessing user, should fail', function (next) {
		l.test.request.get('/api/test/role/user', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHENTICATED);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('when accessing user, should success', function (next) {
		l.test.request.get('/api/test/role/user', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	it('when accessing admin, should fail', function (next) {
		l.test.request.get('/api/test/role/admin', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.NOT_AUTHORIZED);
			next(err);
		});
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, next);
	});
	it('when access admin, should success', function (next) {
		l.test.request.get('/api/test/role/admin', function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			next(err);
		});
	});
});

describe("session category", function () {
	var c;
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, function (err, res) {
			l.test.request.get('/api/session', function (err, res) {
				c = res.body.role.readableCategory;
				next(err);
			});
		});
	});
	it('should have categroy 100', function () {
		var cx = _.find(c, function (c) { return c.id == 100; });
		should.exist(cx);
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it('should not have category 40', function () {
		var cx = _.find(c, function (c) { return c.id == 40; });
		should.not.exist(cx);
	});
	it('given admin session', function (next) {
		l.test.request.post('/api/session', { password: '3' }, function (err, res) {
			l.test.request.get('/api/session', function (err, res) {
				c = res.body.role.readableCategory;
				next(err);
			});
		});
	});
	it('should have category 100', function () {
		var cx = _.find(c, function (c) { return c.id == 100; });
		should.exist(cx);
		cx.should.property('name');
		cx.should.property('readable');
		cx.should.property('writable');
	});
	it('should have category 40', function () {
		var cx = _.find(c, function (c) { return c.id == 40; });
		should.exist(cx);
	});
});
