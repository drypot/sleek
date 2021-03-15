import fs from "fs";
import path from "path";
import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as fs2 from "../base/fs2.js";
import * as async2 from "../base/async2.js";
import * as date2 from "../base/date2.js";
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as expu from "../express/express-upload.js";
import * as userb from "../user/user-base.js";
import * as postb from "../post/post-base.js";
import * as postn from "../post/post-new.js";
import * as postsr from "../post/post-search.js";

// api edit view 는 삭제. 앱용 서비스가 아니니 필요 없을 듯.

expb.core.get('/posts/:tid([0-9]+)/:pid([0-9]+/edit)', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    const tid = parseInt(req.params.tid) || 0;
    const pid = parseInt(req.params.pid) || 0;
    db.queryOne('select * from thread where id = ?', tid, (err, thread) => {
      if (err) return done(err);
      if (!thread) return done(error.newError('INVALID_THREAD'));
      db.queryOne('select * from post where id = ?', pid, (err, post) => {
        if (err) return done(err);
        postb.unpackPost(post);
        if (!post || post.tid !== thread.id) return done(error.newError('INVALID_POST'));
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
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    const form = postn.getForm(req);
    db.queryOne('select * from thread where id = ?', form.tid, (err, thread) => {
      if (err) return done(err);
      if (!thread) return done(error.newError('INVALID_THREAD'));
      db.queryOne('select * from post where id = ?', form.pid, (err, post) => {
        if (err) return done(err);
        postb.unpackPost(post);
        if (!post || post.tid !== thread.id) return done(error.newError('INVALID_POST'));
        postb.checkCategory(user, thread.cid, function (err, category) {
          if (err) return done(err);
          if (!postb.isEditable(user, post.id, req.session.pids)) return done(error.newError('NOT_AUTHORIZED'));
          const head = postb.isHead(thread, post);
          async2.waterfall(
            (done) => {
              if (head) {
                postb.checkCategory(user, form.cid, done); // check new cid
              } else {
                done();
              }
            },
            (err) => {
              if (err) return done(err);
              postn.checkForm(form, head, function (err) {
                if (err) return done(err);
                deleteFiles(form, post, function (err) {
                  if (err) return done(err);
                  postn.saveFiles(form, post, function (err) {
                    if (err) return done(err);
                    post.writer = form.writer;
                    post.text = form.text;
                    if (user.admin) {
                      post.visible = form.visible;
                    }
                    postb.packPost(post);
                    db.query('update post set ? where id = ?', [post, post.id], (err) => {
                      if (err) return done(err);
                      async2.waterfall(
                        (done) => {
                          if (head) {
                            thread.cid = form.cid;
                            thread.title = form.title;
                            thread.writer = form.writer;
                            db.query('update thread set ? where id = ?', [thread, thread.id], done);
                          } else {
                            done()
                          }
                        },
                        (err) => {
                          if (err) return done(err);
                          res.json({});
                        }
                      );
                    });
                  });
                });
              });
            }
          );
        });
      });
    });
  });
}));

function deleteFiles(form, post, done) {
  if (!form.dfiles) return done();
  if (!Array.isArray(form.dfiles)) {
    form.dfiles = [form.dfiles];
  }
  const dir = postb.getFileDir(form.pid);
  const deleted = [];
  let i = 0;
  (function del() {
    if (i < form.dfiles.length) {
      const fname = path.basename(form.dfiles[i++]);
      deleted.push(fname);
      fs.unlink(dir + '/' + fname, function (err) {
        if (err && err.code !== 'ENOENT') return done(err);
        setImmediate(del);
      });
      return;
    }
    post.files = post.files.filter(function (file) {
      return deleted.indexOf(file.name) === -1;
    });
    if (!post.files.length) delete post.files;
    done();
  })();
}
