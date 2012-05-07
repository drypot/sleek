var _ = require('underscore');

var l = require('./l.js');
var config = require('./config.js');

var request;

l.addInit(function (next) {
	request = new l.RequestBase(config.esUrl + '/' + config.esIndexName);
	next();
});

l.addInit(function (next) {
	if (config.esDropIndex) {
		request.del('', next);
		return;
	}
	next();
});

l.addInit(function (next) {
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
	}, next);
});

l.addInit(function (next) {
	console.info('elasticsearch initialized: ' + request.url(''));
	next();
});

exports.flush = function (next) {
	request.post('/_flush', next);
}

exports.updatePost = function (thread, post, next) {
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

exports.getPost = function (postId, next) {
	request.get('/post/' + postId, function (err, res) {
		if (err) return next(err);
		res.body._id = parseInt(res.body._id);
		res.body._source.cdate = new Date(res.body._source.cdate);
		next(err, res);
	});
}

exports.searchPost = function (body, next) {
	request.post('/post/_search', body, function (err, res) {
		if (err) return next(err);
		if (!res.body.hits) return next(null, res);
		_.each(res.body.hits.hits, function (hit) {
			hit._id = parseInt(hit._id);
			hit._source.cdate = new Date(hit._source.cdate);
		});
		next(null, res);
	});
}