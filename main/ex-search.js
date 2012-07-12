var _ = require('underscore');
var async = require('async');
var l = require('./l.js');

require('./role.js');
require('./mongo.js');
require('./es.js');
require('./session.js');
require('./ex.js');

l.init.init(function () {

	l.ex.get('/api/search', l.session.checkLogin(), function (req, res) {
		var role = l.role.getRoleByName(req.session.roleName);
		var query = l.defString(req.query, 'q', '');
		var offset = l.defInt(req.query, 'offset', 0);
		var limit = l.defInt(req.query, 'limit', 16, 0, 64);
		l.es.searchPost({
				query: { query_string: { query: query, default_operator: 'and' }},
				sort:[{cdate : "desc"}],
				size: limit, from: offset
			},
			function (err, sres) {
				if (err) {
					res.json({ rc: l.rc.SEARCH_IO_ERR});
				} else {
					if (!sres.body.hits) {
						res.json({ rc: l.rc.SUCCESS, result: [] });
					} else {
						var r = {
							rc: l.rc.SUCCESS,
							result: []
						};
						_.each(sres.body.hits.hits, function (hit) {
							var s = hit._source;
							var c = role.category[s.categoryId];
							if (!c || (!s.visible && !c.editable)) {
								//
							} else {
								r.result.push({
									postId: hit._id,
									threadId: s.threadId,
									categoryId: s.categoryId,
									cdate: s.cdate.getTime(),
									userName: s.userName,
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

