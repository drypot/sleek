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

testAsyncMap2();