'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const util2 = require('../base/util2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const postb = require('../post/post-base');
var postv = exports;

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
    postb.threads.findOne({ id: tid }, function (err, thread) {
      if (err) return done(err);
      if (!thread) { return done(error('INVALID_THREAD')); }
      postb.checkCategory(user, thread.cid, function (err, category) {
        if (err) return done(err);
        postb.threads.updateOne({ id: tid }, { $inc: { hit: 1 }}, function (err) {
          if (err) return done(err);
          var opt = {
            projection: { tokens: 0 },
            sort: { cdate: 1 }
          };
          var cursor = postb.posts.find({ tid: tid }, opt);
          var posts = [];
          (function read() {
            cursor.next(function (err, post) {
              if (err) return done(err);
              if (post) {
                if (post.visible || user.admin) {
                  postb.addFilesUrl(post);
                  post.editable = postb.isEditable(user, post.id, req.session.pids);
                  post.cdateStr = util2.dateTimeString(post.cdate),
                  post.cdate = post.cdate.getTime(),
                  posts.push(post);
                }
                return setImmediate(read);
              }
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
          })();
        });
      });
    });
  });
}

expb.core.get([ '/post/*', '/threads/*' ], function (req, res, done) {
  res.redirect('/posts/' + req.url.match(/^\/(?:post|threads)\/(.*)/)[1]);
});
