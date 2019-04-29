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
const postsr = require('../post/post-search');

init.tail(
  (done) => {
    console.log('migration from mongodb to mysql.');
    done(); 
  },
  (done) => {
    mysql2.query(`
      drop index thread_cid_udate on thread;
      drop index thread_udate on thread;
      drop index post_tid_cdate on post;
    `, done); 
  },
  (done) => {
    console.log('copying thread: ');
    var count = 0;
    var cursor = mongo2.db.collection('threads').find().sort({ _id: 1 });
    (function read() {
      cursor.next(function (err, r) {
        if (err) return done(err);
        if (!r) {
          console.log('done.');
          return done();
        }
        count++;
        if (count % 100 === 0) {
          process.stdout.write(count + ' ');
        }
        r.id = r._id;
        delete r._id;
        mysql2.query('insert into thread set ?', r, (err) => {
          if (err) return done(err);
        });
        setImmediate(read);
      });
    })();
  },
  (done) => {
    console.log('copying post: ');
    var count = 0;
    var cursor = mongo2.db.collection('posts').find().sort({ _id: 1 });
    (function read() {
      cursor.next(function (err, r) {
        if (err) return done(err);
        if (!r) {
          console.log('done.');
          return done();
        }
        count++;
        if (count % 100 === 0) {
          process.stdout.write(count + ' ');
        }
        r.id = r._id;
        delete r._id;
        delete r.tokens;
        postb.packPost(r);
        mysql2.query('insert into post set ?', r, (err) => {
          if (err) return done(err);
        });
        setImmediate(read);
      });
    })(); 
  },
  (done) => {
    console.log('rebuild fulltext index: ');
    postsr.updateAll.showProgress = true;
    postsr.updateAll(() => {
      console.log('done.');
      done();
    });
  },
  (done) => {
    mysql2.close(done);   
  },
  () => {
    console.log('all done.');
    //process.exit(0);
  }
);

mysql2.dropDatabase = true;
init.run();
