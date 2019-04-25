'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const util2 = require('../base/array2');
const mongo2 = require('../mongo/mongo2');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const postb = require('../post/post-base');

var copy = function (done) {
  var count = 0;
  var threads = postb.threads.find();
  (function readt() {
    threads.next(function (err, thread) {
      if (err) return done(err);
      if (thread) {
        var posts = postb.posts.find({ tid: thread.id });
        (function readp() {
          posts.next(function (err, post) {
            if (err) return done(err);
            if (post) {
              var head = postb.isHead(thread, post);
              var tokens = token2.tokenize(head ? thread.title : '', post.writer, post.text);
              postb.posts.updateOne({ id: post.id }, { $set: { tokens: tokens } }, function (err) {
                if (err) return done(err);
                count++;
                if (count % 1000 === 0) {
                  process.stdout.write(count + ' ');
                }
                setImmediate(readp);
              });
              return;
            }
            setImmediate(readt);
          });
        })();
        return;
      }
      done();
    });
  })();
};

init.run(function (err) {
  console.log('start migration from mongodb to mysql.');
  postb.rebuildTokens(function (err) {
    if (err) throw err;
    mongo.db.close(function (err) {
      if (err) throw err;
      console.log('done');
    })
  });
});
