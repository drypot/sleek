var fs = require('fs');
var path = require('path');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');
var fsp = require('../base/fs');
var utilp = require('../base/util');
var exp = require('../express/express');
var upload = require('../express/upload');
var userb = require('../user/user-base');
var postb = require('../post/post-base');
var postc = require('../post/post-create');

// api edit view 는 삭제. 앱용 서비스가 아니니 필요 없을 듯.

exp.core.get('/posts/:tid([0-9]+)/:pid([0-9]+/edit)', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var tid = parseInt(req.params.tid) || 0;
    var pid = parseInt(req.params.pid) || 0;
    postb.threads.findOne({ _id : tid }, function (err, thread) {
      if (err) return done(err);
      if (!thread) return done(error('INVALID_THREAD'));
      postb.posts.findOne({ _id: pid }, { fields: { tokens: 0 } }, function (err, post) {
        if (err) return done(err);
        if (!post || post.tid !== thread._id) return done(error('INVALID_POST'));
        postb.checkCategory(user, thread.cid, function (err, category) {
          if (err) return done(err);
          postb.addFileUrls(post);
          post.head = postb.isHead(thread, post);
          post.editable = postb.isEditable(user, post._id, req.session.pids)
          post.cdateStr = utilp.toDateTimeString(post.cdate);
          post.cdate = post.cdate.getTime();
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

exp.core.put('/api/posts/:tid([0-9]+)/:pid([0-9]+)', upload.handler(function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var form = postc.getForm(req);
    postb.threads.findOne({ _id : form.tid }, function (err, thread) {
      if (err) return done(err);
      if (!thread) return done(error('INVALID_THREAD'));
      postb.posts.findOne({ _id: form.pid }, { fields: { tokens: 0 } }, function (err, post) {
        if (err) return done(err);
        if (!post || post.tid !== thread._id) return done(error('INVALID_POST'));
        postb.checkCategory(user, thread.cid, function (err, category) {
          if (err) return done(err);
          if (!postb.isEditable(user, post._id, req.session.pids)) return done(error('NOT_AUTHORIZED'));
          var head = postb.isHead(thread, post);
          utilp.fif(head, function (next) {
            postb.checkCategory(user, form.cid, next); // check new cid
          }, function (err) {
            if (err) return done(err);
            postc.checkForm(form, head, function (err) {
              if (err) return done(err);
              deleteFiles(form, post, function (err) {
                if (err) return done(err);
                postc.saveFiles(form, post, function (err) {
                  if (err) return done(err);
                  post.writer = form.writer;
                  post.text = form.text;
                  post.tokens = form.tokens;
                  if (user.admin) {
                    post.visible = form.visible;
                  }
                  postb.posts.save(post, function (err) {
                    if (err) return done(err);
                    utilp.fif(head, function (next) {
                      thread.cid = form.cid;
                      thread.title = form.title;
                      thread.writer = form.writer;
                      postb.threads.save(thread, next);
                    }, function (err) {
                      if (err) return done(err);
                      res.json({});
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}));

function deleteFiles(form, post, done) {
  if (!form.dfiles) return done();
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
