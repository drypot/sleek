var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = exports;

(function () {

	var func = {};

	reset();

	l.init = function (pri, func0) {
		var funcAtPri;

		if (_.isFunction(pri)) {
			func0 = pri;
			pri = 0;
		}

		funcAtPri = func[pri];
		if (!funcAtPri) {
			funcAtPri = func[pri] = [];
		}

		if (func0.length == 0) {
			funcAtPri.push(function (next) {
				func0();
				next();
			})
		} else {
			funcAtPri.push(func0);
		}
	};

	l.init.reset = reset;

	function reset() {
		func = {};
	}

	l.init.run = function (next) {
		var all = [];

		_.each(_.keys(func).sort(), function (pri) {
			all = all.concat(func[pri]);
		});

		async.series(all, function (err) {
			if (err) {
				throw err;
			} else if (next) {
				next();
			}
		});
	};

})();

l.init(function () {

	// object

	l.isObject = function (obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

	l.value = function (obj, prop, def) {
		if (!obj) {
			return def;
		} else if (!_.has(obj, prop)) {
			return def;
		} else {
			return obj[prop];
		}
	};

	l.int = function (obj, prop, def, min, max) {
		var i;
		if (!obj) {
			return def;
		} else if (!_.has(obj, prop)) {
			return def;
		} else {
			i = parseInt(obj[prop]);
			if (isNaN(i)) {
				return def;
			} else if (min === undefined) {
				return i;
			} else {
				return i > max ? max : i < min ? min : i;
			}
		}
	};

	l.string = function (obj, prop, def) {
		if (!obj) {
			return def;
		} else if (!_.has(obj, prop)) {
			return def;
		} else {
			return String(obj[prop]).trim();
		}
	};

	l.bool = function (obj, prop, def) {
		var v;
		if (!obj) {
			return def;
		} else if (!_.has(obj, prop)) {
			return def;
		} else {
			v = obj[prop];
			return v === true || v === 'true';
		}
	};

	l.merge = function (tar, src, props) {
		_.each(props, function (p) {
			if (src.hasOwnProperty(p)) {
				tar[p] = src[p];
			}
		});
		return tar;
	}

	// method

	l.method = function (con, methodName, fn) {
		Object.defineProperty(
			con, methodName, { value : fn, writable: true, enumerable: false, configurable: true}
		);
	}

});

l.init(function () {

	// http://ejohn.org/blog/simple-javascript-inheritance/

	var initializing = false,
		superPattern = /xyz/.test(function () { xyz; }) ? /\b_super\b/ : /.*/;

	Object.subClass = function (properties) {
		var _super = this.prototype;

		initializing = true;
		var proto = new this();
		initializing = false;

		for (var name in properties) {
			proto[name] = typeof properties[name] == "function" &&
				typeof _super[name] == "function" &&
				superPattern.test(properties[name]) ?
				(function (name, fn) {
					return function () {
						var tmp = this._super;
						this._super = _super[name];
						var ret = fn.apply(this, arguments);
						this._super = tmp;
						return ret;
					};
				})(name, properties[name]) :
				properties[name];
		}

		function Class() {
			// All construction is actually done in the init method
			if (!initializing && this.init)
				this.init.apply(this, arguments);
		}

		Class.prototype = proto;
		Class.constructor = Class;
		Class.subClass = arguments.callee;
		return Class;
	}
});

l.init(function () {

	// http://stove99.tistory.com/46

	Date.prototype.format = function(f) {
		if (!this.valueOf()) return " ";

		var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
		var d = this;

		return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
			switch ($1) {
				case "yyyy": return d.getFullYear();
				case "yy": return (d.getFullYear() % 1000).zf(2);
				case "MM": return (d.getMonth() + 1).zf(2);
				case "dd": return d.getDate().zf(2);
				case "E": return weekName[d.getDay()];
				case "HH": return d.getHours().zf(2);
				case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
				case "mm": return d.getMinutes().zf(2);
				case "ss": return d.getSeconds().zf(2);
				case "a/p": return d.getHours() < 12 ? "오전" : "오후";
				default: return $1;
			}
		});
	};

	String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
	String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
	Number.prototype.zf = function(len){return this.toString().zf(len);};

});

l.init(function () {

	// should

	should.Assertion.prototype.sameProto = function (_class, desc) {
		this.assert(
			_class.__proto__ === this.obj.__proto__
			, 'expected prototype to equal ' + (desc ? " | " + desc : "")
			, 'expected prototype to no equal ' + (desc ? " | " + desc : "")
		);
		return this;
	}

});

l.init(function () {

	// UrlMaker

	l.UrlMaker = function (baseUrl) {
		this.url = '' + baseUrl;
		this.qmAdded = false;
	};

	var urlMaker = l.UrlMaker.prototype;

	urlMaker.add = function (name, value) {
		if (!this.qmAdded) {
			this.url += '?';
			this.qmAdded = true;
		} else {
			this.url += '&';
		}
		this.url += name;
		this.url += '=';
		this.url += value;

		return this;
	}

	urlMaker.addIfNot = function (name, value, def) {
		if (value !== def) {
			this.add(name, value);
		}

		return this;
	}

	urlMaker.toString = function () {
		return this.url;
	}

});
