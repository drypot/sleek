var init = require('../base/init');
var express = require('../main/express');
var search = require('../search/search-base');
var UrlMaker = require('../main/UrlMaker');

init.add(function () {

  var app = express.app;

  console.log('search-html:');

  app.get('/search', function (req, res) {
    req.findUser(function (err, user) {
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

  function prevNext(params, last, next) {
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
    next(prevUrl, nextUrl);
  }

});
