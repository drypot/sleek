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

exp.core.post('/api/posts', upload.handler(function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var form = getForm(req);
    form.head = true;
    postb.checkCategory(user, form.cid, function (err, category) {
      if (err) return done(err);
      checkForm(form, function (err) {
        if (err) return done(err);
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
          postb.threads.insertOne(thread, function (err) {
            if (err) return done(err);
            postb.posts.insertOne(post, function (err) {
              if (err) return done(err);
              req.session.posts.push(post._id);
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
}));

exp.core.post('/api/posts/:tid([0-9]+)', upload.handler(function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var form = getForm(req);
    var tid = parseInt(req.params.tid) || 0;
    form.head = false;
    postb.threads.findOne({ _id: tid }, function (err, thread) {
      if (err) return done(err);
      postb.checkCategory(user, thread.cid, function (err, category) {
        if (err) return done(err);
        checkForm(form, function (err) {
          if (err) return done(err);
          var post = {
            _id: postb.getNewPostId(),
            tid: tid,
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
              postb.threads.updateOne({ _id: tid }, { $inc: { length: 1 }, $set: { udate: form.now }}, function (err) {
                if (err) return done(err);
                req.session.posts.push(post._id);
                res.json({
                  tid: tid,
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
}));

var getForm = postc.getForm = function (req) {
  var body = req.body;
  var form = {};
  form.now = new Date();
  form.cid = parseInt(body.cid) || 0;
  form.writer  = String(body.writer || '').trim();
  form.title = String(body.title || '').trim();
  form.text = String(body.text || '').trim();
  form.visible = body.hasOwnProperty('visible') ? !!body.visible : true;
  form.files = req.files && req.files.files; // json 리퀘스트의 경우 files 기본값 세팅이 안 된다.
  form.dfiles = body.dfiles;
  form.tokens = utilp.tokenize(form.title, form.writer, form.text);
  return form;
};

var checkForm = postc.checkForm = function (form, done) {
  var errors = [];
  if (form.head) {
    if (!form.title.length) {
      errors.push(error.FILL_TITLE);
    }
    if (form.title.length > 128) {
      errors.push(error.TITLE_TOO_LONG);
    }
  }
  if (!form.writer) {
    errors.push(error.FILL_WRITER);
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
  if (form.files) {
    fsp.makrDir(postb.getFileDir(post._id), function (err, dir) {
      if (err) return done(err);
      var i = 0;
      post.files = [];
      (function save() {
        if (i == form.files.length) {
          return done(null);
        }
        var file = form.files[i++];
        fs.rename(file.path, dir + '/' + file.safeFilename, function (err) {
          if (err) return done(err);
          post.files.push({ name: safeName });
          setImmediate(save);
        });
      })();
    });
  } else {
    done();
  }
};

exp.core.get('/posts/new', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var cid = parseInt(req.query.c) || 0;
    res.render('post-create', { cid: cid });
  });
});
