var init = require('../base/init');
var post = require('../post/post-base');
var express = require('../main/express');
var UrlMaker = require('../main/UrlMaker');

init.add(function () {

  var app = express.app;

  console.log('post-html:');

  app.get('/threads', function (req, res, done) {
    req.findUser(function (err, user) {
      if (err) return res.renderErr(err);
      var params = post.makeThreadsParams(req);
      if (params.cid) {
        post.findThreadsByCategory(user, params, function (err, category, threads, last) {
          if (err) return res.renderErr(err);
          prevNext(params, last, function (prevUrl, nextUrl) {
            res.render('thread-list', {
              category: category,
              threads: threads,
              prevUrl: prevUrl,
              nextUrl: nextUrl
            });
          });
        });
      } else {
        post.findThreads(user, params, function (err, threads, last) {
          if (err) return res.renderErr(err);
          prevNext(params, last, function (prevUrl, nextUrl) {
            res.render('thread-list', {
              category: {
                id: 0,
                name: 'all'
              },
              threads: threads,
              prevUrl: prevUrl,
              nextUrl: nextUrl
            });
          });
        });
      }
    });
  });

  function prevNext(params, last, done) {
    var prevUrl, nextUrl;
    var url;
    if (params.pg > 1) {
      url = new UrlMaker('/threads')
      url.add('c', params.cid, 0);
      url.add('pg', params.pg - 1, 1);
      prevUrl = url.toString();
    }
    if (!last) {
      url = new UrlMaker('/threads');
      url.add('c', params.cid, 0);
      url.add('pg', params.pg + 1, 1);
      nextUrl = url.toString();
    }
    done(prevUrl, nextUrl);
  }

  app.get('/threads/:tid([0-9]+)', function (req, res, done) {
    req.findUser(function (err, user) {
      if (err) return res.renderErr(err);
      var tid = parseInt(req.params.tid) || 0;
      post.findThreadAndPosts(user, tid, req.session.posts, function (err, category, thread, posts) {
        if (err) return res.renderErr(err);
        res.render('thread-view', {
          category: category,
          thread: thread,
          posts: posts
        });
      });
    });
  });

  var postSuffixRe = /^\/post\/(.*)/;

  app.get('/post/*', function (req, res, done) {
    var tid = parseInt(req.params.tid) || 0;
    res.redirect('/threads/' + req.url.match(postSuffixRe)[1]);
  });

  app.get('/threads/new', function (req, res, done) {
    req.findUser(function (err, user) {
      if (err) return res.renderErr(err);
      var cid = parseInt(req.query.c) || 0;
      res.render('thread-new', { cid: cid });
    });
  });

  app.get('/threads/:tid([0-9]+)/:pid([0-9]+/edit)', function (req, res, done) {
    req.findUser(function (err, user) {
      if (err) return res.renderErr(err);
      var tid = parseInt(req.params.tid) || 0;
      var pid = parseInt(req.params.pid) || 0;
      post.findThreadAndPost(user, tid, pid, req.session.posts, function (err, category, thread, post) {
        if (err) return res.renderErr(err);
        res.render('thread-edit', {
          thread: thread,
          category: category,
          post: post
        });
      });
    });
  });

});