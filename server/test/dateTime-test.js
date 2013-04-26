var should = require('should');

var dateTime = require('../main/dateTime');

describe("formatDate", function () {
	it("should success", function () {
		var d = new Date(1974, 4, 16, 12, 0);
		dateTime.format(d).should.equal('1974-05-16 12:00');
	})
});
