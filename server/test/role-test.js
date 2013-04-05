var should = require('should');

var l = require('../main/l');
var role = require('../main/role');

before(function () {
	role.init({
		role: [
			{ "name": "user", "hash": "$2a$10$ku7nymS.1CPd8jMttYXZMe4wVWweWr1EqaYst75tzimQh2iAAqvZW" },
			{ "name": "cheater", "hash": "$2a$10$UujeEPUXiV/ipq9Cl3htK.KrWLKHdxQcM5VFCBoxBV5pdNG3C2Exy" },
			{ "name": "admin", "hash": "$2a$10$vIl4m5eO71dCHQmZH7/BxOwLIHZ/9NYASyosTHgtLEO/MRlCATU9S" }
		],
		category: [
			{ "id": 0, "name": "all", "read": ["user", "cheater", "admin"], "write": [], "edit": [], "sep": true },

			{ "id": 100, "name": "freetalk", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 104, "name": "health", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 401, "name": "trade", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 400, "name": "house109", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 300, "name": "house", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"], "sep": true },

			{ "id": 102, "name": "blackkid", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 220, "name": "epicure", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"], "sep": true },

			{ "id": 215, "name": "apple", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 909, "name": "google", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 200, "name": "microsoft", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"], "sep": true },

			{ "id": 210, "name": "linux", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 203, "name": "java", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 217, "name": "pda", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 110, "name": "tool", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"], "sep": true },

			{ "id": 120, "name": "game", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 130, "name": "music", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 140, "name": "movie", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 150, "name": "anime", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"], "sep": true },

			{ "id": 101, "name": "who is it ?", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"] },
			{ "id": 910, "name": "obituary", "read": ["user", "cheater", "admin"], "write": ["user", "cheater", "admin"], "edit": ["admin"], "sep": true },

			{ "id": 60, "name": "cheat", "read": ["cheater", "admin"], "write": ["cheater", "admin"], "edit": ["admin"], "sep": true },

			{ "id": 40, "name": "recycle bin", "read": ["admin"], "write": ["admin"], "edit": ["admin"] },
			{ "id": 50, "name": "test", "read": ["admin"], "write": ["admin"], "edit": ["admin"] }
		]
	});
});

describe('roleByName()', function () {
	it('can find role by name', function () {
		role.roleByName('user').name.should.equal('user');
		role.roleByName('cheater').name.should.equal('cheater');
		role.roleByName('admin').name.should.equal('admin');
		should.not.exist(role.roleByName('xxx'));
	});
});

describe('roleByPassword()', function () {
	it('can find role by password', function () {
		role.roleByPassword('1').name.should.equal('user');
		role.roleByPassword('2').name.should.equal('cheater');
		role.roleByPassword('3').name.should.equal('admin');
		should.not.exist(role.roleByPassword('x'));
	})
});

describe('user role', function () {
	var roleX;
	before(function () {
		roleX = role.roleByName('user');
	});
	it('should have all category', function () {
		var c = roleX.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = roleX.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('should not have cheat', function () {
		var c = roleX.category[60];
		should(!c);
	});
});

describe('admin role', function () {
	var roleX;
	before(function () {
		roleX = role.roleByName('admin');
	});
	it('should have all category', function () {
		var c = roleX.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = roleX.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('should have cheat', function () {
		var c = roleX.category[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});
