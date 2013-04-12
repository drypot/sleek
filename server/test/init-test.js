var should = require('should');

var init = require('../main/init');

describe('normal init function', function () {
	it('should success', function (next) {
		var a = [];
		init.reset();
		init.add(function () {
			a.push(3);
		});
		init.add(function () {
			a.push(7);
		});
		init.run(function () {
			a.should.length(2);
			a[0].should.equal(3);
			a[1].should.equal(7);
			next();
		});
	});
});

describe('async init function', function () {
	it('should success', function (next) {
		var a = [];
		init.reset();
		init.add(function (next) {
			a.push(33);
			next();
		});
		init.add(function (next) {
			a.push(77);
			next();
		});
		init.run(function () {
			a.should.length(2);
			a[0].should.equal(33);
			a[1].should.equal(77);
			next();
		});
	});
});