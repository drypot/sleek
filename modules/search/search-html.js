var init = require('../base/init');
var utilp = require('../base/util');
var exp = require('../express/express');
var search = require('../search/search-base');

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
