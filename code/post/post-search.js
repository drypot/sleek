import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as url2 from "../base/url2.js";
import * as date2 from "../base/date2.js";
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as postb from "./post-base.js";
import * as userb from "../user/user-base.js";

export function updateThread(tid, done) {
  db.queryOne('select * from thread where id = ?', tid, (err, thread) => {
    if (err) return done(err);
    thread.merged = thread.writer + ' ' + thread.title + ' ';
    db.query('select * from post where tid = ?', tid, (err, r) => {
      if (err) return done(err);
        r.forEach((post) => {
        thread.merged += post.text + " " + post.writer + " ";
        if (!thread.text) {
          thread.text = post.text.slice(0, 255);
        }
      });
      db.query(
        'delete from threadmerged where id = ?;' +
        'insert into threadmerged set ?',
        [tid, thread],
        done);
    });
  });
}

export function updateAll(done) {
  let offset = 0;
  let ps = 100;
  (function loop1() {
    db.query('select id from thread order by id limit ?, ?', [offset, ps], (err, threads) => {
      if (err) return done(err);
      if (!threads.length) return done();
      if (updateAll.showProgress) {
        process.stdout.write(offset + ' ');
      }
      offset += ps;
      let i = 0;
      (function loop2() {
        if (i === threads.length) {
          return setImmediate(loop1);
        }
        updateThread(threads[i++].id, (err) => {
          if (err) return done(err);
          setImmediate(loop2);
        });
      })();
    });
  })();
}

expb.core.get('/posts/search', function (req, res, done) {
  search(req, res, false, done);
});

expb.core.get('/api/posts/search', function (req, res, done) {
  search(req, res, true, done);
});

function search(req, res, api, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    const q = req.query.q || '';
    const p = Math.max(parseInt(req.query.p) || 1, 1);
    const ps = Math.min(Math.max(parseInt(req.query.ps) || 16, 1), 128);
    const categoryIndex = user.categoryIndex;
    const threads = [];
    db.query('select id, cid, cdate, title, writer, text from threadmerged where match(merged) against(? in boolean mode) order by id desc limit ?, ?', [q, (p-1)*ps, ps], (err, r) => {
      if (err) return done(err);
      r.forEach((thread) => {
        const category = categoryIndex[thread.cid];
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
