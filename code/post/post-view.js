import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as date2 from "../base/date2.js";
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as userb from "../user/user-base.js";
import * as postb from "../post/post-base.js";

expb.core.get('/posts/:tid([0-9]+)', function (req, res, done) {
  view(req, res, false, done);
});

expb.core.get('/api/posts/:tid([0-9]+)', function (req, res, done) {
  view(req, res, true, done);
});

function view(req, res, api, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    const tid = parseInt(req.params.tid) || 0;
    db.queryOne('select * from thread where id = ?', tid, (err, thread) => {
      if (err) return done(err);
      if (!thread) { return done(error.newError('INVALID_THREAD')); }
      postb.checkCategory(user, thread.cid, function (err, category) {
        if (err) return done(err);
        db.query('update thread set hit = hit + 1 where id = ?', tid, (err) => {
          if (err) return done(err);
          db.query('select * from post where tid = ? order by cdate', tid, (err, r) => {
            const posts = [];
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
