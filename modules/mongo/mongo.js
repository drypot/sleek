var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;

var init = require('../base/init');
var config = require('../base/config');

var opt = {};

exports = module.exports = function (_opt) {
  for(var p in _opt) {
    opt[p] = _opt[p];
  }
  return exports;
};

init.add(function (done) {

  var log = 'mongo:';

  openDb(function (err, db) {
    if (err) return done(err);
    dropDatabase(db, function (err) {
      if (err) return done(err);
      initThread(db, function (err) {
        if (err) return done(err);
        initPost(db, function (err) {
          console.log(log);
          done(err);
        });
      });
    });
  });

  function openDb(done) {
    var server = new Server('localhost', 27017, { auto_reconnect: true } );
    var client = new MongoClient(server);
    client.open(function (err) {
      if (err) return done(err);
      var db = exports.db = client.db(config.data.mongoDb);
      log += ' ' + db.databaseName;
      if (config.data.mongoUser) {
        log += ' auth-database';
        db.authenticate(config.data.mongoUser, config.data.mongoPassword, function(err, res) {
          if (err) return done(err);
          done(null, db);
        });
        return;
      }
      done(null, db);
    });
  }

  function dropDatabase(db, done) {
    if (opt.dropDatabase) {
      log += ' drop-database';
      db.dropDatabase(done);
    } else {
      done();
    }
  }

  function initThread(db, done) {
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
  }

  function initPost(db, done) {
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
  }

});
