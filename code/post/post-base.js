import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as fs2 from "../base/fs2.js";
import * as db from '../db/db.js';
import * as userb from "../user/user-base.js";

error.define('INVALID_CATEGORY', '정상적인 카테고리가 아닙니다.');
error.define('INVALID_THREAD', '정상적인 글줄이 아닙니다.');
error.define('INVALID_POST', '정상적인 글이 아닙니다.');

error.define('TITLE_EMPTY', '제목을 입력해 주십시오.', 'title');
error.define('TITLE_TOO_LONG', '제목을 줄여 주십시오.', 'title');
error.define('WRITER_EMPTY', '필명을 입력해 주십시오.', 'writer');
error.define('WRITER_TOO_LONG', '필명을 줄여 주십시오.', 'writer');

let threadId;
let postId;

init.add(
  (done) => {
    db.query(`
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
  },
  (done) => {
    db.query(`
      create index thread_cid_udate on thread(cid, udate desc);
    `, () => { done(); });
  },
  (done) => {
    db.query(`
      create index thread_udate on thread(udate desc);
    `, () => { done(); });
  },
  (done) => {
    db.query(`
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
  },
  (done) => {
    db.query(`
      create index post_tid_cdate on post(tid, cdate)
    `, () => { done(); });
  },
  (done) => {
    db.query(`
      create table if not exists threadmerged (
        id int not null,
        cid smallint not null,
        hit int not null,
        length smallint not null,
        cdate datetime(3) not null,
        udate datetime(3) not null,
        writer varchar(255) not null,
        title varchar(255) not null,
        text varchar(255) not null,
        merged longtext not null,
        fulltext index (merged),
        primary key (id)
      ) engine = mroonga default charset utf8mb4
    `, done);
  },
  (done) => {
    db.getMaxId('thread', (err, id) => {
      if (err) return done(err);
      threadId = id;
      done();
    });
  },
  (done) => {
    db.getMaxId('post', (err, id) => {
      if (err) return done(err);
      postId = id;
      done();
    });
  }
);

export function getNewThreadId() {
  return ++threadId;
}

export function getNewPostId() {
  return ++postId;
}

export function packPost(post) {
  post.files = JSON.stringify(post.files || null);
}

export function unpackPost(post) {
  post.files = JSON.parse(post.files);
  post.visible = !!post.visible;
}

// files

let uploadDir;

export function emptyDir(done) {
  if (config.prop.dev) {
    fs2.emptyDir(uploadDir, done);
  } else {
    done();
  }
}

export function getFileDir(id) {
  return uploadDir + '/' + Math.floor(id / 10000) + '/' + id;
}

export function getFilePath(id, fname) {
  return getFileDir(id) + '/' + fname;
}

export function getFileUrl(id, fname) {
  return config.prop.uploadSite + '/post/' + Math.floor(id / 10000) + '/' + id + '/' + encodeURIComponent(fname);
}

init.add((done) => {
  fs2.makeDir(config.prop.uploadDir + '/public/post', function (err, dir) {
    if (err) return done(err);
    uploadDir = dir;
    done();
  });
});

// category

init.add((done) => {
  for (let name in userb.users) {
    const user = userb.users[name];
    user.categories = []; // Array 와 Object 는 용도별로 확실히 구분해 쓴다.
    user.categoryIndex = {};
    config.prop.categories.forEach(function (category) {
      if (user.admin || ~category.users.indexOf(user.name)) {
        user.categories.push(category);
        user.categoryIndex[category.id] = category;
      }
    });
  }
  done();
});

export function checkCategory(user, cid, done) {
  const category = user.categoryIndex[cid];
  if (!category) {
    done(error.newError('INVALID_CATEGORY'));
  } else {
    done(null, category);
  }
}

// support

export function isHead(thread, post) {
  return thread.cdate.getTime() === post.cdate.getTime();
}

export function isEditable(user, pid, pids) {
  return user.admin || !!(pids && ~pids.indexOf(pid));
}

export function addFilesUrl(post) {
  if (post.files) {
    for (let i = 0; i < post.files.length; i++) {
      const file = post.files[i];
      file.url = getFileUrl(post.id, file.name);
    }
  }
}
