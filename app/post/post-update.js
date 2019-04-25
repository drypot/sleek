'use strict';

const fs = require('fs');
const path = require('path');

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const fs2 = require('../base/fs2');
const async2 = require('../base/async2');
const date2 = require('../base/date2');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const expu = require('../express/express-upload');
const userb = require('../user/user-base');
const postb = require('../post/post-base');
const postn = require('../post/post-new');
const postsr = require('./post-search');

// api edit view 는 삭제. 앱용 서비스가 아니니 필요 없을 듯.

expb.core.get('/posts/:tid([0-9]+)/:pid([0-9]+/edit)', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var tid = parseInt(req.params.tid) || 0;
    var pid = parseInt(req.params.pid) || 0;
    mysql2.queryOne('select * from thread where id = ?', tid, (err, thread) => {
      if (err) return done(err);
      if (!thread) return done(error('INVALID_THREAD'));
      mysql2.queryOne('select * from post where id = ?', pid, (err, post) => {
        if (err) return done(err);
        postb.unpackPost(post);
        if (!post || post.tid !== thread.id) return done(error('INVALID_POST'));
        postb.checkCategory(user, thread.cid, function (err, category) {
          if (err) return done(err);
          postb.addFilesUrl(post);
          post.head = postb.isHead(thread, post);
          post.editable = postb.isEditable(user, post.id, req.session.pids)
          post.cdateStr = date2.dateTimeString(post.cdate);
          res.render('post/post-update', {
            thread: thread,
            category: category,
            post: post
          });
        });
      });
    });
  });
});

expb.core.put('/api/posts/:tid([0-9]+)/:pid([0-9]+)', expu.handler(function (req, res, done) {
  let user;
  let form;
  let thread;
  let post;
  let head;
  async2.waterfall(
    (done) => {
      userb.checkUser(res, done);
    },
    (_user, done) => {
      user = _user;
      form = postn.getForm(req);
      mysql2.queryOne('select * from thread where id = ?', form.tid, done);
    },
    (_thread, f, done) => {
      thread = _thread;
      if (!thread) return done(error('INVALID_THREAD'));
      mysql2.queryOne('select * from post where id = ?', form.pid, done);
    },
    (_post, f, done) => {
      post = _post;
      postb.unpackPost(post);
      if (!post || post.tid !== thread.id) return done(error('INVALID_POST'));
      postb.checkCategory(user, thread.cid, done);
    },
    (_category, done) => {
      if (!postb.isEditable(user, post.id, req.session.pids)) return done(error('NOT_AUTHORIZED'));
      head = postb.isHead(thread, post);
      if (head) {
        postb.checkCategory(user, form.cid, done); // check new cid
      } else {
        done(null, null);
      }
    },
    (_category, done) => {
      postn.checkForm(form, head, done);
    },
    (done) => {
      deleteFiles(form, post, done);              
    },
    (done) => {
      postn.saveFiles(form, post, done);
    },
    (done) => {
      post.writer = form.writer;
      post.text = form.text;
      if (user.admin) {
        post.visible = form.visible;
      }
      postb.packPost(post);
      mysql2.query('update post set ? where id = ?', [post, post.id], done);
    },
    (r, f, done) => {
      if (head) {
        thread.cid = form.cid;
        thread.title = form.title;
        thread.writer = form.writer;
        mysql2.query('update thread set ? where id = ?', [thread, thread.id], done);
      } else {
        done(null, null, null);
      }
    },
    (r, f, done) => {
      postsr.updateThread(thread.id, done);
    },
    (err) => {
      if (err) return done(err);
      res.json({});
    }
  );
}));

function deleteFiles(form, post, done) {
  if (!form.dfiles) return done();
  if (!Array.isArray(form.dfiles)) {
    form.dfiles = [form.dfiles];
  }
  var dir = postb.getFileDir(form.pid);
  var deleted = [];
  var i = 0;
  (function del() {
    if (i < form.dfiles.length) {
      var fname = path.basename(form.dfiles[i++]);
      deleted.push(fname);
      fs.unlink(dir + '/' + fname, function (err) {
        if (err && err.code !== 'ENOENT') return done(err);
        setImmediate(del);
      });
      return;
    }
    post.files = post.files.filter(function (file) {
      return deleted.indexOf(file.name) == -1;
    });
    if (!post.files.length) delete post.files;
    done();
  })();
}
