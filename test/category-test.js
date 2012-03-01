var _ = require('underscore');
var _should = require('should');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _role = require('../main/role');
var _category = require('../main/category');

_config.initParam = { configPath: "config-dev/config-dev.xml" }

before(function (done) {
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

describe('dummy category', function () {
	var d;
	before(function () {
		d = _role.roleList['user'].getCategory(-999);
	});
	it('should be ok', function () {
		d.should.ok;
	});
	it('should have no name', function () {
		d.name.should.not.ok;
	});
	it('is not readable', function () {
		d.readable.should.not.ok;
	})
	it('is not writable', function () {
		d.writable.should.not.ok;
	})
	it('is not editable', function () {
		d.editable.should.not.ok;
	})
});

describe('category of user', function () {
	var role;
	before(function () {
		role = _role.roleList['user'];
	});
	describe('all', function () {
		var c;
		before(function () {
			c = role.getCategory(0);
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
			c = role.getCategory(100);
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
			c = role.getCategory(60);
		});
		it('should be ok', function () {
			c.should.ok;
		});
		it('should be dummy', function () {
			c.name.should.not.ok;
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
			c = role.getCategory(0);
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
			c = role.getCategory(100);
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
			c = role.getCategory(60);
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

