'use strict';

const date2 = exports;

date2.today = function () {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

date2.dateFromString = function (s) {
  var d = new Date(s);
  d.setHours(0, 0, 0, 0);
  return d;
}

function pad(number) {
  var r = String(number);
  if ( r.length === 1 ) {
    r = '0' + r;
  }
  return r;
}

date2.dateTimeString = function (d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
};

date2.dateString = function (d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};

date2.dateStringNoDash = function (d) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
};