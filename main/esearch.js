var _ = require('underscore');
var request = require('request');

var l = require('./l.js');
var config = require('./config.js');

var param = exports.param = {};
var urlBase;

l.addInit(function (next) {
	param.indexName = param.indexName || config.searchIndexName;
	urlBase = config.searchServerUrl + '/' + param.indexName;
	next();
});

l.addInit(function (next) {
	if (param.dropIndex) {
		var opt = { method: 'DELETE', url: urlBase };
		return request(opt, next);
	}
	next();
});

l.addInit(function (next) {
	var opt = { method: 'POST', url: urlBase, json: true, body: {
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
	}};
	request(opt, next);
});

l.addInit(function (next) {
	console.info('elasticsearch initialized: ' + urlBase);
	next();
});

exports.flush = function (next) {
	var opt = {
		method: 'POST',
		url: urlBase + '/_flush',
		json: true
	};
	request(opt, next);
}

exports.updatePost = function (thread, post, next) {
	var opt = {
		method: 'PUT',
		url: urlBase + '/post/' + post._id,
		json: true,
		body: {
			threadId: thread._id,
			categoryId: thread.categoryId,
			cdate: post.cdate,
			title: thread.title,
			titlei: '',
			userName: post.userName,
			text: post.text,
			visible: post.visible
		}
	};
	if (thread.cdate.getTime() === post.cdate.getTime()) {
		opt.body.titlei = thread.title;
	}
	request(opt, next);
}

exports.getPost = function (postId, next) {
	var opt = {
		method: 'GET',
		url: urlBase + '/post/' + postId,
		json: true
	};
	request(opt, function (err, res, body) {
		if (err) return next(err);
		body._id = parseInt(body._id);
		body._source.cdate = new Date(body._source.cdate);
		next(err, res, body);
	});
}

exports.searchPost = function (query, next) {
	var opt = {
		method: 'POST',
		url: urlBase + '/post/_search',
		body: query,
		json: true
	};
	request(opt, function (err, res, body) {
		if (err) return next(err);
		_.each(body.hits.hits, function (hit) {
			hit._id = parseInt(hit._id);
			hit._source.cdate = new Date(hit._source.cdate);
		});
		next(err, res, body);
	});
}