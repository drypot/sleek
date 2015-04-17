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
var postc = exports;

exp.core.get('/posts/new', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var cid = parseInt(req.query.c) || 0;
    res.render('post-create', { cid: cid });
  });
});

exp.core.post('/api/posts', upload.handler(function (req, res, done) {
  createPost(req, res, done);
}));

exp.core.post('/api/posts/:tid([0-9]+)', upload.handler(function (req, res, done) {
  createPost(req, res, done);
}));

function createPost(req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var form = getForm(req);
    var newThread = !form.tid;
    checkForm(form, newThread, function (err) {
      if (err) return done(err);
      utilp.fif(newThread, function (next) {
        var thread = {
          _id : postb.getNewThreadId(),
          cid: form.cid,
          hit: 0,
          length: 1,
          cdate: form.now,
          udate: form.now,
          writer: form.writer,
          title: form.title
        };
        next(thread);
      }, function (next) {
        postb.threads.findOne({ _id: form.tid }, function (err, thread) {
          if (err) return done(err);
          if (!thread) return done(error('INVALID_THREAD'));
          form.cid = thread.cid;
          next(thread);
        });
      }, function (thread) {
        postb.checkCategory(user, form.cid, function (err, category) {
          if (err) return done(err);
          var post = {
            _id: postb.getNewPostId(),
            tid: thread._id,
            cdate: form.now,
            visible: user.admin ? form.visible : true,
            writer: form.writer,
            text: form.text,
            tokens: form.tokens
          };
          saveFiles(form, post, function (err) {
            if (err) return done(err);
            postb.posts.insertOne(post, function (err) {
              if (err) return done(err);
              utilp.fif(newThread, function (next) {
                postb.threads.insertOne(thread, next)
              }, function (next) {
                postb.threads.updateOne({ _id: thread.tid }, { $inc: { length: 1 }, $set: { udate: form.now }}, next);
              }, function (err) {
                if (err) return done(err);
                req.session.pids.push(post._id);
                res.json({
                  tid: thread._id,
                  pid: post._id
                });
                done();
              });
            });
          });
        });
      });
    });
  });
}

var getForm = postc.getForm = function (req) {
  var body = req.body;
  var form = {};
  form.now = new Date();
  form.cid = parseInt(body.cid) || 0;
  form.tid = parseInt(req.params.tid) || 0; // for update and reply
  form.pid = parseInt(req.params.pid) || 0; // for update
  form.writer  = String(body.writer || '').trim();
  form.title = String(body.title || '').trim();
  form.text = String(body.text || '').trim();
  form.visible = body.hasOwnProperty('visible') ? !!body.visible : true;
  form.files = req.files && req.files.files;
  form.dfiles = body.dfiles; // for update
  form.tokens = utilp.tokenize(form.title, form.writer, form.text);
  return form;
};

var checkForm = postc.checkForm = function (form, newThread, done) {
  var errors = [];
  if (newThread) {
    if (!form.title.length) {
      errors.push(error.TITLE_EMPTY);
    }
    if (form.title.length > 128) {
      errors.push(error.TITLE_TOO_LONG);
    }
  }
  if (!form.writer) {
    errors.push(error.WRITER_EMPTY);
  }
  if (form.writer.length > 32) {
    errors.push(error.WRITER_TOO_LONG);
  }
  if (errors.length) {
    done(error(errors));
  } else {
    done();
  }
};

var saveFiles = postc.saveFiles = function (form, post, done) {
  if (!form.files) return done();
  fsp.makeDir(postb.getFileDir(post._id), function (err, dir) {
    if (err) return done(err);
    var saved = []; // 업데이트에서 같은 이름의 파일이 업로드될 수 있으므로 post.files 에 바로 push 하지 않는다.
    var i = 0;
    (function save() {
      if (i < form.files.length) {
        var file = form.files[i++];
        fs.rename(file.path, dir + '/' + file.safeFilename, function (err) {
          if (err) return done(err);
          saved.push({ name: file.safeFilename });
          setImmediate(save);
        });
        return;
      }
      if (post.files) {
        utilp.mergeArray(post.files, saved, function (file1, file2) {
          return file1.name === file2.name;
        });
      } else {
        post.files = saved;
      }
      done();
    })();
  });
};
