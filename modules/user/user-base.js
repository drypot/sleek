var crypto = require('crypto');
var bcrypt = require('bcrypt');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');

var users = {};

init.add(function () {
  error.define('NOT_AUTHENTICATED', '먼저 로그인해 주십시오.');
  error.define('NOT_AUTHORIZED', '사용 권한이 없습니다.');
  error.define('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
});

init.add(function () {
  config.users.forEach(function (_user) {
    var user = users[_user.name] = {
      name: _user.name,
      hash: _user.hash,
      admin: _user.admin ? true : false,
      categories : [],
      categoryIndex: []
    };
    config.categories.forEach(function (category) {
      if (user.admin || category.users.indexOf(user.name) != -1) {
        user.categories.push(category);
        user.categoryIndex[category.id] = category;
      }
    });
  });
});

exports.findUserByName = function (uname) {
  return users[uname];
};

exports.findUserByPassword = function (password) {
  for (var uname in users) {
    var user = users[uname];
    if (bcrypt.compareSync(password, user.hash)) {
      return user;
    }
  }
  for (var uname in users) {
    var user = users[uname];
    var buf = new Buffer(password, 'ucs2');
    var hash = crypto.createHash('sha256');
    hash.update(buf);
    if (hash.digest('base64') == user.hash) {
      return user;
    }
  }
  return null;
};
