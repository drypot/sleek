var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');
var utilp = require('../base/util');
var exp = require('../express/express');
var userb = require('../user/user-base');
var postb = require('../post/post-base');
var postv = exports;

exp.core.get('/posts/:tid([0-9]+)', function (req, res, done) {
  view(req, res, false, done);
});

exp.core.get('/api/posts/:tid([0-9]+)', function (req, res, done) {
  view(req, res, true, done);
});

function view(req, res, api, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var tid = parseInt(req.params.tid) || 0;
    postb.threads.findOne({ _id: tid }, function (err, thread) {
      if (err) return done(err);
      if (!thread) { return done(error('INVALID_THREAD')); }
      postb.checkCategory(user, thread.cid, function (err, category) {
        if (err) return done(err);
        postb.threads.update({ _id: tid }, { $inc: { hit: 1 }}, function (err) {
          if (err) return done(err);
          var opt = {
            fields: { tokens: 0 },
            sort: { cdate: 1 }
          };
          var cursor = postb.posts.find({ tid: tid }, opt);
          var posts = [];
          (function read() {
            cursor.nextObject(function (err, post) {
              if (err) return done(err);
              if (post) {
                if (post.visible || user.admin) {
                  postb.addFileUrls(post);
                  post.editable = postb.isEditable(user, post._id, req.session.pids);
                  post.cdateStr = utilp.toDateTimeString(post.cdate),
                  post.cdate = post.cdate.getTime(),
                  posts.push(post);
                }
                return setImmediate(read);
              }
              if (api) {
                res.json({
                  thread: { _id: thread._id, title: thread.title },
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

exp.core.get([ '/post/*', '/threads/*' ], function (req, res, done) {
  res.redirect('/posts/' + req.url.match(/^\/(?:post|threads)\/(.*)/)[1]);
});
