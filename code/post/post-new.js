'use strict';

const fs = require('fs');

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const fs2 = require('../base/fs2');
const array2 = require('../base/array2');
const async2 = require('../base/async2');
const expb = require('../express/express-base');
const expu = require('../express/express-upload');
const mysql2 = require('../mysql/mysql2');
const userb = require('../user/user-base');
const postb = require('../post/post-base');
const postsr = require('./post-search');
const postn = exports;

expb.core.get('/posts/new', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var cid = parseInt(req.query.c) || 0;
    res.render('post/post-new', { cid: cid });
  });
});

expb.core.post('/api/posts', expu.handler(function (req, res, done) {
  createPost(req, res, done);
}));

expb.core.post('/api/posts/:tid([0-9]+)', expu.handler(function (req, res, done) {
  createPost(req, res, done);
}));

function createPost(req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var form = getForm(req);
    var newThread = !form.tid;
    checkForm(form, newThread, function (err) {
      if (err) return done(err);
      let thread;
      async2.waterfall(
        (done) => {
          if (newThread) {
            thread = {
              id : postb.getNewThreadId(),
              cid: form.cid,
              hit: 0,
              length: 1,
              cdate: form.now,
              udate: form.now,
              writer: form.writer,
              title: form.title
            };
            done();
          } else {
            mysql2.queryOne('select * from thread where id = ?', form.tid, (err, _thread) => {
              if (err) return done(err);
              thread = _thread;
              if (!thread) return done(error('INVALID_THREAD'));
              form.cid = thread.cid;
              done();
            });
          }
        },
        (err) => {
          if (err) return done(err);
          postb.checkCategory(user, form.cid, function (err, category) {
            if (err) return done(err);
            var post = {
              id: postb.getNewPostId(),
              tid: thread.id,
              cdate: form.now,
              visible: user.admin ? form.visible : true,
              writer: form.writer,
              text: form.text
            };
            saveFiles(form, post, function (err) {
              if (err) return done(err);
              postb.packPost(post);
              mysql2.query('insert into post set ?', post, (err) => {
                if (err) return done(err);
                async2.waterfall(
                  (done) => {
                    if (newThread) {
                      mysql2.query('insert into thread set ?', thread, done);
                    } else {
                      mysql2.query('update thread set length = length + 1, udate = ? where id = ?', [form.now, thread.id], done);
                    }
                  },
                  (err) => {
                    if (err) return done(err);
                    postsr.updateThread(thread.id, (err) => {
                      if (err) return done(err);
                      req.session.pids.push(post.id);
                      res.json({
                        tid: thread.id,
                        pid: post.id
                      });
                    });
                  }
                );
              });
            });
          })
        }
      );
    });
  });
}

var getForm = postn.getForm = function (req) {
  var body = req.body;
  var form = {};
  form.now = new Date();
  form.cid = parseInt(body.cid) || 0;
  form.tid = parseInt(req.params.tid) || 0; // for update and reply
  form.pid = parseInt(req.params.pid) || 0; // for update
  form.writer  = String(body.writer || '').trim();
  form.title = String(body.title || '').trim();
  form.text = String(body.text || '').trim();
  form.visible = 'visible' in body ? !!body.visible : true;
  form.files = req.files && req.files.files;
  form.dfiles = body.dfiles; // for update
  return form;
};

var checkForm = postn.checkForm = function (form, newThread, done) {
  var errors = [];
  if (newThread) {
    if (!form.title.length) {
      errors.push(error.TITLE_EMPTY);
    }
    if (form.title.length > 128) {
      errors.push(error.TITLE_TOO_LONG);
    }
  }
  if (!form.writer) {
    errors.push(error.WRITER_EMPTY);
  }
  if (form.writer.length > 32) {
    errors.push(error.WRITER_TOO_LONG);
  }
  if (errors.length) {
    done(error(errors));
  } else {
    done();
  }
};

var saveFiles = postn.saveFiles = function (form, post, done) {
  if (!form.files) return done();
  fs2.makeDir(postb.getFileDir(post.id), function (err, dir) {
    if (err) return done(err);
    var saved = []; // 업데이트에서 같은 이름의 파일이 업로드될 수 있으므로 post.files 에 바로 push 하지 않는다.
    var i = 0;
    (function save() {
      if (i < form.files.length) {
        var file = form.files[i++];
        fs.rename(file.path, dir + '/' + file.safeFilename, function (err) {
          if (err) return done(err);
          saved.push({ name: file.safeFilename });
          setImmediate(save);
        });
        return;
      }
      if (post.files) {
        array2.merge(post.files, saved, function (file1, file2) {
          return file1.name === file2.name;
        });
      } else {
        post.files = saved;
      }
      done();
    })();
  });
};
