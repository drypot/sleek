import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as expl from "../express/express-local.js";
import * as userb from "../user/user-base.js";
import * as userf from "../user/user-fixture.js";
import * as postb from "../post/post-base.js";

before(function (done) {
  config.setPath('config/test.json');
  db.setDropDatabase(true);
  init.run(done);
});

before((done) => {
  expb.start();
  done();
});

describe('table thread', function () {
  it('should exist', function (done) {
    db.tableExists('thread', (err, exist) => {
      assert2.ifError(err);
      assert2.ok(exist);
      done();
    });
  });
  it('getNewId should success', function () {
    assert2.ok(postb.getNewThreadId() === 1);
    assert2.ok(postb.getNewThreadId() < postb.getNewThreadId());
  });
});

describe('table post', function () {
  it('should exist', function (done) {
    db.tableExists('post', (err, exist) => {
      assert2.ifError(err);
      assert2.ok(exist);
      done();
    });
  });
  it('getNewId should success', function () {
    assert2.ok(postb.getNewPostId() === 1);
    assert2.ok(postb.getNewPostId() < postb.getNewPostId());
  });
});

describe('upload directory', function () {
  it('should exist', function (done) {
    assert2.e(config.prop.uploadDir, 'upload/sleek-test');
    assert2.path(config.prop.uploadDir + '/public/post');
    assert2.e(postb.getFileDir(20100), config.prop.uploadDir + '/public/post/2/20100');
    assert2.e(postb.getFilePath(20100, 'image.jpg'), config.prop.uploadDir + '/public/post/2/20100/image.jpg');
    assert2.e(postb.getFileUrl(20100, 'image.jpg'), config.prop.uploadSite + '/post/2/20100/image.jpg');
    done();
  });
});

describe('categories', function () {
  let user;
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
      assert2.ifError(err);
      assert2.e(c.name, 'freetalk');
    });
  });
  it('can not access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      assert2.ok(error.find(err, 'INVALID_CATEGORY'));
    });
  });
  it('can not access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      assert2.ok(error.find(err, 'INVALID_CATEGORY'));
    });
  });

  it('given cheater', function (done) {
    userf.login('cheater', function (err, res) {
      user = userb.users[res.body.user.name];
      done();
    });
  });
  it('should not be admin', function () {
    assert2.e(user.admin, false);
  });
  it('can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      assert2.ifError(err);
      assert2.e(c.name, 'freetalk');
    });
  });
  it('can access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      assert2.ifError(err);
      assert2.e(c.name, 'cheat');
    });
  });
  it('can not access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      assert2.ok(error.find(err, 'INVALID_CATEGORY'));
    });
  });

  it('given admin', function (done) {
    userf.login('admin', function (err, res) {
      user = userb.users[res.body.user.name];
      done();
    });
  });
  it('should be admin', function () {
    assert2.e(user.admin, true);
  });
  it('can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      assert2.ifError(err);
      assert2.e(c.name, 'freetalk');
    });
  });
  it('can access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      assert2.ifError(err);
      assert2.e(c.name, 'cheat');
    });
  });
  it('can access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      assert2.ifError(err);
      assert2.e(c.name, 'recycle bin');
    });
  });
});
