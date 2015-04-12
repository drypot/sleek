var tokenize = require('../search/tokenizer').tokenize;

exp.core.get('/api/search', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var params = search.makeParams(req);
    search.searchPost(user, params, function (err, posts, last) {
      if (err) return done(err);
      res.json({
        posts: posts,
        last: last
      });
    });
  });
});

init.add(function () {
  exp.core.get('/search', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return res.renderErr(err);
      var params = search.makeParams(req);
      search.searchPost(user, params, function (err, posts, last) {
        if (err) return res.renderErr(err);
        prevNext(params, last, function (prevUrl, nextUrl) {
          res.render('search-results', {
            query: req.query.q || '',
            posts: posts,
            prevUrl: prevUrl,
            nextUrl: nextUrl
          });
        });
      });
    });
  });

  function prevNext(params, last, done) {
    var prevUrl, nextUrl;
    var url;
    if (params.pg > 1) {
      url = new UrlMaker('/search')
      url.add('q', params.query);
      //url.add('c', params.cid, 0);
      url.add('pg', params.pg - 1, 1);
      prevUrl = url.toString();
    }
    if (!last) {
      url = new UrlMaker('/search');
      url.add('q', params.query);
      //url.add('c', params.cid, 0);
      url.add('pg', params.pg + 1, 1);
      nextUrl = url.toString();
    }
    done(prevUrl, nextUrl);
  }
});


exports.searchPosts = function (tokens, pg, pgsize, done) {
  var opt = {
    fields: { tokens: 0 },
    skip: (pg - 1) * pgsize,
    sort: { cdate: -1 },
    limit: pgsize
  };
  return posts.find({ tokens: { $all: tokens } }, opt);
}

exports.makeParams = function (req) {
  var params = {};
  params.query = req.query.q || '';
  //params.cid = parseInt(req.query.c) || 0;
  var pg = parseInt(req.query.pg) || 1;
  params.pg = pg < 1 ? 1 : pg;
  var pgsize = parseInt(req.query.ps) || 16;
  params.pgsize = pgsize > 128 ? 128 : pgsize < 1 ? 1 : pgsize;
  return params;
}

exports.searchPost = function (user, params, done) {
  var tokens = tokenize(params.query);
  var categoryIndex = user.categoryIndex;
  var posts = [];
  var count = 0;
  var cursor = mongo.searchPosts(tokens, params.pg, params.pgsize);
  function read() {
    cursor.nextObject(function (err, post) {
      if (err) return done(err);
      if (post) {
        count++;
        mongo.findThread(post.tid, function (err, thread) {
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
            post.cdateStr = dt.format(post.cdate),
            post.cdate = post.cdate.getTime(),
            posts.push(post);
          }
          setImmediate(read);
        });
        return;
      }
      done(null, posts, count !== params.pgsize);
    });
  }
  read();
};

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