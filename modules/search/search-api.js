var init = require('../base/init');
var exp = require('../express/express');
var search = require('../search/search-base');

init.add(function () {
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
});
