var should = require('should');

var l = require('../main/l.js');

describe("find", function () {
	it("should success", function () {
		var item = l.find([ 1, 2, 3], function (item) {
			return item === 2;
		});
		item.should.equal(2);
	});
	it("should success", function () {
		var item = l.find([ 1, 2, 3], function (item) {
			return item === 4;
		});
		should(item === null);
	});
});