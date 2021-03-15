import fs from "fs";
import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as fs2 from "../base/fs2.js";
import * as array2 from "../base/array2.js";
import * as async2 from "../base/async2.js";
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as expu from "../express/express-upload.js";
import * as userb from "../user/user-base.js";
import * as postb from "../post/post-base.js";
import * as postsr from "./post-search.js";

expb.core.get('/posts/new', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    const cid = parseInt(req.query.c) || 0;
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
    const form = getForm(req);
    const newThread = !form.tid;
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
            db.queryOne('select * from thread where id = ?', form.tid, (err, _thread) => {
              if (err) return done(err);
              thread = _thread;
              if (!thread) return done(error.newError('INVALID_THREAD'));
              form.cid = thread.cid;
              done();
            });
          }
        },
        (err) => {
          if (err) return done(err);
          postb.checkCategory(user, form.cid, function (err, category) {
            if (err) return done(err);
            const post = {
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
              db.query('insert into post set ?', post, (err) => {
                if (err) return done(err);
                async2.waterfall(
                  (done) => {
                    if (newThread) {
                      db.query('insert into thread set ?', thread, done);
                    } else {
                      db.query('update thread set length = length + 1, udate = ? where id = ?', [form.now, thread.id], done);
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

export function getForm(req) {
  const body = req.body;
  const form = {};
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
}

export function checkForm(form, newThread, done) {
  const errors = [];
  if (newThread) {
    if (!form.title.length) {
      errors.push(error.get('TITLE_EMPTY'));
    }
    if (form.title.length > 128) {
      errors.push(error.get('TITLE_TOO_LONG'));
    }
  }
  if (!form.writer) {
    errors.push(error.get('WRITER_EMPTY'));
  }
  if (form.writer.length > 32) {
    errors.push(error.get('WRITER_TOO_LONG'));
  }
  if (errors.length) {
    done(error.newFormError(errors));
  } else {
    done();
  }
}

export function saveFiles(form, post, done) {
  if (!form.files) return done();
  fs2.makeDir(postb.getFileDir(post.id), function (err, dir) {
    if (err) return done(err);
    const saved = []; // 업데이트에서 같은 이름의 파일이 업로드될 수 있으므로 post.files 에 바로 push 하지 않는다.
    let i = 0;
    (function save() {
      if (i < form.files.length) {
        const file = form.files[i++];
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
}
