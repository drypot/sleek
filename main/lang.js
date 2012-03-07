var _ = require('underscore');
var _should = require('should');
var _async = require("async");

var initList = [];
var beforeList = [];
var afterList = [];

exports.addInit = function (func) {
	initList.push(func);
}

exports.addBeforeInit = function (func) {
	beforeList.push(func);
}

exports.addAfterInit = function (func) {
	afterList.push(func);
}

exports.runInit = function (next) {
	var all = beforeList.concat(initList, afterList);
	_async.series(all, function (err) {
		if (err) throw err;
		next();
	});
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

exports.p = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return obj[prop];
}

exports.intp = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var i = parseInt(obj[prop]);
	if (isNaN(i)) return def;
	return i;
}

exports.strp = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return String(obj[prop]).trim();
}

exports.boolp = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var v = obj[prop];
	return v === true || v === 'true';
}
