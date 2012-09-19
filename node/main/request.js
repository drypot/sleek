var _ = require('underscore');
var request = require('request');
var l = require('./l.js');

l.init.add(function () {

	l.request = function (urlBase) {
		return new RequestBase(urlBase);
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

	var rwp = RequestWrapper.prototype;

	rwp.query = function (query) {
		this.opt.qs = _.extend(this.opt.qs, query);
		return this;
	};

	rwp.send = function (body) {
		this.opt.body = _.extend(this.opt.body, body);
		return this;
	};

	rwp.set = function (key, value) {
		this.opt.headers[key] = value
		return this;
	};

	rwp.file = function (file) {
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
				'content-disposition': 'form-data; name="uploading"; filename="' + file + '"',
				'content-type': 'text/plain',
				body: file + ' dummy content.'
			});
		});
		return this;
	};

	rwp.end = function (next) {
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

	var RequestBase = function (urlBase) {
		this.urlBase = urlBase;
	};

	var rbp = RequestBase.prototype;

	rbp.get = function (url, a, b) {
		var rw = new RequestWrapper(this, 'GET', url);
		return b ? rw.query(a).end(b) : a ? rw.end(a) : rw;
	}

	rbp.post = function (url, a, b, c) {
		var rw = new RequestWrapper(this, 'POST', url);
		return c ? rw.send(a).file(b).end(c) : b ? rw.send(a).end(b) : a ? rw.end(a) : rw;
	}

	rbp.put = function (url, a, b, c) {
		var rw = new RequestWrapper(this, 'PUT', url);
		return c ? rw.send(a).file(b).end(c) : b ? rw.send(a).end(b) : a ? rw.end(a) : rw;
	}

	rbp.del = function (url, a) {
		var rw = new RequestWrapper(this, 'DELETE', url);
		return a ? rw.end(a) : rw;
	}

	rbp.url = function (path) {
		return this.urlBase + path;
	}

});
