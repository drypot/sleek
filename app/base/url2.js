'use strict';

const url2 = exports;

url2.url = function(url, params) {
  var qm;
  for(var p in params) {
    if (qm) {
      url += '&';
    } else {
      url += '?';
      qm = true;
    }
    url += p;
    url += '=';
    url += params[p];
  }
  return url;
};

url2.UrlMaker = function(url) {
  this.url = '' + url;
  this.qm = false;
}

url2.UrlMaker.prototype.add = function (name, value, def) {
  if (def !== undefined && def === value) {
    return this;
  }
  if (!this.qm) {
    this.url += '?';
    this.qm = true;
  } else {
    this.url += '&';
  }
  this.url += name;
  this.url += '=';
  this.url += value;
  return this;
}

url2.UrlMaker.prototype.done = function () {
  return this.url;
}