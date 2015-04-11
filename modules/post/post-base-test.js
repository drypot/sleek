var expect = require('../base/chai').expect;

var init = require('../base/init');
var config = require('../base/config')({ path: 'config/test.json' });
var postb = require('../post/post-base');

before(function (done) {
  init.run(done);
});

describe('threads', function () {
  it('should exist', function () {
    expect(postb.threads).exist;
  });
  it('getNewId should success', function () {
    expect(postb.getNewThreadId() < postb.getNewThreadId()).true;
  });
});

describe('posts', function () {
  it('should exist', function () {
    expect(postb.posts).exist;
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
