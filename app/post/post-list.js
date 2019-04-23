'use strict';

const init = require('../base/init');
const error = require('../base/error');
const util2 = require('../base/util2');
const config = require('../base/config');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const postb = require('../post/post-base');
var postl = exports;

expb.core.get('/', function (req, res, done) {
  res.redirect('/posts');
});

expb.core.get('/posts', function (req, res, done) {
  getThreads(req, res, false, done);
});

expb.core.get('/api/posts', function (req, res, done) {
  getThreads(req, res, true, done);
});

function getThreads(req, res, api, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var cid = parseInt(req.query.c) || 0;
    var pg = Math.max(parseInt(req.query.pg) || 1, 1);
    var pgsize = Math.min(Math.max(parseInt(req.query.ps) || 16, 1), 128);
    util2.fif(cid, function (next) {
      postb.checkCategory(user, cid, function (err, category) {
        if (err) return done(err);
        next(
          category,
          postb.threads.find({ cid: cid }).sort({ udate: -1 }).skip((pg - 1) * pgsize).limit(pgsize)
        );
      });
    }, function (next) {
      next(
        { id: 0, name: 'all' },
        postb.threads.find({}).sort({ udate: -1 }).skip((pg - 1) * pgsize).limit(pgsize)
      );
    }, function (category, cursor) {
      var categoryIndex = user.categoryIndex;
      var threads = [];
      var count = 0;
      (function read() {
        cursor.next(function (err, thread) {
          if (err) return done(err);
          if (thread) {
            count++;
            if (!cid) {
              var c = categoryIndex[thread.cid];
              if (!c) {
                return setImmediate(read);
              }
              thread.category = {
                id: c.id,
                name: c.name
              };
            }
            thread.udateStr = util2.dateTimeString(thread.udate),
            thread.udate = thread.udate.getTime(),
            threads.push(thread);
            return setImmediate(read);
          }
          var last = count !== pgsize;
          if (api) {
            res.json({
              threads: threads,
              last: last
            });
          } else {
            res.render('post/post-list', {
              category: category,
              threads: threads,
              prev: pg > 1 ? new util2.UrlMaker('/posts').add('c', cid, 0).add('pg', pg - 1, 1).done() : undefined,
              next: !last ? new util2.UrlMaker('/posts').add('c', cid, 0).add('pg', pg + 1).done() : undefined
            });
          }
        });
      })();
    });
  });
}

expb.core.get('/threads', function (req, res, done) {
  res.redirect('/posts');
});
