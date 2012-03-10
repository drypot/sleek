var _ = require('underscore');
var _should = require('should');
var _async = require('async');

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
	_async.mapSeries(
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
	_async.mapSeries(
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

testUnion();