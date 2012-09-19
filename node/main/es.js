var _ = require('underscore');
var async = require('async');
var l = require('./l.js');

require('./config.js');
require('./request.js');
require('./mongo.js');
require('./express.js');
require('./role.js');
require('./session.js');

l.es = {};

l.init.add(function (next) {

	var baseUrl = l.config.esUrl + '/' + l.config.esIndexName;
	var request = l.request(baseUrl);

	async.series([
		function (next) {
			if (l.config.esDropIndex) {
				dropIndex(next);
			} else {
				setSchema(next);
			}
		},
		function (next) {
			console.log('elasticsearch initialized: ' + baseUrl);
			next();
		}
	], next);

	l.es.dropIndex = dropIndex; function dropIndex(next) {
		request.del('', function (err) {
			setSchema(next);
		});
	}

	function setSchema(next) {
		request.post('', {
			settings: {
				index: {
					number_of_shards : 1,
					number_of_replicas : 1,
					analysis: { analyzer: { 'default': { type: 'cjk' } } }
				}
			},
			mappings: {
				'post': {
					properties: {
						threadId: { type: 'integer', index: 'no', include_in_all: false },
						categoryId: { type: 'integer', index: 'no', include_in_all: false },
						created: { type: 'date', index: 'not_analyzed', include_in_all: false },
						title: { type: 'string', index: 'no', include_in_all: false },
						titlei: { type: 'string', index: 'no', include_in_all: true },
						writer: { type: 'string', index: 'no', include_in_all: true },
						text: { type: 'string', index: 'no', include_in_all: true }
					}
				}
			}
		}, function (err) {
			next(null);
		});
	}

	l.es.flush = flush; function flush(next) {
		request.post('/_flush', next);
	}

	l.es.updatePost = updatePost; function updatePost(thread, post, next) {
		request.put('/post/' + post._id, {
			threadId: thread._id,
			categoryId: thread.categoryId,
			created: post.created,
			title: thread.title,
			titlei: thread.created.getTime() === post.created.getTime() ? thread.title : '',
			writer: post.writer,
			text: post.text,
			visible: post.visible
		}, next);
	}

	l.es.getPost = function (postId, next) {
		request.get('/post/' + postId, function (err, res) {
			if (err) return next(err);
			res.body._id = parseInt(res.body._id);
			res.body._source.created = new Date(res.body._source.created);
			next(err, res);
		});
	}

	l.es.searchPost = searchPost; function searchPost(body, next) {
		request.post('/post/_search', body, function (err, res) {
			if (err) {
				next(err);
			} else {
				if (res.body.hits) {
					_.each(res.body.hits.hits, function (hit) {
						hit._id = parseInt(hit._id);
						hit._source.created = new Date(hit._source.created);
					});
				}
				next(err, res);
			}
		});
	}

	l.es.rebuild = function (next) {
		var threadCursor = l.mongo.threadCol.find();
		var postCursor;
		var count = 0;

		walkThread(next);

		function walkThread(next) {
			threadCursor.nextObject(function (err, thread) {
				if (err) {
					next(err);
				} else {
					if (!thread) {
						next();
					} else {
						postCursor = l.mongo.postCol.find({ threadId: thread._id });
						walkPost(thread, function (err) {
							if (err) {
								next(err);
							} else {
								walkThread(next);
							}
						});
					}
				}
			});
		}

		function walkPost(thread, next) {
			postCursor.nextObject(function (err, post) {
				if (err) {
					next(err);
				} else {
					if (!post) {
						next();
					} else {
						updateSearchIndex(thread, post, function (err) {
							if (err) {
								next(err);
							} else {
								walkPost(thread, next);
							}
						});
					}
				}
			});
		}

		function updateSearchIndex(thread, post, next) {
			updatePost(thread, post, function (err) {
				count++;
				if (count % 1000 === 0) {
					process.stdout.write(count + ' ');
				}
			});
			// node core 의 request socket 을 재사용하기 위해
			// callback 을 기다리지 않고 새로운 request 를 계속 밀어 넣는다.
			next();
		}
	}

});

l.init.add(function () {

	l.e.get('/api/search', function (req, res) {
		l.session.authorized(res, function () {
			var query = l.defString(req.query, 'q', '');
			var offset = l.defInt(req.query, 'offset', 0);
			var limit = l.defInt(req.query, 'limit', 16, 0, 64);
			l.es.searchPost({
					query: { query_string: { query: query, default_operator: 'and' }},
					sort:[{created : "desc"}],
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
								var c = res.locals.role.category[s.categoryId];
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

