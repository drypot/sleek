var should = require('should');

var UrlMaker = require('../main/UrlMaker');

describe("UrlMaker", function () {
	it("given baseUrl, should success", function () {
		var u = new UrlMaker('/thread');
		u.toString().should.equal('/thread');
	});
	it("given query param, should success", function () {
		var u = new UrlMaker('/thread');
		u.add('p', 10);
		u.toString().should.equal('/thread?p=10');
	});
	it("given two query params, should success", function () {
		var u = new UrlMaker('/thread');
		u.add('p', 10);
		u.add('ps', 16);
		u.toString().should.equal('/thread?p=10&ps=16');
	});
	it("given chained expression, should success", function () {
		new UrlMaker('/thread').add('p', 10).add('ps', 16).toString().should.equal('/thread?p=10&ps=16');
	});
	it("given default value, should success", function () {
		var u = new UrlMaker('/thread');
		var p = 0;
		var ps = 16;
		u.add('p', p, 0);
		u.add('ps', ps, 32);
		u.toString().should.equal('/thread?ps=16');
	});
});