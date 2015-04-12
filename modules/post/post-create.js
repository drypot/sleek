var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');
var fsp = require('../base/fs');
var exp = require('../express/express');
var upload = require('../express/upload');
var userb = require('../user/user-base');
var postb = require('../post/post-base');
var postc = exports;

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

exp.core.get('/threads/new', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return res.renderErr(err);
    var cid = parseInt(req.query.c) || 0;
    res.render('thread-new', { cid: cid });
  });
});

exports.insertThread = function (thread, done) {
  threads.insert(thread, done);
};

exports.updateThreadLength = function (tid, now, done) {
  threads.update({ _id: tid }, { $inc: { length: 1 }, $set: { udate: now }}, done);
};

exports.insertPost = function (post, done) {
  posts.insert(post, done);
};

exports.makeForm = function (req) {
  var body = req.body;
  var form = {};
  form.now = new Date();
  form.cid = parseInt(body.cid) || 0;
  form.writer  = String(body.writer || '').trim();
  form.title = String(body.title || '').trim();
  form.text = String(body.text || '').trim();
  form.visible = body.hasOwnProperty('visible') ? !!body.visible : true;
  form.files = body.files;
  form.dfiles = body.dfiles;
  return form;
};

exports.createThread = function (user, form, done) {
  categoryForUpdate(user, form.cid, function (err, category) {
    if (err) return done(err);
    checkForm(form, true, function (err) {
      if (err) return done(err);
      var tid = mongo.getNewThreadId();
      var pid = mongo.getNewPostId();
      saveFiles(pid, form.files, function (err, saved) {
        if (err) return done(err);
        insertThread(tid, form, function (err, thread) {
          if (err) return done(err);
          insertPost(pid, thread, user, form, saved, function (err) {
            if (err) return done(err);
            done(null, tid, pid);
          });
        });
      });
    });
  });
}

exports.createReply = function (user, form, done) {
  findThread(form.tid, function (err, thread) {
    if (err) return done(err);
    categoryForUpdate(user, thread.cid, function (err, category) {
      if (err) return done(err);
      checkForm(form, false, function (err) {
        if (err) return done(err);
        var pid = mongo.getNewPostId();
        saveFiles(pid, form.files, function (err, saved) {
          if (err) return done(err);
          insertPost(pid, thread, user, form, saved, function (err) {
            if (err) return done(err);
            mongo.updateThreadLength(thread._id, form.now, function (err) {
              if (err) return done(err);
              done(null, pid);
            });
          });
        });
      });
    });
  });
};

function checkForm(form, head, done) {
  var errors = new error.Errors();

  if (head) {
    if (!form.title.length) {
      errors.add('title', error.msg.FILL_TITLE);
    }
    if (form.title.length > 128) {
      errors.add('title', error.msg.TITLE_TOO_LONG);
    }
  }
  if (!form.writer) {
    errors.add('writer', error.msg.FILL_WRITER);
  }
  if (form.writer.length > 32) {
    errors.add('writer', error.msg.WRITER_TOO_LONG);
  }
  if (errors.hasErrors()) {
    return done(error(errors));
  }

  done();
}

function saveFiles (pid, files, done) {
  if (files) {
    fsp.makrDir(exports.getFileDir(pid), function (err, dir) {
      if (err) return done(err);
      var saved = [];
      var i = 0;
      function save() {
        if (i == files.length) {
          return done(null, saved);
        }
        var file = files[i++];
        var safeName = fsp.safeFilename(path.basename(file.oname));
        fs.rename(upload.getTmpPath(file.tname), dir + '/' + safeName, function (err) {
          if (err) {
            if (err.code !== 'ENOENT') return done(err);
          } else {
            saved.push({ name: safeName });
          }
          setImmediate(save);
        });
      }
      save();
    });
    return;
  }
  done();
}

function insertThread(tid, form, done) {
  var thread = {
    _id : tid,
    cid: form.cid,
    hit: 0,
    length: 1,
    cdate: form.now,
    udate: form.now,
    writer: form.writer,
    title: form.title
  };
  mongo.insertThread(thread, function (err) {
    if (err) return done(err);
    done(null, thread);
  });
}

function insertPost(pid, thread, user, form, saved, done) {
  var post = {
    _id: pid,
    tid: thread._id,
    cdate: form.now,
    visible: user.admin ? form.visible : true,
    writer: form.writer,
    text: form.text
  };
  if (saved) {
    post.files = saved;
  }
  setTokens(thread, post);
  mongo.insertPost(post, done);
}

function setTokens (thread, post) {
  if (isHead(thread, post)) {
    post.tokens = tokenize(thread.title, post.writer, post.text);
  } else {
    post.tokens = tokenize(post.writer, post.text);
  }
}
