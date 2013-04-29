var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config');

var opt = {};

exports = module.exports = function (_opt) {
	for(var p in _opt) {
		opt[p] = _opt[p];
	}
	return exports;
};

init.add(function (next) {

	var url = config.data.esUrl + '/' + config.data.esIndexName;
	var log = 'elasticsearch: ' + url;

	exports.dropIndex = function (next) {
		request.del(url, function (err, res) {
			if (err) return next(err);
			if (res.error) return next(res.body);
			next();
		});
	};

	exports.setSchema = function (next) {
		var schema = {
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
		};
		request.post(url).send(schema).end(function (err, res) {
			if (err) return next(err);
			//if (res.error) return next(res.body); // Skip 400 IndexAlreadyExistsException
			next(null, res);
		});
	};

	exports.flush = function (next) {
		request.post(url + '/_flush', function (err, res) {
			if (err) return next(err);
			if (res.error) return next(res.body);
			next(null, res);
		});
	};

	exports.update = function (thread, post, next) {
		var form = {
			threadId: thread._id,
			categoryId: thread.categoryId,
			created: post.created,
			title: thread.title,
			titlei: thread.created.getTime() === post.created.getTime() ? thread.title : '',
			writer: post.writer,
			text: post.text,
			visible: post.visible
		}
		request.put(url + '/post/' + post._id).send(form).end(function (err, res) {
			if (err) return next(err);
			if (res.error) return next(res.body);
			next(null, res);
		});
	};

	exports.getPost = function (postId, next) {
		request.get(url + '/post/' + postId, function (err, res) {
			if (err) return next(err);
			if (res.error) return next(res.body);
			res.body._id = parseInt(res.body._id);
			res.body._source.created = new Date(res.body._source.created);
			next(null, res);
		});
	};

	exports.search = function (form, next) {
		request.post(url + '/post/_search').send(form).end(function (err, res) {
			if (err) return next(err);
			if (res.error) return next(res.body);
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
			next(null, res);
		});
	};

	checkDrop(function (err) {
		if (err) return next(err);
		exports.setSchema(function (err) {
			if (err) return next(err);
			console.log(log);
			next();
		})
	});

	function checkDrop(next) {
		if (opt.dropIndex) {
			log += ' drop-index';
			exports.dropIndex(next);
		} else {
			next()
		}
	}

});

