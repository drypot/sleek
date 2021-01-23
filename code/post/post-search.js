'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const date2 = require('../base/date2');
const url2 = require('../base/url2');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const postb = require('./post-base');
const postsr = exports;

postsr.updateThread = function (tid, done) {
  mysql2.queryOne('select * from thread where id = ?', tid, (err, thread) => {
    if (err) return done(err);
    thread.merged = thread.writer + ' ' + thread.title + ' ';
    mysql2.query('select * from post where tid = ?', tid, (err, r) => {
      if (err) return done(err);
        r.forEach((post) => {
        thread.merged += post.text + " " + post.writer + " ";
        if (!thread.text) {
          thread.text = post.text.slice(0, 255);
        }
      });
      mysql2.query(
        'delete from threadmerged where id = ?;' +
        'insert into threadmerged set ?', 
        [tid, thread],
        done);
    });
  });
};

var updateThread = postsr.updateThread;

postsr.updateAll = function (done) {
  let offset = 0;
  let ps = 100;
  (function loop1() {
    mysql2.query('select id from thread order by id limit ?, ?', [offset, ps], (err, threads) => {
      if (err) return done(err);
      if (!threads.length) return done();
      if (postsr.updateAll.showProgress) {
        process.stdout.write(offset + ' ');
      }
      offset += ps;
      let i = 0;
      (function loop2() {
        if (i == threads.length) {
          return setImmediate(loop1);
        }
        updateThread(threads[i++].id, (err) => {
          if (err) return done(err);
          setImmediate(loop2);
        });
      })();
    });
  })();
};

expb.core.get('/posts/search', function (req, res, done) {
  search(req, res, false, done);
});

expb.core.get('/api/posts/search', function (req, res, done) {
  search(req, res, true, done);
});

function search(req, res, api, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var q = req.query.q || '';
    var p = Math.max(parseInt(req.query.p) || 1, 1);
    var ps = Math.min(Math.max(parseInt(req.query.ps) || 16, 1), 128);
    var categoryIndex = user.categoryIndex;
    var threads = [];
    mysql2.query('select id, cid, cdate, title, writer, text from threadmerged where match(merged) against(? in boolean mode) order by id desc limit ?, ?', [q, (p-1)*ps, ps], (err, r) => {
      if (err) return done(err);
      r.forEach((thread) => {
        var category = categoryIndex[thread.cid];
        if (category) {
          thread.category = {
            id: category.id,
            name: category.name
          };
          thread.cdateStr = date2.dateTimeString(thread.cdate),
          threads.push(thread);
        }
      });
      if (api) {
        res.json({
          threads: threads
        });
      } else {
        res.render('post/post-search', {
          query: req.query.q || '',
          threads: threads,
          prev: p > 1 ? new url2.UrlMaker('/posts/search').add('q', q).add('p', p - 1, 1).done() : undefined,
          next: new url2.UrlMaker('/posts/search').add('q', q).add('p', p + 1).done()
        });
      }
    });
  });
}
