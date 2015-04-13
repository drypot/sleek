
exp.core.get('/api/threads', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var params = post.makeThreadsParams(req);
    if (params.cid) {
      post.findThreadsByCategory(user, params, function (err, category, threads, last) {
        if (err) return done(err);
        res.json({
          threads: threads,
          last: last
        });
      });
    } else {
      post.findThreads(user, params, function (err, threads, last) {
        if (err) return done(err);
        res.json({
          threads: threads,
          last: last
        });
      });
    }
  });
});

exp.core.get('/', function (req, res, done) {
    // 이거 삭제하고 checkUser 해서 done error
  if (res.locals.user) {
    res.redirect('/threads');
  } else {

  }
});

exp.core.get('/threads', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    var params = post.makeThreadsParams(req);
    if (params.cid) {
      post.findThreadsByCategory(user, params, function (err, category, threads, last) {
        if (err) return done(err);
        prevNext(params, last, function (prevUrl, nextUrl) {
          res.render('thread-list', {
            category: category,
            threads: threads,
            prevUrl: prevUrl,
            nextUrl: nextUrl
          });
        });
      });
    } else {
      post.findThreads(user, params, function (err, threads, last) {
        if (err) return done(err);
        prevNext(params, last, function (prevUrl, nextUrl) {
          res.render('thread-list', {
            category: {
              id: 0,
              name: 'all'
            },
            threads: threads,
            prevUrl: prevUrl,
            nextUrl: nextUrl
          });
        });
      });
    }
  });
});

function prevNext(params, last, done) {
  var prevUrl, nextUrl;
  var url;
  if (params.pg > 1) {
    url = new UrlMaker('/threads')
    url.add('c', params.cid, 0);
    url.add('pg', params.pg - 1, 1);
    prevUrl = url.toString();
  }
  if (!last) {
    url = new UrlMaker('/threads');
    url.add('c', params.cid, 0);
    url.add('pg', params.pg + 1, 1);
    nextUrl = url.toString();
  }
  done(prevUrl, nextUrl);
}

 exports.findThreads = function (pg, pgsize) {
  return threads.find({}).sort({ udate: -1 }).skip((Math.abs(pg) - 1) * pgsize).limit(pgsize);
};

exports.findThreadsByCategory = function (cid, pg, pgsize) {
  return threads.find({ cid: cid }).sort({ udate: -1 }).skip((Math.abs(pg) - 1) * pgsize).limit(pgsize);
};

exports.findThreads = function (user, params, done) {
  var categoryIndex = user.categoryIndex;
  var threads = [];
  var count = 0;
  var cursor = mongo.findThreads(params.pg, params.pgsize);
  function read() {
    cursor.nextObject(function (err, thread) {
      if (err) return done(err);
      if (thread) {
        count++;
        var c = categoryIndex[thread.cid];
        if (c) {
          thread.category = {
            id: c.id,
            name: c.name
          };
          thread.udateStr = dt.format(thread.udate),
          thread.udate = thread.udate.getTime(),
          threads.push(thread);
        }
        setImmediate(read);
        return;
      }
      done(null, threads, count !== params.pgsize);
    });
  }
  read();
};

exports.findThreadsByCategory = function (user, params, done) {
  categoryForRead(user, params.cid, function (err, category) {
    if (err) return done(err);
    var categoryIndex = user.categoryIndex;
    var threads = [];
    var count = 0;
    var cursor = mongo.findThreadsByCategory(params.cid, params.pg, params.pgsize);
    function read() {
      cursor.nextObject(function (err, thread) {
        if (err) return done(err);
        if (thread) {
          count++;
          thread.udateStr = dt.format(thread.udate),
          thread.udate = thread.udate.getTime(),
          threads.push(thread);
          setImmediate(read);
          return;
        }
        done(null, category, threads, count !== params.pgsize);
      });
    }
    read();
  });
};