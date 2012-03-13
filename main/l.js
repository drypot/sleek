var _ = require('underscore');
var should = require('should');
var async = require('async');
var fs = require('fs');

var initList = [];
var beforeList = [];
var afterList = [];

// object

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

// property

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


// init

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

exports.mkdirs = function (/* base, sub, sub, sub, ..., next */) {
	var arg = arguments;
	var len = arg.length;
	var dir;
	var i = 0;
	async.forEachSeries(arg, function (sub, next) {
		if (i == len - 1) {
			return next();
		}
		if (!dir) {
			dir = sub;
		} else {
			dir += '/' + sub;
		}
		fs.mkdir(dir, 0755, function (err) {
			if (err && err.code !== 'EEXIST') return next(err);
			i++;
			next();
		});
	}, function (err) {
		arg[len - 1](err, dir);
	});
}