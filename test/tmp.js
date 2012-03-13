var _ = require('underscore');
var should = require('should');
var async = require('async');

function testInclude() {
	var opt = 'mongo,config'.split(',');
	console.log(_.intersection(opt, ['mongo', 'express']).length);
	console.log(_.intersection(opt, ['express']).length);
}

testInclude();

function testEach() {
	_.each(3, function (e) {
		console.log(e);
	});

	_.each([4, 5, 6], function (e) {
		console.log(e);
	});
}

function testAsyncMap() {
	var ary = [1, 2, 3];
	async.mapSeries(
		ary,
		function (item, next) {
			next(null, item + 1);
		},
		function (err, result) {
			console.log(result);
		}
	);
}

function testAsyncMap2() {
	var ary = 1;
	async.mapSeries(
		ary,
		function (item, next) {
			next(null, item + 1);
		},
		function (err, result) {
			console.log(result);
		}
	);
}

function testWithout() {
	console.log(_.without([1, 2, 3], [3, 4, 5]));
	console.log(_.without([], [3, 4, 5]));
	console.log(_.without(undefined, [3, 4, 5]));
}

function testUnion() {
	var abc = {};
	console.log(_.union(abc.def, [1, 2, 3]));
	console.log(_.union(abc.def || [], [1, 2, 3]));
}
