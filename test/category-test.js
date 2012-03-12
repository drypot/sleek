var _ = require('underscore');
var _should = require('should');

var _l = require('../main/l');
var _config = require("../main/config");
var _role = require('../main/role');
var _category = require('../main/category');

before(function (next) {
	_l.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		next();
	});
	_l.runInit(next);
});

describe('make', function () {
	it('can make category', function () {
		var c = _category.make(
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
		role = _role.getByName('user');
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
		_should(!c);
	});
});

describe('category for admin', function () {
	var role;
	before(function () {
		role = _role.getByName('admin');
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

