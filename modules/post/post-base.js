var fs = require('fs');
var path = require('path');

var util2 = require('../base/util');
var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');
var error = require('../base/error');
var dt = require('../base/dt');
var fs2 = require('../base/fs');
var tokenize = require('../search/tokenizer').tokenize;
var mongo = require('../mongo/mongo');
var upload = require('../upload/upload');

init.add(function () {
// msg[exports.INVALID_CATEGORY] = '정상적인 카테고리가 아닙니다.';
// msg[exports.INVALID_THREAD] = '정상적인 글줄이 아닙니다.';
// msg[exports.INVALID_POST] = '정상적인 글이 아닙니다.';

// msg.FILL_TITLE = '제목을 입력해 주십시오.';
// msg.SHORTEN_TITLE = '제목을 줄여 주십시오.';
// msg.FILL_WRITER = '필명을 입력해 주십시오.';
// msg.SHORTEN_WRITER = '필명을 줄여 주십시오.';
});

init.add(function (done) {
  var threads;
  var tidSeed;

  exports.getNewThreadId = function () {
    return ++tidSeed;
  };

  exports.insertThread = function (thread, done) {
    threads.insert(thread, done);
  };

  exports.updateThread = function (thread, done) {
    threads.save(thread, done);
  };

  exports.updateThreadHit = function (tid, done) {
    threads.update({ _id: tid }, { $inc: { hit: 1 }}, done);
  };

  exports.updateThreadLength = function (tid, now, done) {
    threads.update({ _id: tid }, { $inc: { length: 1 }, $set: { udate: now }}, done);
  };

  exports.findThread = function (id, done) {
    threads.findOne({ _id: id }, done);
  };

  exports.findThreads = function (pg, pgsize) {
    return threads.find({}).sort({ udate: -1 }).skip((Math.abs(pg) - 1) * pgsize).limit(pgsize);
  };

  exports.findThreadsByCategory = function (cid, pg, pgsize) {
    return threads.find({ cid: cid }).sort({ udate: -1 }).skip((Math.abs(pg) - 1) * pgsize).limit(pgsize);
  };

  threads = exports.threads = db.collection("threads");
  threads.ensureIndex({ cid: 1, udate: -1 }, function (err) {
    if (err) return done(err);
    threads.ensureIndex({ udate: -1 }, function (err) {
      if (err) return done(err);
      threads.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
        if (err) return done(err);
        tidSeed = obj ? obj._id : 0;
        console.log('thread id seed: ' + tidSeed);
        done();
      });
    });
  });
});

init.add(function (done) {
  var posts;
  var pidSeed;

  exports.getNewPostId = function () {
    return ++pidSeed;
  };

  exports.insertPost = function (post, done) {
    posts.insert(post, done);
  };

  exports.updatePost = function (post, done) {
    posts.save(post, done);
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

  exports.searchPosts = function (tokens, pg, pgsize, done) {
    var opt = {
      fields: { tokens: 0 },
      skip: (pg - 1) * pgsize,
      sort: { cdate: -1 },
      limit: pgsize
    };
    return posts.find({ tokens: { $all: tokens } }, opt);
  }

  posts = exports.posts = db.collection("posts");
  posts.ensureIndex({ tid: 1, cdate: 1 }, function (err) {
    if (err) return done(err);
    posts.ensureIndex({ tokens: 1 }, function (err) {
      if (err) return done(err);
      posts.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
        if (err) return done(err);
        pidSeed = obj ? obj._id : 0;
        console.log('post id seed: ' + pidSeed);
        done();
      });
    });
  });
});

init.add(function () {



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

  exports.updatePost = function (user, form, editables, done) {
    findThread(form.tid, function (err, thread) {
      if (err) return done(err);
      findPost(thread, form.pid, function (err, post) {
        if (err) return done(err);
        categoryForUpdate(user, thread.cid, function (err, category) {
          if (err) return done(err);
          if (!isEditable(user, post._id, editables)) {
            return done(error(error.NOT_AUTHORIZED));
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

  exports.makeThreadsParams = function (req) {
    var query = req.query;
    var params = {};
    params.cid = parseInt(query.c) || 0;
    var pg = parseInt(query.pg) || 1;
    params.pg = pg < 1 ? 1 : pg;
    var pgsize = parseInt(query.ps) || 16;
    params.pgsize = pgsize > 128 ? 128 : pgsize < 1 ? 1 : pgsize;
    return params;
  }

  exports.findThreads = function (user, params, done) {
    var categoryIndex = user.categoryIndex;
    var threads = [];
    var count = 0;
    var cursor = mongo.findThreads(params.pg, params.pgsize);
    function read() {
      cursor.nextObject(function (err, thread) {
        if (err) return done(err);
        if (thread) {
          count++;
          var c = categoryIndex[thread.cid];
          if (c) {
            thread.category = {
              id: c.id,
              name: c.name
            };
            thread.udateStr = dt.format(thread.udate),
            thread.udate = thread.udate.getTime(),
            threads.push(thread);
          }
          setImmediate(read);
          return;
        }
        done(null, threads, count !== params.pgsize);
      });
    }
    read();
  };

  exports.findThreadsByCategory = function (user, params, done) {
    categoryForRead(user, params.cid, function (err, category) {
      if (err) return done(err);
      var categoryIndex = user.categoryIndex;
      var threads = [];
      var count = 0;
      var cursor = mongo.findThreadsByCategory(params.cid, params.pg, params.pgsize);
      function read() {
        cursor.nextObject(function (err, thread) {
          if (err) return done(err);
          if (thread) {
            count++;
            thread.udateStr = dt.format(thread.udate),
            thread.udate = thread.udate.getTime(),
            threads.push(thread);
            setImmediate(read);
            return;
          }
          done(null, category, threads, count !== params.pgsize);
        });
      }
      read();
    });
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

  function checkForm(form, head, done) {
    var errors = new error.Errors();

    if (head) {
      if (!form.title.length) {
        errors.add('title', error.msg.FILL_TITLE);
      }
      if (form.title.length > 128) {
        errors.add('title', error.msg.SHORTEN_TITLE);
      }
    }
    if (!form.writer) {
      errors.add('writer', error.msg.FILL_WRITER);
    }
    if (form.writer.length > 32) {
      errors.add('writer', error.msg.SHORTEN_WRITER);
    }
    if (errors.hasErrors()) {
      return done(error(errors));
    }

    done();
  }

  function categoryForUpdate(user, cid, done) {
    var category = user.categoryIndex[cid];
    if (!category) {
      return done(error(error.INVALID_CATEGORY));
    }
    done(null, category);
  }

  function categoryForRead(user, cid, done) {
    var category = user.categoryIndex[cid];
    if (!category) {
      return done(error(error.INVALID_CATEGORY));
    }
    done(null, category);
  }

  function checkNewCategory(user, cid, head, done) {
    if (head) {
      categoryForUpdate(user, cid, done);
    } else {
      done();
    }
  }

  function findThread(tid, done) {
    mongo.findThread(tid, function (err, thread) {
      if (err) {
        return done(err);
      }
      if (!thread) {
        return done(error(error.INVALID_THREAD));
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
        return done(error(error.INVALID_POST));
      }
      done(null, post);
    });
  }

  exports.getFilePath = function (pid, fname) {
    return upload.pubPost + '/' + Math.floor(pid / 10000) + '/' + pid + (fname ? '/' + fname : '');
  };

  exports.getFileUrl = function (pid, fname) {
    return config.uploadSite + '/post/' + Math.floor(pid / 10000) + '/' + pid + '/' + encodeURIComponent(fname);
  }

  function addFileUrls(post) {
    if (post.files) {
      for (var i = 0; i < post.files.length; i++) {
        var file = post.files[i];
        file.url = exports.getFileUrl(post._id, file.name);
      }
    }
  }

  function saveFiles (pid, files, done) {
    if (files) {
      fs2.makeDirs(exports.getFilePath(pid), function (err, dir) {
        if (err) return done(err);
        var saved = [];
        var i = 0;
        function save() {
          if (i == files.length) {
            return done(null, saved);
          }
          var file = files[i++];
          var safeName = fs2.safeFilename(path.basename(file.oname));
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

  function deleteFiles(pid, files, done) {
    if (files) {
      var dir = exports.getFilePath(pid);
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
          util2.mergeArray(post.files, saved, function (file1, file2) {
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

  function setTokens (thread, post) {
    if (isHead(thread, post)) {
      post.tokens = tokenize(thread.title, post.writer, post.text);
    } else {
      post.tokens = tokenize(post.writer, post.text);
    }
  }

  exports.rebuildTokens = function (done) {
    var count = 0;
    var threads = mongo.threads.find();

    function readThread() {
      threads.nextObject(function (err, thread) {
        if (err) return done(err);
        if (thread) {
          var posts = mongo.posts.find({ tid: thread._id });
          function readPost() {
            posts.nextObject(function (err, post) {
              if (err) return done(err);
              if (post) {
                setTokens(thread, post);
                mongo.posts.update({ _id: post._id }, { $set: { tokens: post.tokens } }, function (err) {
                  if (err) return done(err);
                  count++;
                  if (count % 1000 === 0) {
                    process.stdout.write(count + ' ');
                  }
                  setImmediate(readPost);
                });
                return;
              }
              setImmediate(readThread);
            });
          }
          readPost();
          return;
        }
        done();
      });
    }
    readThread();
  }

});