var fs = require('fs');

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

exp.core.put('/api/threads/:tid([0-9]+)/:pid([0-9]+)', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var form = postc.getForm(req);
    form.tid = parseInt(req.params.tid) || 0;
    form.pid = parseInt(req.params.pid) || 0;
    post.updatePost(user, form, req.session.posts, function (err) {
      if (err) return done(err);
      res.json({});
    });
  });
});

exp.core.get('/threads/:tid([0-9]+)/:pid([0-9]+/edit)', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var tid = parseInt(req.params.tid) || 0;
    var pid = parseInt(req.params.pid) || 0;
    post.findThreadAndPost(user, tid, pid, req.session.posts, function (err, category, thread, post) {
      if (err) return done(err);
      res.render('thread-edit', {
        thread: thread,
        category: category,
        post: post
      });
    });
  });
});

exports.updateThread = function (thread, done) {
  threads.save(thread, done);
};

exports.updatePost = function (post, done) {
  posts.save(post, done);
};

exports.updatePost = function (user, form, editables, done) {
  findThread(form.tid, function (err, thread) {
    if (err) return done(err);
    findPost(thread, form.pid, function (err, post) {
      if (err) return done(err);
      checkCategory(user, thread.cid, function (err, category) {
        if (err) return done(err);
        if (!isEditable(user, post._id, editables)) {
          return done(error('NOT_AUTHORIZED'));
        }
        var head = isHead(thread, post);
        checkNewCategory(user, form.cid, head, function (err) {
          if (err) return done(err);
          checkForm(form, head, function (err) {
            if (err) return done(err);
            deleteFiles(post._id, form.dfiles, function (err, deleted) {
              if (err) return done(err);
              saveFiles(post._id, form.files, function (err, saved) {
                if (err) return done(err);
                updatePost(thread, post, user, form, deleted, saved, done);
              });
            });
          });
        });
      });
    });
  });
};

function deleteFiles(pid, files, done) {
  if (files) {
    var dir = exports.getFileDir(pid);
    var deleted = [];
    var i = 0;
    function del() {
      if (i == files.length) {
        return done(null, deleted);
      }
      var file = files[i++];
      var name = path.basename(file);
      var p = dir + '/' + name;
      fs.unlink(p, function (err) {
        if (err && err.code !== 'ENOENT') return done(err);
        deleted.push(name);
        setImmediate(del);
      });
    }
    del();
    return;
  }
  done();
}

function updatePost(thread, post, user, form, deleted, saved, done) {
  updateThread(function (err) {
    if (err) return done(err);
    post.writer = form.writer;
    post.text = form.text;
    if (user.admin) {
      post.visible = form.visible;
    }
    if (deleted && post.files) {
      post.files = post.files.filter(function (file) {
        return deleted.indexOf(file.name) == -1;
      });
      if (post.files.length == 0) delete post.files;
    }
    if (saved) {
      if (post.files) {
        utilp.mergeArray(post.files, saved, function (file1, file2) {
          return file1.name === file2.name;
        });
      } else {
        post.files = saved;
      }
    }
    setTokens(thread, post);
    mongo.updatePost(post, done);
  });

  function updateThread(done) {
    if (isHead(thread, post)) {
      thread.cid = form.cid;
      thread.title = form.title;
      thread.writer = form.writer;
      mongo.updateThread(thread, done);
    } else {
      done();
    }
  }
}

function isHead(thread, post) {
  return thread.cdate.getTime() === post.cdate.getTime();
}

function isEditable(user, pid, editables) {
  return !!(user.admin || (editables && (editables.indexOf(pid) !== -1)));
}
