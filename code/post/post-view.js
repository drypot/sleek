'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const date2 = require('../base/date2');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const postb = require('../post/post-base');
const postv = exports;

expb.core.get('/posts/:tid([0-9]+)', function (req, res, done) {
  view(req, res, false, done);
});

expb.core.get('/api/posts/:tid([0-9]+)', function (req, res, done) {
  view(req, res, true, done);
});

function view(req, res, api, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var tid = parseInt(req.params.tid) || 0;
    mysql2.queryOne('select * from thread where id = ?', tid, (err, thread) => {
      if (err) return done(err);
      if (!thread) { return done(error('INVALID_THREAD')); }
      postb.checkCategory(user, thread.cid, function (err, category) {
        if (err) return done(err);
        mysql2.query('update thread set hit = hit + 1 where id = ?', tid, (err) => {
          if (err) return done(err);
          mysql2.query('select * from post where tid = ? order by cdate', tid, (err, r) => {
            var posts = [];
            r.forEach((post) => {
              postb.unpackPost(post);
              if (post.visible || user.admin) {
                postb.addFilesUrl(post);
                post.editable = postb.isEditable(user, post.id, req.session.pids);
                post.cdateStr = date2.dateTimeString(post.cdate),
                post.cdate = post.cdate.getTime(),
                posts.push(post);
              }         
            });
            if (api) {
              res.json({
                thread: { id: thread.id, title: thread.title },
                category: { id: category.id },
                posts: posts
              });
            } else {
              res.render('post/post-view', {
                thread: thread,
                category: category,
                posts: posts
              });
            }
          });
        });
      });
    });
  });
}

expb.core.get([ '/post/*', '/threads/*' ], function (req, res, done) {
  res.redirect('/posts/' + req.url.match(/^\/(?:post|threads)\/(.*)/)[1]);
});
