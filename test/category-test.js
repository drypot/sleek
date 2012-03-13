var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var config = require("../main/config");
var role = require('../main/role.js');
var category = require('../main/category.js');

before(function (next) {
	l.addBeforeInit(function (next) {
		config.param = { configPath: "config-dev/config-dev.xml" }
		next();
	});
	l.runInit(next);
});

describe('make', function () {
	it('can make category', function () {
		var c = category.make(
			{categoryId: "0", name: "all", sep: "true", newLine: "true" },
			'user'
		);
		c.should.ok;
		c.id.should.equal(0);
		c.name.should.equal('all');
	});
});

describe('category for user', function () {
	var r;
	before(function () {
		r = role.getByName('user');
	});
	it('has all category', function () {
		var c = r.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.all.should.be.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('has freetalk', function () {
		var c = r.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.all.should.not.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('has cheat', function () {
		var c = r.category[60];
		should(!c);
	});
});

describe('category for admin', function () {
	var r;
	before(function () {
		r = role.getByName('admin');
	});
	it('has all category', function () {
		var c = r.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.all.should.be.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('has freetalk', function () {
		var c = r.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.all.should.not.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('has cheat', function () {
		var c = r.category[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.all.should.not.ok;
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});

