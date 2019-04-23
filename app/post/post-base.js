'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const fs2 = require('../base/fs2');
const mysql2 = require('../mysql/mysql2');
const userb = require('../user/user-base');
const postb = exports;

error.define('INVALID_CATEGORY', '정상적인 카테고리가 아닙니다.');
error.define('INVALID_THREAD', '정상적인 글줄이 아닙니다.');
error.define('INVALID_POST', '정상적인 글이 아닙니다.');

error.define('TITLE_EMPTY', '제목을 입력해 주십시오.', 'title');
error.define('TITLE_TOO_LONG', '제목을 줄여 주십시오.', 'title');
error.define('WRITER_EMPTY', '필명을 입력해 주십시오.', 'writer');
error.define('WRITER_TOO_LONG', '필명을 줄여 주십시오.', 'writer');

init.add(function (done) {
  mysql2.pool.query(`
    create table if not exists thread(
      id int not null,
      cid smallint not null,
      hit int not null,
      length smallint not null,
      cdate datetime(3) not null,
      udate datetime(3) not null,
      writer varchar(255) not null,
      title varchar(255) not null,
      primary key (id)
    )
  `, done);
});

init.add(function (done) {
  mysql2.pool.query(`
    create index thread_cid_udate on thread(cid, udate desc);
  `, err => { done(); });
});

init.add(function (done) {
  mysql2.pool.query(`
    create index thread_udate on thread(udate desc);
  `, err => { done(); });
});

init.add(function (done) {
  mysql2.pool.query(`
    create table if not exists post (
      id int not null,
      tid int not null,
      cdate datetime(3) not null,
      visible bool not null,
      writer varchar(255) not null,
      text longtext not null,
      files json not null,
      primary key (id)
    )
  `, done);
});

init.add(function (done) {
  mysql2.pool.query(`
    create index post_tid_cdate on post(tid, cdate)
  `, err => { done(); });
});

var threadId;

init.add(function (done) {
  mysql2.pool.query('select coalesce(max(id), 0) as maxId from thread', (err, r) => {
    if (err) return done(err);
    threadId = r[0].maxId;
    done();
  });
});

postb.getNewThreadId = function () {
  return ++threadId;
};

var postId;

init.add(function (done) {
  mysql2.pool.query('select coalesce(max(id), 0) as maxId from post', (err, r) => {
    if (err) return done(err);
    postId = r[0].maxId;
    done();
  });
});

postb.getNewPostId = function () {
  return ++postId;
};

// files

init.add(function (done) {
  fs2.makeDir(config.uploadDir + '/public/post', function (err, dir) {
    if (err) return done(err);

    if (config.dev) {
      postb.emptyDir = function (done) {
        fs2.emptyDir(dir, done);
      }
    }

    postb.getFileDir = function (id) {
      return dir + '/' + Math.floor(id / 10000) + '/' + id;
    };

    postb.getFilePath = function (id, fname) {
      return postb.getFileDir(id) + '/' + fname;
    };
    done();
  });
});

var getFileUrl = postb.getFileUrl = function (id, fname) {
  return config.uploadSite + '/post/' + Math.floor(id / 10000) + '/' + id + '/' + encodeURIComponent(fname);
};

// category

init.add(function (done) {
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
  done();
});

postb.checkCategory = function (user, cid, done) {
  var category = user.categoryIndex[cid];
  if (!category) {
    done(error('INVALID_CATEGORY'));
  } else {
    done(null, category);
  }
}

// support

postb.isHead = function(thread, post) {
  return thread.cdate.getTime() === post.cdate.getTime();
};

postb.isEditable = function (user, pid, pids) {
  return user.admin || !!(pids && ~pids.indexOf(pid));
}

postb.addFilesUrl = function (post) {
  if (post.files) {
    for (var i = 0; i < post.files.length; i++) {
      var file = post.files[i];
      file.url = getFileUrl(post.id, file.name);
    }
  }
}
