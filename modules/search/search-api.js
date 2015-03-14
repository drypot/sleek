var init = require('../base/init');
var express = require('../main/express');
var search = require('../search/search-base');

init.add(function () {

	var app = express.app;

	console.log('search-api:');

	app.get('/api/search', function (req, res) {
		req.findUser(function (err, user) {
			if (err) return res.jsonErr(err);
			var params = search.makeParams(req);
			search.searchPost(user, params, function (err, posts, last) {
				if (err) return res.jsonErr(err);
				res.json({
					posts: posts,
					last: last
				});
			});
		});
	});

});
