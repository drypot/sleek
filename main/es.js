var _ = require('underscore');
var async = require('async');
var l = require('./l.js');

require('./config.js');
require('./request.js');
require('./mongo.js');

l.es = {};

l.init.init(function (next) {

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
						cdate: { type: 'date', index: 'not_analyzed', include_in_all: false },
						title: { type: 'string', index: 'no', include_in_all: false },
						titlei: { type: 'string', index: 'no', include_in_all: true },
						userName: { type: 'string', index: 'no', include_in_all: true },
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
			cdate: post.cdate,
			title: thread.title,
			titlei: thread.cdate.getTime() === post.cdate.getTime() ? thread.title : '',
			userName: post.userName,
			text: post.text,
			visible: post.visible
		}, next);
	}

	l.es.getPost = function (postId, next) {
		request.get('/post/' + postId, function (err, res) {
			if (err) return next(err);
			res.body._id = parseInt(res.body._id);
			res.body._source.cdate = new Date(res.body._source.cdate);
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
						hit._source.cdate = new Date(hit._source.cdate);
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
			count++;
			if (count % 1000 === 0) {
				process.stdout.write(count + ' ');
			}
			updatePost(thread, post, function (err) {});
			// node core 의 request socket 을 재사용하기 위해
			// callback 을 기다리지 않고 새로운 request 를 계속 밀어 넣는다.
			next();
		}
	}

});
