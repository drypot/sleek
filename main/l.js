var _ = require('underscore');
var should = require('should');
var async = require('async');
var fs = require('fs');

// Object

exports.isObject = function (obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
}

// property

exports.p = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return obj[prop];
}

exports.p.int = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var i = parseInt(obj[prop]);
	if (isNaN(i)) return def;
	return i;
}

exports.p.intMax = function (obj, prop, def, max) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var i = parseInt(obj[prop]);
	if (isNaN(i)) return def;
	return i > max ? max : i;
}

exports.p.string = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return String(obj[prop]).trim();
}

exports.p.bool = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var v = obj[prop];
	return v === true || v === 'true';
}

exports.p.merge = function (tar, src, props) {
	_.each(props, function (p) {
		if (src.hasOwnProperty(p)) {
			tar[p] = src[p];
		}
	});
	return tar;
}

// method

exports.m = function (con, methodName, func) {
	Object.defineProperty(
		con, methodName, { value : func, writable: true, enumerable: false, configurable: true}
	);
}

// init

var initList = [];
var beforeList = [];
var afterList = [];

exports.init = {};

exports.init.add = function (func) {
	initList.push(func);
}

exports.init.addBefore = function (func) {
	beforeList.push(func);
}

exports.init.addAfter = function (func) {
	afterList.push(func);
}

exports.init.run = function run(next) {
	var all = beforeList.concat(initList, afterList);
	async.series(all, function (err) {
		if (err) throw err;
		if (next) next();
	});
}

// should

should.Assertion.prototype.sameProto = function (_class, desc) {
	this.assert(
		_class.__proto__ === this.obj.__proto__
		, 'expected prototype to equal ' + (desc ? " | " + desc : "")
		, 'expected prototype to no equal ' + (desc ? " | " + desc : "")
	);
	return this;
}

// fs

exports.fs = {};

exports.fs.mkdirs = function (sub, next) {
	var dir;
	async.forEachSeries(sub, function (sub, next) {
		if (!dir) {
			dir = sub;
		} else {
			dir += '/' + sub;
		}
		fs.mkdir(dir, 0755, function (err) {
			if (err && err.code !== 'EEXIST') return next(err);
			next();
		});
	}, function (err) {
		next(err, dir);
	});
}