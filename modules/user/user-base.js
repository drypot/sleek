var crypto = require('crypto');
var bcrypt = require('bcrypt');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');

init.add(function () {

  error.define('NOT_AUTHENTICATED', '먼저 로그인해 주십시오.');
  error.define('NOT_AUTHORIZED', '사용 권한이 없습니다.');

  var users = {};

  config.data.users.forEach(function (user0) {
    var user = {
      name: user0.name,
      hash: user0.hash,
      admin: user0.admin ? true : false,
      categories: {},
      categoriesOrdered : []
    };
    users[user.name] = user;
    config.data.categories.forEach(function (category0) {
      var category = {
        id: category0.id,
        name: category0.name
      };
      if (user.admin || category0.users.indexOf(user.name) != -1) {
        user.categories[category.id] = category;
        user.categoriesOrdered.push(category);
      }
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

});
