'use strict';

var fs = require('fs');
var assert = require('assert');
var assert2 = exports;

assert2.e = assert.strictEqual;
assert2.ne = assert.notStrictEqual;
assert2.de = assert.deepStrictEqual;
assert2.nde = assert.notDeepStrictEqual;

function isEmpty(obj) {
  return typeof obj === 'undefined' || obj === null ||
    (Object.keys(obj).length === 0 && obj.constructor === Object);
}

assert2.empty = function (obj) {
  if (!isEmpty(obj)) {
    assert.fail(obj + ' should be empty');
  }
}

assert2.notEmpty = function (obj) {
  if (isEmpty(obj)) {
    assert.fail(obj + ' should not be empty');
  }
}

assert2.path = function (path, shouldExist)  {
  if (shouldExist === undefined) {
    shouldExist = true;
  }
  let exists = false;
  try {
    fs.accessSync(path);
    exists = true;
  } catch (e) {
  }
  if (shouldExist && !exists) {
    assert.fail(path, shouldExist, path + ' should exist.', 'path', assert2.path);
  }
  if (!shouldExist && exists) {
    assert.fail(path, shouldExist, path + ' should not exist.', 'path', assert2.path);
  }
};

assert2.redirect = function (res, url) {
  let codes = [301, 302];
  if (codes.indexOf(res.status) === -1) {
    assert.fail(res.status, codes, 'invalid status code.', 'redirect', assert2.redirect);
  }
  if (res.header['location'] !== url) {
    assert.fail(res.header['location'], url, 'redirect url mismatch.', 'redirect', assert2.redirect);
  }
}
