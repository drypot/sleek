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

describe('category,', function () {
	it('can make category', function () {
		var c = _category.make(
			{categoryId: "0", name: "all", sep: "true", newLine: "true" },
			'user'
		);
		c.should.ok;
		c.id.should.equal(0);
		c.name.should.equal('all');
	});
	it('should return undefined for non existing category', function () {
		var d = _role.getByName('user').category[-999];
		_should(!d);
	});
});

describe('category of user,', function () {
	var role;
	before(function () {
		role = _role.getByName('user');
	});
	describe('all,', function () {
		var c;
		before(function () {
			c = role.category[0];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.equal('all');
		});
		it('should be all', function () {
			c.all.should.be.ok;
		});
		it('should readable', function () {
			c.readable.should.ok;
		});
		it('should writable', function () {
			c.writable.should.ok;
		});
		it('should not editable', function () {
			c.editable.should.not.ok;
		})
	});
	describe('freetalk,', function () {
		var c;
		before(function () {
			c = role.category[100];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.equal('freetalk');
		});
		it('should not be all', function () {
			c.all.should.not.ok;
		});
		it('should readable', function () {
			c.readable.should.ok;
		});
		it('should writable', function () {
			c.writable.should.ok;
		});
		it('should not editable', function () {
			c.editable.should.not.ok;
		})
	});
	describe('cheat,', function () {
		var c;
		before(function () {
			c = role.category[60];
		});
		it('should be ok', function () {
			_should.equal(undefined, c);
		});
	});
});

describe('category of admin,', function () {
	var role;
	before(function () {
		role = _role.getByName('admin');
	});
	describe('all,', function () {
		var c;
		before(function () {
			c = role.category[0];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.equal('all');
		});
		it('should be all', function () {
			c.all.should.be.ok;
		});
		it('should readable', function () {
			c.readable.should.ok;
		});
		it('should writable', function () {
			c.writable.should.ok;
		});
		it('should editable', function () {
			c.editable.should.ok;
		})
	});
	describe('freetalk,', function () {
		var c;
		before(function () {
			c = role.category[100];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.equal('freetalk');
		});
		it('should not be all', function () {
			c.all.should.not.ok;
		});
		it('should readable', function () {
			c.readable.should.ok;
		});
		it('should writable', function () {
			c.writable.should.ok;
		});
		it('should editable', function () {
			c.editable.should.ok;
		})
	});
	describe('cheat,', function () {
		var c;
		before(function () {
			c = role.category[60];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.equal('cheat');
		});
		it('should not be all', function () {
			c.all.should.not.ok;
		});
		it('should readable', function () {
			c.readable.should.ok;
		});
		it('should writable', function () {
			c.writable.should.ok;
		});
		it('should editable', function () {
			c.editable.should.ok;
		})
	});
});

