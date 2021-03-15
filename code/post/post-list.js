import * as assert2 from "../base/assert2.js";
import * as init from "../base/init.js";
import * as error from "../base/error.js";
import * as config from "../base/config.js";
import * as async2 from "../base/async2.js";
import * as date2 from "../base/date2.js";
import * as url2 from "../base/url2.js";
import * as db from "../db/db.js";
import * as expb from "../express/express-base.js";
import * as userb from "../user/user-base.js";
import * as postb from "../post/post-base.js";

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
    const cid = parseInt(req.query.c) || 0;
    const p = Math.max(parseInt(req.query.p) || 1, 1);
    const ps = Math.min(Math.max(parseInt(req.query.ps) || 16, 1), 128);
    async2.waterfall(
      (done) => {
        if (cid) {
          postb.checkCategory(user, cid, function (err, category) {
            if (err) return done(err);
            db.query('select * from thread where cid = ? order by udate desc limit ?, ?', [cid, (p-1)*ps, ps], (err, r) => {
              done(err, category, r);
            });
          });
        } else {
          db.query('select * from thread order by udate desc limit ?, ?', [(p-1)*ps, ps], (err, r) => {
            done(err, { id: 0, name: 'all' }, r);
          });
        }
      },
      (err, category, r) => {
        if (err) return done(err);
        const categoryIndex = user.categoryIndex;
        const threads = [];
        r.forEach((thread) => {
          if (!cid) {
            const c = categoryIndex[thread.cid];
            if (!c) {
              return;
            }
            thread.category = {
              id: c.id,
              name: c.name
            };
          }
          thread.udateStr = date2.dateTimeString(thread.udate);
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
      }
    );
  });
}

expb.core.get('/threads', function (req, res, done) {
  res.redirect('/posts');
});
