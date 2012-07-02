var _ = require('underscore');
var should = require('should');
var async = require('async');
var fs = require('fs');
var request = require('request');

// Console

exports.log = function () {
	_.each(arguments, function (msg) {
		console.log(msg);
	});
}

// Object

exports.isObject = function (obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
}

// property

exports.def = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return obj[prop];
}

exports.defInt = function (obj, prop, def, min, max) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var i = parseInt(obj[prop]);
	if (isNaN(i)) return def;
	if (min === undefined) return i;
	return i > max ? max : i < min ? min : i;
}

exports.defString = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	return String(obj[prop]).trim();
}

exports.defBool = function (obj, prop, def) {
	if (!obj) return def;
	if (!_.has(obj, prop)) return def;
	var v = obj[prop];
	return v === true || v === 'true';
}

exports.mergeProperty = function (tar, src, props) {
	_.each(props, function (p) {
		if (src.hasOwnProperty(p)) {
			tar[p] = src[p];
		}
	});
	return tar;
}

// method

exports.method = function (con, methodName, func) {
	Object.defineProperty(
		con, methodName, { value : func, writable: true, enumerable: false, configurable: true}
	);
}

// init

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

exports.runInit = function run(next) {
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

exports.mkdirs = function (sub, next) {
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

exports.safeFilename = function (name) {
	var i = 0;
	var len = name.length;
	var r = [];
	for (; i < len; i++) {
		var ch = name.charAt(i);
		var code = name.charCodeAt(i);
		if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || "`~!@#$%^&()-_+=[{]};',. ".indexOf(ch) >= 0)
			r.push(ch);
		else if (code < 128)
			r.push('_');
		else
			r.push(ch);
	}
	return r.join('');
}

// RequestWrapper

var RequestWrapper = function (base, method, url) {
	this.opt = {
		method: method,
		url: base.urlBase + url,
		json: true,
		headers: {},
		qs: {},
		body: {}
	}
};

var rw = RequestWrapper.prototype;

rw.query = function (query) {
	this.opt.qs = _.extend(this.opt.qs, query);
	return this;
};

rw.send = function (body) {
	this.opt.body = _.extend(this.opt.body, body);
	return this;
};

rw.set = function (key, value) {
	this.opt.headers[key] = value
	return this;
};

rw.file = function (file) {
	var opt = this.opt;
	opt.headers['content-type'] = 'multipart/form-data';
	opt.multipart = [];
	_.each(_.keys(opt.body), function (key) {
		opt.multipart.push({
			'content-disposition': 'form-data; name="' + key + '"',
			body: opt.body[key].toString()
		});
	});
	delete opt.json;
	delete opt.body;
	_.each(file, function (file) {
		opt.multipart.push({
			'content-disposition': 'form-data; name="file"; filename="' + file + '"',
			'content-type': 'text/plain',
			body: file + ' dummy content.'
		});
	});
	return this;
};

rw.end = function (next) {
	var opt = this.opt;
	request(opt, function (err, res, body) {
		res.ok = res.statusCode / 100 == 2;
		res.status = res.statusCode;
		if (opt.multipart) {
			res.body = JSON.parse(body);
		} else {
			res.body = body;
		}
		next(err, res);
	});
};


// RequestBase

exports.RequestBase = function (urlBase) {
	this.urlBase = urlBase;
};

var requestBase = exports.RequestBase.prototype;

requestBase.get = function (url, a, b) {
	var rw = new RequestWrapper(this, 'GET', url);
	return b ? rw.query(a).end(b) : a ? rw.end(a) : rw;
}

requestBase.post = function (url, a, b, c) {
	var rw = new RequestWrapper(this, 'POST', url);
	return c ? rw.send(a).file(b).end(c) : b ? rw.send(a).end(b) : a ? rw.end(a) : rw;
}

requestBase.put = function (url, a, b, c) {
	var rw = new RequestWrapper(this, 'PUT', url);
	return c ? rw.send(a).file(b).end(c) : b ? rw.send(a).end(b) : a ? rw.end(a) : rw;
}

requestBase.del = function (url, a) {
	var rw = new RequestWrapper(this, 'DELETE', url);
	return a ? rw.end(a) : rw;
}

requestBase.url = function (path) {
	return this.urlBase + path;
}

// SuperAgent hack

//var superagent = require('superagent');
//
//superagent.Request.prototype.endWithoutErr = superagent.Request.prototype.end;
//superagent.Request.prototype.end = function (fn) {
//	this.endWithoutErr(function (res) {
//		if(res.ok){
//			fn(null, res);
//		} else {
//			fn(res.text);
//		}
//	});
//};