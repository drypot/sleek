
export function url(url, params) {
  let qm;
  for(let p in params) {
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
}

export function UrlMaker(url) {
  this.url = '' + url;
  this.qm = false;
}

UrlMaker.prototype.add = function (name, value, def) {
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

UrlMaker.prototype.done = function () {
  return this.url;
}
