var init = require('../base/init');
var utilp = require('../base/util');
var tokenize = require('../search/tokenizer').tokenize;
var mongop = require('../mongo/mongo');

init.add(function () {

  console.log('search:');

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

});
