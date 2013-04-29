var should = require('should');

var error = require('../main/error');

describe("error(number)", function () {
	it("should success", function () {
		var err = error(error.INVALID_DATA);
		err.should.have.property('rc', error.INVALID_DATA);
		err.message.should.equal(error.msg[error.INVALID_DATA]);
		err.should.property('stack');
	})
});

describe("error(string)", function () {
	it("should success", function () {
		var msg = 'unknown error';
		var err = error(msg);
		err.should.not.have.property('rc');
		err.message.should.equal(msg);
		err.should.property('stack');
	})
});

describe("error(object with rc)", function () {
	it("should success", function () {
		var obj = { rc: error.INVALID_DATA, opt: 'extra' };
		var err = error(obj);
		err.should.have.property('rc');
		err.message.should.equal(error.msg[error.INVALID_DATA]);
		err.should.have.property('opt', 'extra')
		err.should.property('stack');
	})
});

describe("error(object without rc)", function () {
	it("should success", function () {
		var obj = { opt: 'extra' };
		var err = error(obj);
		err.should.not.have.property('rc');
		err.message.should.equal('unknown error');
		err.should.have.property('opt', 'extra')
		err.should.property('stack');
	})
});