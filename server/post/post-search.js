var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');
var util2 = require('../base/util2');
var expb = require('../express/express-base');
var userb = require('../user/user-base');
var postb = require('../post/post-base');
var postsr = exports;

expb.core.get('/posts/search', function (req, res, done) {
  search(req, res, false, done);
});

expb.core.get('/api/posts/search', function (req, res, done) {
  search(req, res, true, done);
});

function search(req, res, api, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var query = req.query.q || '';
    var tokens = util2.tokenize(query);
    var pg = Math.max(parseInt(req.query.pg) || 1, 1);
    var pgsize = Math.min(Math.max(parseInt(req.query.ps) || 16, 1), 128);
    var categoryIndex = user.categoryIndex;
    var posts = [];
    var count = 0;
    var opt = {
      fields: { tokens: 0 },
      skip: (pg - 1) * pgsize,
      sort: { cdate: -1 },
      limit: pgsize
    };
    var cursor = postb.posts.find({ tokens: { $all: tokens } }, opt);
    (function read() {
      cursor.nextObject(function (err, post) {
        if (err) return done(err);
        if (post) {
          count++;
          postb.threads.findOne({ _id: post.tid }, function (err, thread) {
            if (err) return done(err);
            var category = categoryIndex[thread.cid];
            if (category && (post.visible || user.admin)) {
              post.thread = {
                _id: thread._id,
                title: thread.title
              };
              post.category = {
                id: category.id,
                name: category.name
              };
              post.text = post.text.slice(0, 256);
              post.cdateStr = util2.toDateTimeString(post.cdate),
              post.cdate = post.cdate.getTime(),
              posts.push(post);
            }
            setImmediate(read);
          });
          return;
        }
        var last = count !== pgsize;
        if (api) {
          res.json({
            posts: posts,
            last: last
          });
        } else {
          res.render('post/post-search', {
            query: req.query.q || '',
            posts: posts,
            prev: pg > 1 ? new util2.UrlMaker('/posts/search').add('q', query).add('pg', pg - 1, 1).done() : undefined,
            next: !last ? new util2.UrlMaker('/posts/search').add('q', query).add('pg', pg + 1).done() : undefined
          });
        }
      });
    })();
  });
}

postsr.rebuildTokens = function (done) {
  var count = 0;
  var threads = postb.threads.find();
  (function readt() {
    threads.nextObject(function (err, thread) {
      if (err) return done(err);
      if (thread) {
        var posts = postb.posts.find({ tid: thread._id });
        (function readp() {
          posts.nextObject(function (err, post) {
            if (err) return done(err);
            if (post) {
              var head = postb.isHead(thread, post);
              var tokens = util2.tokenize(head ? thread.title : '', post.writer, post.text);
              postb.posts.updateOne({ _id: post._id }, { $set: { tokens: tokens } }, function (err) {
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
