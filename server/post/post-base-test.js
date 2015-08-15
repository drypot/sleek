var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongob = require('../mongo/mongo-base')({ dropDatabase: true });
var expb = require('../express/express-base');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postb = require('../post/post-base');
var expl = require('../express/express-local');
var expect = require('../base/assert2').expect;

before(function (done) {
  init.run(done);
});

describe('threads', function () {
  it('should exist', function () {
    expect(postb.threads).exist;
  });
  it('should be empty', function (done) {
    postb.threads.count(function (err, count) {
      expect(err).not.exist;
      expect(count).equal(0);
      done();
    })
  });
  it('should have indexes', function (done) {
    postb.threads.indexes(function (err, indexes) {
      expect(err).not.exist;
      expect(indexes).length(3);
      done();
    });
  });
  it('getNewId should success', function () {
    expect(postb.getNewThreadId() < postb.getNewThreadId()).true;
  });
});

describe('posts', function () {
  it('should exist', function () {
    expect(postb.posts).exist;
  });
  it('should be empty', function (done) {
    postb.posts.count(function (err, count) {
      expect(err).not.exist;
      expect(count).equal(0);
      done();
    })
  });
  it('should have indexes', function (done) {
    postb.posts.indexes(function (err, indexes) {
      expect(err).not.exist;
      expect(indexes).length(3);
      done();
    });
  });
  it('getNewId should success', function () {
    expect(postb.getNewPostId() < postb.getNewPostId()).true;
  });
});

describe('files', function () {
  it('should exist', function (done) {
    expect(config.uploadDir + '/public/post').pathExist;
    expect(postb.getFileDir(20100)).equal(config.uploadDir + '/public/post/2/20100');
    expect(postb.getFilePath(20100, 'image.jpg')).equal(config.uploadDir + '/public/post/2/20100/image.jpg');
    expect(postb.getFileUrl(20100, 'image.jpg')).equal(config.uploadSite + '/post/2/20100/image.jpg');
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
    expect(user.admin).false;
  });
  it('user can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      expect(err).not.exist;
      expect(c.name).equal('freetalk');
    });
  });
  it('can not access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      expect(err).error('INVALID_CATEGORY');
    });
  });
  it('can not access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      expect(err).error('INVALID_CATEGORY');
    });
  });

  it('given cheater', function (done) {
    userf.login('cheater', function (err, res) {
      user = userb.users[res.body.user.name];;
      done();
    });
  });
  it('should not be admin', function () {
    expect(user.admin).false;
  });
  it('can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      expect(err).not.exist;
      expect(c.name).equal('freetalk');
    });
  });
  it('can access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      expect(err).not.exist;
      expect(c.name).equal('cheat');
    });
  });
  it('can not access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      expect(err).error('INVALID_CATEGORY');
    });
  });

  it('given admin', function (done) {
    userf.login('admin', function (err, res) {
      user = userb.users[res.body.user.name];;
      done();
    });
  });
  it('should be admin', function () {
    expect(user.admin).true;
  });
  it('can access freetalk', function () {
    postb.checkCategory(user, 100, function (err, c) {
      expect(err).not.exist;
      expect(c.name).equal('freetalk');
    });
  });
  it('can access cheat', function () {
    postb.checkCategory(user, 60, function (err, c) {
      expect(err).not.exist;
      expect(c.name).equal('cheat');
    });
  });
  it('can access recycle bin', function () {
    postb.checkCategory(user, 40, function (err, c) {
      expect(err).not.exist;
      expect(c.name).equal('recycle bin');
    });
  });
});
