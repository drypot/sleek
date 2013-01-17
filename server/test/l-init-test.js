var _ = require('underscore');
var should = require('should');
var l = require('../main/l.js');

describe('init', function () {
	it('with normal fn, should success', function (next) {
		var a = [];
		l.init.reset();
		l.init(function () {
			a.push(3);
		});
		l.init.run(function () {
			a.should.length(1);
			a[0].should.equal(3);
			next();
		});
	});

	it('with async fn, should success', function (next) {
		var a = [];
		l.init.reset();
		l.init(function (next) {
			a.push(33);
			next();
		});
		l.init.run(function () {
			a.should.length(1);
			a[0].should.equal(33);
			next();
		});
	});

	it('with -1 priority fn, should success', function (next) {
		var a = [];
		l.init.reset();
		l.init(-1, function () {
			a.push(1);
		});
		l.init(function () {
			a.push(2);
		});
		l.init(-1, function () {
			a.push(3);
		});
		l.init.run(function () {
			a.should.length(3);
			a[0].should.equal(1);
			a[1].should.equal(3);
			a[2].should.equal(2);
			next();
		});
	});

	it('with +1 priority fn, should success', function (next) {
		var a = [];
		l.init.reset();
		l.init(1, function () {
			a.push(1);
		});
		l.init(function () {
			a.push(2);
		});
		l.init(1, function () {
			a.push(3);
		});
		l.init.run(function () {
			a.should.length(3);
			a[0].should.equal(2);
			a[1].should.equal(1);
			a[2].should.equal(3);
			next();
		});
	});
});
