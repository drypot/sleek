
(function () {

	// object

	exports.isObject = function (obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

//	exports.value = function (obj, prop, def) {
//		return obj && obj[prop] || def;
//	};
//
//	exports.int = function (obj, prop, def, min, max) {
//		var i = parseInt(obj && obj[prop]) || def;
//		if (min === undefined) {
//			return i;
//		} else {
//			return i > max ? max : i < min ? min : i;
//		}
//	};
//
//	exports.string = function (obj, prop, def) {
//		return obj && obj[prop] && String(obj[prop]).trim() || def;
//	};
//
//	exports.bool = function (obj, prop, def) {
//		var v;
//		if (!obj) {
//			return def;
//		} else if (!(prop in obj)) {
//			return def;
//		} else {
//			v = obj[prop];
//			return v === true || v === 'true';
//		}
//	};

	exports.merge = function (tar, src, props) {
		props.forEach(function (p) {
			if (src.hasOwnProperty(p)) {
				tar[p] = src[p];
			}
		});
		return tar;
	}

	exports.method = function (con, methodName, fn) {
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

	exports.formatDateTime = function (d) {
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
	};

})();

(function () {

	// UrlMaker

	exports.UrlMaker = function (baseUrl) {
		this.url = '' + baseUrl;
		this.qmAdded = false;
	};

	var urlMaker = exports.UrlMaker.prototype;

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
