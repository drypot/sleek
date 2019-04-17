var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongob = require('../mongo/mongo-base')({ dropDatabase: true });
var expb = require('../express/express-base');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postb = require('../post/post-base');
var expl = require('../express/express-local');
var assert = require('assert');
var assert2 = require('../base/assert2');

before(function (done) {
  init.run(done);
});

describe('threads', function () {
  it('should exist', function () {
    assert2.ne(postb.threads, undefined); 
  });
  it('should be empty', function (done) {
    postb.threads.countDocuments(function (err, count) {
      assert.ifError(err);
      assert2.e(count, 0);
      done();
    })
  });
  it('should have indexes', function (done) {
    postb.threads.indexes(function (err, indexes) {
      assert.ifError(err);
      assert2.e(indexes.length, 3);
      done();
    });
  });
  it('getNewId should success', function () {
    assert2.e(postb.getNewThreadId() < postb.getNewThreadId(), true);
  });
});

describe('posts', function () {
  it('should exist', function () {
    assert2.ne(postb.posts, undefined); 
  });
  it('should be empty', function (done) {
    postb.posts.countDocuments(function (err, count) {
      assert.ifError(err);
      assert2.e(count, 0);
      done();
    })
  });
  it('should have indexes', function (done) {
    postb.posts.indexes(function (err, indexes) {
      assert.ifError(err);
      assert2.e(indexes.length, 2);
      done();
    });
  });
  it('getNewId should success', function () {
    assert2.e(postb.getNewPostId() < postb.getNewPostId(), true);
  });
});

describe('files', function () {
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
