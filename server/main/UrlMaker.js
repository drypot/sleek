
module.exports = UrlMaker;

function UrlMaker(baseUrl) {
	this.url = '' + baseUrl;
	this.qmAdded = false;
}

UrlMaker.prototype.add = function (name, value) {
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

UrlMaker.prototype.addIfNot = function (name, value, def) {
	if (value !== def) {
		this.add(name, value);
	}

	return this;
}

UrlMaker.prototype.toString = function () {
	return this.url;
}
