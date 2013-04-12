var should = require('should');

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var auth = require('../main/auth');

before(function (next) {
	init.run(next);
});

describe('roleByName()', function () {
	it('can find role by name', function () {
		auth.roleByName('user').name.should.equal('user');
		auth.roleByName('cheater').name.should.equal('cheater');
		auth.roleByName('admin').name.should.equal('admin');
		should.not.exist(auth.roleByName('xxx'));
	});
});

describe('roleByPassword()', function () {
	it('can find auth by password', function () {
		auth.roleByPassword('1').name.should.equal('user');
		auth.roleByPassword('2').name.should.equal('cheater');
		auth.roleByPassword('3').name.should.equal('admin');
		should.not.exist(auth.roleByPassword('x'));
	})
});

describe('user role', function () {
	var role;
	before(function () {
		role = auth.roleByName('user');
	});
	it('should have all category', function () {
		var c = role.categories[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = role.categories[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('should not have cheat', function () {
		var c = role.categories[60];
		should(!c);
	});
});

describe('admin role', function () {
	var role;
	before(function () {
		role = auth.roleByName('admin');
	});
	it('should have all category', function () {
		var c = role.categories[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = role.categories[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('should have cheat', function () {
		var c = role.categories[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});
