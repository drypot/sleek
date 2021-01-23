'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

var funcs = {
  sha256: function (s) {
    var buf = Buffer.from(s, 'ucs2');
    var hash = crypto.createHash('sha256');
    hash.update(buf);
    var d = hash.digest('base64');
    console.log(d);
  },
  bcrypt: function (s) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(s, salt);
    console.log(hash);
  }
}

var func = funcs.bcrypt;
var argv = process.argv;

if (argv.length === 2) {
  console.log('make-hash [-sha256|-bcrypt] ...');
  return;
}

argv.forEach(function (s, index) {
  if (index < 2) {
    return;
  }
  if (s[0] === '-') {
    func = funcs[s.slice(1)];
    return;
  }
  func(s);
});

