
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

exp.core.get('/threads/:tid([0-9]+)', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var tid = parseInt(req.params.tid) || 0;
    post.findThreadAndPosts(user, tid, req.session.posts, function (err, category, thread, posts) {
      if (err) return done(err);
      res.render('thread-view', {
        category: category,
        thread: thread,
        posts: posts
      });
    });
  });
});

var postSuffixRe = /^\/post\/(.*)/;

exp.core.get('/post/*', function (req, res, done) {
  var tid = parseInt(req.params.tid) || 0;
  res.redirect('/threads/' + req.url.match(postSuffixRe)[1]);
});

exports.updateThreadHit = function (tid, done) {
  threads.update({ _id: tid }, { $inc: { hit: 1 }}, done);
};

exports.findThread = function (id, done) {
  threads.findOne({ _id: id }, done);
};

exports.findPost = function (pid, done) {
  var opt = {
    fields: { tokens: 0 }
  };
  posts.findOne({ _id: pid }, opt, done);
};

exports.findPostsByThread = function (tid) {
  var opt = {
    fields: { tokens: 0 },
    sort: { cdate: 1 }
  };
  return posts.find({ tid: tid }, opt);
};


exports.findThreadAndPosts = function (user, tid, editables, done) {
  findThread(tid, function (err, thread) {
    if (err) return done(err);
    categoryForRead(user, thread.cid, function (err, category) {
      if (err) return done(err);
      mongo.updateThreadHit(tid, function (err) {
        if (err) return done(err);
        var posts = [];
        var cursor = mongo.findPostsByThread(tid);
        function read() {
          cursor.nextObject(function (err, post) {
            if (err) return done(err);
            if (post) {
              if (post.visible || user.admin) {
                addFileUrls(post);
                post.editable = isEditable(user, post._id, editables);
                post.cdateStr = dt.format(post.cdate),
                post.cdate = post.cdate.getTime(),
                posts.push(post);
              }
              setImmediate(read);
              return;
            }
            done(null, category, thread, posts);
          });
        }
        read();
      });
    });
  });
};

exports.findThreadAndPost = function (user, tid, pid, editables, done) {
  findThread(tid, function (err, thread) {
    if (err) return done(err);
    findPost(thread, pid, function (err, post) {
      if (err) return done(err);
      categoryForRead(user, thread.cid, function (err, category) {
        if (err) return done(err);
        addFileUrls(post);
        post.head = isHead(thread, post);
        post.editable = isEditable(user, post._id, editables)
        post.cdateStr = dt.format(post.cdate);
        post.cdate = post.cdate.getTime();
        done(null, category, thread, post);
      });
    });
  });
};

function findThread(tid, done) {
  mongo.findThread(tid, function (err, thread) {
    if (err) {
      return done(err);
    }
    if (!thread) {
      return done(error('INVALID_THREAD'));
    }
    done(null, thread);
  });
}

function findPost(thread, pid, done) {
  mongo.findPost(pid, function (err, post) {
    if (err) {
      return done(err);
    }
    if (!post || post.tid !== thread._id) {
      return done(error('INVALID_POST'));
    }
    done(null, post);
  });
}

function addFileUrls(post) {
  if (post.files) {
    for (var i = 0; i < post.files.length; i++) {
      var file = post.files[i];
      file.url = exports.getFileUrl(post._id, file.name);
    }
  }
}