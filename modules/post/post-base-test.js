var expect = require('../base/chai').expect;

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postb = require('../post/post-base');
var local = require('../express/local');

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
  function findc(id) {
    for (var i = 0; i < user.categories.length; i++) {
      var c = user.categories[i];
      if (c.id === id) return c;
    }
    return null;
  }
  it('given user', function (done) {
    userf.login('user', function (err, res) {
      user = res.body.user;
      done();
    });
  });
  it('user should not be admin', function () {
    expect(user.admin).false;
  });
  it('user can access freetalk', function () {
    expect(findc(100).name).equal('freetalk');
  });
  it('can not access cheat', function () {
    expect(findc(60)).not.exist;
  });
  it('can not access recycle bin', function () {
    expect(findc(40)).not.exist;
  });

  it('given cheater', function (done) {
    userf.login('cheater', function (err, res) {
      user = res.body.user;
      done();
    });
  });
  it('should not be admin', function () {
    expect(user.admin).false;
  });
  it('can access freetalk', function () {
    expect(findc(100).name).equal('freetalk');
  });
  it('can access cheat', function () {
    expect(findc(60).name).equal('cheat');
  });
  it('can not access recycle bin', function () {
    expect(findc(40)).not.exist;
  });

  it('given admin', function (done) {
    userf.login('admin', function (err, res) {
      user = res.body.user;
      done();
    });
  });
  it('should be admin', function () {
    expect(user.admin).true;
  });
  it('can access freetalk', function () {
    expect(findc(100).name).equal('freetalk');
  });
  it('can access cheat', function () {
    expect(findc(60).name).equal('cheat');
  });
  it('can access recycle bin', function () {
    expect(findc(40).name).equal('recycle bin');
  });
});
