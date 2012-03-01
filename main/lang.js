var _ = require('underscore');
var _should = require('should');
var _async = require("async");

var initFuncList = [];

exports.addInit = function (func) {
	initFuncList.push(func);
}

exports.runInit = function (callback) {
	_async.series(initFuncList, callback);
}

exports.method = function (con, methodName, func) {
	Object.defineProperty(
		con, methodName, { value : func, writable: true, enumerable: false, configurable: true}
	);
}

exports.merge = function (tar, src, props) {
	_.each(props, function (el) {
		if (src.hasOwnProperty(el)) {
			tar[el] = src[el];
		}
	});
	return tar;
}


_should.Assertion.prototype.sameProto = function (_class, desc) {
	this.assert(
		_class.__proto__ === this.obj.__proto__
		, 'expected prototype to equal ' + (desc ? " | " + desc : "")
		, 'expected prototype to no equal ' + (desc ? " | " + desc : "")
	);
	return this;
}