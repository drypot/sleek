var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = exports;

(function () {

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

})();

(function () {

	function pad(n) {
		var s = "0" + n;
		return s.substr(s.length - 2, 2);
	}

	l.formatDateTime = function (d) {
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
	};

})();

(function () {

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

})();
