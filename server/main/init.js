var async = require('async');

var funcs;

exports.add = function (func) {
	if (func.length == 0) {
		funcs.push(function (next) {
			func();
			next();
		})
	} else {
		funcs.push(func);
	}
};

exports.reset = function () {
	funcs = [];
}

exports.run = function (next) {
	console.log('init:');
	async.series(funcs, next);
};

exports.reset();
