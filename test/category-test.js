var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var Role = require('../main/role.js');
var Category = require('../main/category.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config', next);
});

describe('Category', function () {
	it('can be created', function () {
		var c = new Category(
			{categoryId: "0", name: "all", sep: "true", newLine: "true" },
			'user'
		);
		c.should.ok;
		c.id.should.equal(0);
		c.name.should.equal('all');
	});
});

describe('category for user', function () {
	var role;
	before(function () {
		role = Role.getByName('user');
	});
	it('has all category', function () {
		var c = role.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.all.should.be.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('has freetalk', function () {
		var c = role.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.all.should.not.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('has cheat', function () {
		var c = role.category[60];
		should(!c);
	});
});

describe('category for admin', function () {
	var role;
	before(function () {
		role = Role.getByName('admin');
	});
	it('has all category', function () {
		var c = role.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.all.should.be.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('has freetalk', function () {
		var c = role.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.all.should.not.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('has cheat', function () {
		var c = role.category[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.all.should.not.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});
