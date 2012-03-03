var _ = require('underscore');
var _should = require('should');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _role = require('../main/role');
var _category = require('../main/category');

before(function (done) {
	_lang.addBeforeInit(function (callback) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		callback();
	});
	_lang.runInit(done);
});

describe('category', function () {
	var c1, c2;
	before(function () {
		c1 = _category.make({
			categoryId: "0",
			name: "all",
			sep: "true",
			newLine: "true"
		}, 'user');
		c2 = _category.make({
			categoryId: "100",
			name: "freetalk",
			sep: "false",
			newLine: "false"
		}, 'user');
	});
	it('can be created', function () {
		c1.should.ok;
		c1.id.should.eql(0);
		c1.name.should.eql('all');
	});
});

describe('non existing category', function () {
	var d;
	before(function () {
		d = _role.roleList['user'].categoryList[-999];
	});
	it('should be ok', function () {
		_should.equal(d, undefined);
	});
});

describe('category of user', function () {
	var role;
	before(function () {
		role = _role.roleList['user'];
	});
	describe('all', function () {
		var c;
		before(function () {
			c = role.categoryList[0];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.eql('all');
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
	describe('freetalk', function () {
		var c;
		before(function () {
			c = role.categoryList[100];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.eql('freetalk');
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
	describe('cheat', function () {
		var c;
		before(function () {
			c = role.categoryList[60];
		});
		it('should be ok', function () {
			_should.equal(undefined, c);
		});
	});
});

describe('category of admin', function () {
	var role;
	before(function () {
		role = _role.roleList['admin'];
	});
	describe('all', function () {
		var c;
		before(function () {
			c = role.categoryList[0];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.eql('all');
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
	describe('freetalk', function () {
		var c;
		before(function () {
			c = role.categoryList[100];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.eql('freetalk');
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
	describe('cheat', function () {
		var c;
		before(function () {
			c = role.categoryList[60];
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should have name', function () {
			c.name.should.eql('cheat');
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

