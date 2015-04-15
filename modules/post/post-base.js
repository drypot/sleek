var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');
var fsp = require('../base/fs');
var mongop = require('../mongo/mongo');
var userb = require('../user/user-base');
var postb = exports;

error.define('INVALID_CATEGORY', '정상적인 카테고리가 아닙니다.');
error.define('INVALID_THREAD', '정상적인 글줄이 아닙니다.');
error.define('INVALID_POST', '정상적인 글이 아닙니다.');

error.define('TITLE_EMPTY', '제목을 입력해 주십시오.', 'title');
error.define('TITLE_TOO_LONG', '제목을 줄여 주십시오.', 'title');
error.define('WRITER_EMPTY', '필명을 입력해 주십시오.', 'writer');
error.define('WRITER_TOO_LONG', '필명을 줄여 주십시오.', 'writer');

// threads

var threadId;

init.add(function (done) {
  postb.threads = mongop.db.collection('threads');
  postb.threads.ensureIndex({ cid: 1, udate: -1 }, function (err) {
    if (err) return done(err);
    postb.threads.ensureIndex({ udate: -1 }, done);
  });
});

init.add(function (done) {
  mongop.getLastId(postb.threads, function (err, id) {
    if (err) return done(err);
    threadId = id;
    console.log('post-base: thread id = ' + threadId);
    done();
  });
});

postb.getNewThreadId = function () {
  return ++threadId;
};

// posts

var postId;

init.add(function (done) {
  postb.posts = mongop.db.collection('posts');
  postb.posts.ensureIndex({ tid: 1, cdate: 1 }, function (err) {
    if (err) return done(err);
    postb.posts.ensureIndex({ tokens: 1 }, done);
  });
});

init.add(function (done) {
  mongop.getLastId(postb.posts, function (err, id) {
    if (err) return done(err);
    postId = id;
    console.log('post-base: post id = ' + postId);
    done();
  });
});

postb.getNewPostId = function () {
  return ++postId;
};

// files

init.add(function (done) {
  fsp.makeDir(config.uploadDir + '/public/post', function (err, dir) {
    if (err) return done(err);

    if (config.dev) {
      postb.emptyDir = function (done) {
        fsp.emptyDir(dir, done);
      }
    }

    postb.getFileDir = function (id) {
      return dir + '/' + Math.floor(id / 10000) + '/' + id;
    };

    postb.getFilePath = function (id, fname) {
      return postb.getFileDir(id) + '/' + fname;
    };

    postb.getFileUrl = function (id, fname) {
      return config.uploadSite + '/post/' + Math.floor(id / 10000) + '/' + id + '/' + encodeURIComponent(fname);
    }

    done();
  });
});

// category

init.add(function () {
  for (var name in userb.users) {
    var user = userb.users[name];
    user.categories = []; // Array 와 Object 는 용도별로 확실히 구분해 쓴다.
    user.categoryIndex = {};
    config.categories.forEach(function (category) {
      if (user.admin || ~category.users.indexOf(user.name)) {
        user.categories.push(category);
        user.categoryIndex[category.id] = category;
      }
    });
  }
});

postb.checkCategory = function (user, cid, done) {
  var category = user.categoryIndex[cid];
  if (!category) {
    done(error('INVALID_CATEGORY'));
  } else {
    done(null, category);
  }
}

