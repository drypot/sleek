'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const async2 = require('../base/async2');
const date2 = require('../base/date2');
const url2 = require('../base/url2');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const postb = require('../post/post-base');
const postl = exports;

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
    var p = Math.max(parseInt(req.query.p) || 1, 1);
    var ps = Math.min(Math.max(parseInt(req.query.ps) || 16, 1), 128);
    async2.if(cid, function (next) {
      postb.checkCategory(user, cid, function (err, category) {
        if (err) return done(err);
        mysql2.query('select * from thread where cid = ? order by udate desc limit ?, ?', [cid, (p-1)*ps, ps], (err, r) => {
          next(err, category, r);
        });
      });
    }, function (next) {
      mysql2.query('select * from thread order by udate desc limit ?, ?', [(p-1)*ps, ps], (err, r) => {
        next(err, { id: 0, name: 'all' }, r);
      });
    }, function (err, category, r) {
      if (err) return done(err);
      var categoryIndex = user.categoryIndex;
      var threads = [];
      r.forEach((thread) => {
        if (!cid) {
          var c = categoryIndex[thread.cid];
          if (!c) {
            return;
          }
          thread.category = {
            id: c.id,
            name: c.name
          };
        }
        thread.udateStr = date2.dateTimeString(thread.udate),
        threads.push(thread);
      });
      if (api) {
        res.json({
          threads: threads
        });
      } else {
        res.render('post/post-list', {
          category: category,
          threads: threads,
          prev: p > 1 ? new url2.UrlMaker('/posts').add('c', cid, 0).add('p', p - 1, 1).done() : undefined,
          next: new url2.UrlMaker('/posts').add('c', cid, 0).add('p', p + 1).done()
        });
      }
    });
  });
}

expb.core.get('/threads', function (req, res, done) {
  res.redirect('/posts');
});
