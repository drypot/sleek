'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const userf = require('../user/user-fixture');
const postb = require('../post/post-base');
const expl = require('../express/express-local');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  config.path = 'config/test.json';
  mysql2.dropDatabase = true;
  init.run(done);
});

before((done) => {
  expb.start();
  done();
});

describe('table thread', function () {
  it('should exist', function (done) {
    mysql2.tableExists('thread', (err, exist) => {
      assert.ifError(err);
      assert(exist);
      done();
    });
  });
  it('getNewId should success', function () {
    assert(postb.getNewThreadId() === 1);
    assert(postb.getNewThreadId() < postb.getNewThreadId());
  });
});

describe('table post', function () {
  it('should exist', function (done) {
    mysql2.tableExists('post', (err, exist) => {
      assert.ifError(err);
      assert(exist);
      done();
    });
  });
  it('getNewId should success', function () {
    assert(postb.getNewPostId() === 1);
    assert(postb.getNewPostId() < postb.getNewPostId());
  });
});

describe('upload directory', function () {
  it('should exist', function (done) {
    assert2.path(config.uploadDir + '/public/post');
    assert2.e(postb.getFileDir(20100), config.uploadDir + '/public/post/2/20100');
    assert2.e(postb.getFilePath(20100, 'image.jpg'), config.uploadDir + '/public/post/2/20100/image.jpg');
    assert2.e(postb.getFileUrl(20100, 'image.jpg'), config.uploadSite + '/post/2/20100/image.jpg');
    done();
  });
});

describe('categories', function () {
  var user;
  it('given user', function (done) {
    userf.login('user', function (err, res) {
      user = userb.users[res.body.user.name];
      done();
    });
  });
  it('user should not be admin', function () {
    assert2.e(user.admin, false);
  });
  it('user can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      assert.ifError(err);
      assert2.e(c.name, 'freetalk');
    });
  });
  it('can not access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      assert(error.find(err, 'INVALID_CATEGORY'));
    });
  });
  it('can not access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      assert(error.find(err, 'INVALID_CATEGORY'));
    });
  });

  it('given cheater', function (done) {
    userf.login('cheater', function (err, res) {
      user = userb.users[res.body.user.name];;
      done();
    });
  });
  it('should not be admin', function () {
    assert2.e(user.admin, false);
  });
  it('can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      assert.ifError(err);
      assert2.e(c.name, 'freetalk');
    });
  });
  it('can access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      assert.ifError(err);
      assert2.e(c.name, 'cheat');
    });
  });
  it('can not access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      assert(error.find(err, 'INVALID_CATEGORY'));
    });
  });

  it('given admin', function (done) {
    userf.login('admin', function (err, res) {
      user = userb.users[res.body.user.name];;
      done();
    });
  });
  it('should be admin', function () {
    assert2.e(user.admin, true);
  });
  it('can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      assert.ifError(err);
      assert2.e(c.name, 'freetalk');
    });
  });
  it('can access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      assert.ifError(err);
      assert2.e(c.name, 'cheat');
    });
  });
  it('can access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      assert.ifError(err);
      assert2.e(c.name, 'recycle bin');
    });
  });
});
