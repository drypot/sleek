var _ = require('underscore');
var l = require('../main/l');

require('../main/rcs');
require('../main/auth');
require('../main/mongo');
require('../main/es');
require('../main/express');
require('../main/session');

l.init(function () {

	l.e.get('/api/search', function (req, res) {
		req.authorized(function () {
			var query = l.string(req.query, 'q', '');
			var offset = l.int(req.query, 'offset', 0);
			var limit = l.int(req.query, 'limit', 16, 0, 64);
			l.es.searchPost({
					query: { query_string: { query: query, default_operator: 'and' }},
					sort:[{created : "desc"}],
					size: limit, from: offset
				},
				function (err, sres) {
					if (err) {
						res.json({ rc: rcs.SEARCH_IO_ERR});
					} else {
						if (!sres.body.hits) {
							res.json({ rc: rcs.SUCCESS, result: [] });
						} else {
							var r = {
								rc: rcs.SUCCESS,
								result: []
							};
							var categories = res.locals.role.categories;
							_.each(sres.body.hits.hits, function (hit) {
								var s = hit._source;
								var c = categories[s.categoryId];
								if (!c || (!s.visible && !c.editable)) {
									//
								} else {
									r.result.push({
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
							res.json(r);
						}
					}
				}
			);
		});
	});

});
