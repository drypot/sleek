var async = require('async');
var request = require('superagent').agent();

module.exports = function (opt, next) {

	var exports = {};

	var config = opt.config;
	var url = config.esUrl + '/' + config.esIndexName;

	exports.dropIndex = function (next) {
		request.del(url, function (err, res) {
			if (err) {
				next(err);
			} else {
				setSchema(next);
			}
		});
	};

	var setSchema = function (next) {
		request.post(url).send({
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
		}).end(function (err, res) {
			next(err, res);
		});
	};

	exports.flush = function (next) {
		request.post(url + '/_flush', function (err, res) {
			next(err, res);
		});
	};

	exports.updatePost = function (thread, post, next) {
		request.put(url + '/post/' + post._id).send({
			threadId: thread._id,
			categoryId: thread.categoryId,
			created: post.created,
			title: thread.title,
			titlei: thread.created.getTime() === post.created.getTime() ? thread.title : '',
			writer: post.writer,
			text: post.text,
			visible: post.visible
		}).end(function (err, res) {
			next(err, res);
		});
	};

	exports.getPost = function (postId, next) {
		request.get(url + '/post/' + postId, function (err, res) {
			if (err) {
				next(err);
			} else {
				res.body._id = parseInt(res.body._id);
				res.body._source.created = new Date(res.body._source.created);
				next(err, res);
			}
		});
	};

	exports.searchPost = function (body, next) {
		request.post(url + '/post/_search').send(body).end(function (err, res) {
			if (err) {
				next(err);
			} else {
				if (res.body.hits) {
					var hits = res.body.hits.hits;
					var len = hits.length;
					var i;
					for (i = 0; i < len; i++) {
						var hit = hits[i];
						hit._id = parseInt(hit._id);
						hit._source.created = new Date(hit._source.created);
					}
				}
				next(err, res);
			}
		});
	};

	async.series([
		function (next) {
			if (opt.dropIndex) {
				exports.dropIndex(next);
			} else {
				setSchema(next);
			}
		},
		function (next) {
			console.log('elasticsearch: ' + url);
			next();
		}
	], function (err) {
		if (err) throw err;
		next(exports);
	});

};

