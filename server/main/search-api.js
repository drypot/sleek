var init = require('../main/init');
var es = require('../main/es');
var express = require('../main/express');
var rcs = require('../main/rcs');

init.add(function () {

	var app = express.app;

	console.log('search-api:');

	app.get('/api/search', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var query = String(req.query.q || '').trim();
			var offset = parseInt(req.query.offset) || 0;
			var limit = parseInt(req.query.limit) || 16;
			limit = limit > 64 ? 64 : limit < 0 ? 0 : limit;
			search(role, query, offset, limit, function (err, results) {
				if (err) {
					return res.json(err);
				}
				res.json({
					rc: rcs.SUCCESS,
					results: results
				});
			});
		});
	});

	function search(role, query, offset, limit, next) {
		if (query.length == 0) { // es 에 '' 넘어가면 에러난다.
			return next(null, []);
		}
		var form = {
			query: { query_string: { query: query, default_operator: 'and' } },
			sort: [ { created : "desc" } ],
			size: limit,
			from: offset
		}
		es.search(form, function (err, res) {
			if (err) return next(err);
			if (!res.body.hits) {
				return next(null, []);
			}
			var results = [];
			var categories = role.categories;
			res.body.hits.hits.forEach(function (hit) {
				var s = hit._source;
				var category = categories[s.categoryId];
				if (category && (s.visible || category.editable)) {
					results.push({
						postId: hit._id,
						threadId: s.threadId,
						categoryId: s.categoryId,
						created: s.created.getTime(),
						writer: s.writer,
						title: s.title,
						text: s.text.substring(0, 512)
					});
				}
			});
			next(null, results);
		});
	}

});
