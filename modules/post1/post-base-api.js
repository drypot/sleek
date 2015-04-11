var init = require('../base/init');
var post = require('../post/post-base');
var exp = require('../main/express');

init.add(function () {
  exp.core.get('/api/threads', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      var params = post.makeThreadsParams(req);
      if (params.cid) {
        post.findThreadsByCategory(user, params, function (err, category, threads, last) {
          if (err) return done(err);
          res.json({
            threads: threads,
            last: last
          });
        });
      } else {
        post.findThreads(user, params, function (err, threads, last) {
          if (err) return done(err);
          res.json({
            threads: threads,
            last: last
          });
        });
      }
    });
  });

  exp.core.get('/api/threads/:tid([0-9]+)', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      var tid = parseInt(req.params.tid) || 0;
      post.findThreadAndPosts(user, tid, req.session.posts, function (err, category, thread, posts) {
        if (err) return done(err);
        res.json({
          thread: {
            _id: thread._id,
            title: thread.title
          },
          category: {
            id: category.id
          },
          posts: posts
        });
      });
    });
  });

  exp.core.get('/api/threads/:tid([0-9]+)/:pid([0-9]+)', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      var tid = parseInt(req.params.tid) || 0;
      var pid = parseInt(req.params.pid) || 0;
      post.findThreadAndPost(user, tid, pid, req.session.posts, function (err, category, thread, post) {
        if (err) return done(err);
        res.json({
          thread: {
            _id: thread._id,
            title: thread.title
          },
          category: {
            id: category.id
          },
          post: post
        });
      });
    });
  });

  exp.core.post('/api/threads', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      var form = post.makeForm(req);
      post.createThread(user, form, function (err, tid, pid) {
        if (err) return done(err);
        req.session.posts.push(pid);
        res.json({
          tid: tid,
          pid: pid
        });
      });
    });
  });

  exp.core.post('/api/threads/:tid([0-9]+)', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      var form = post.makeForm(req);
      var tid = form.tid = parseInt(req.params.tid) || 0;
      post.createReply(user, form, function (err, pid) {
        if (err) return done(err);
        req.session.posts.push(pid);
        res.json({
          tid: tid,
          pid: pid
        });
      });
    });
  });

  exp.core.put('/api/threads/:tid([0-9]+)/:pid([0-9]+)', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      var form = post.makeForm(req);
      form.tid = parseInt(req.params.tid) || 0;
      form.pid = parseInt(req.params.pid) || 0;
      post.updatePost(user, form, req.session.posts, function (err) {
        if (err) return done(err);
        res.json({});
      });
    });
  });

});
