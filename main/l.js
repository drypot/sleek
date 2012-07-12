var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = exports;

// console

l.log = function () {
	console.log.apply(null, arguments);
};

// object

l.isObject = function (obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
};

// property

l.def = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return obj[prop];
};

l.defInt = function (obj, prop, def, min, max) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var i = parseInt(obj[prop]);
	if (isNaN(i)) return def;
	if (min === undefined) return i;
	return i > max ? max : i < min ? min : i;
};

l.defString = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return String(obj[prop]).trim();
};

l.defBool = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var v = obj[prop];
	return v === true || v === 'true';
};

l.mergeProperty = function (tar, src, props) {
	_.each(props, function (p) {
		if (src.hasOwnProperty(p)) {
			tar[p] = src[p];
		}
	});
	return tar;
}

// method

l.method = function (con, methodName, func) {
	Object.defineProperty(
		con, methodName, { value : func, writable: true, enumerable: false, configurable: true}
	);
}

// init

l.init = {
	reset: function () {
		this.initList = [];
		this.beforeList = [];
		this.afterList = [];
	},

	init: function (func) {
		return this.add(this.initList, func);
	},

	beforeInit: function (func) {
		return this.add(this.beforeList, func);
	},

	afterInit: function (func) {
		return this.add(this.afterList, func);
	},

	add: function(list, func) {
		if (func.length == 0) {
			list.push(function (next) {
				func();
				next();
			})
		} else {
			list.push(func);
		}
	},

	run: function (next) {
		var all = this.beforeList.concat(this.initList, this.afterList);
		async.series(all, function (err) {
			if (err) throw err;
			if (next) next();
		});
	}
};

l.init.reset();

// module

l.module = function (m) {
	_.each(['init', 'beforeInit', 'afterInit'], function (method) {
		if (m[method]) {
			l.init[method](function (next) {
				if (m[method].length == 0) {
					m[method]();
					next();
				} else {
					m[method](next);
				}
			});
		}
	});

	return m;
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
