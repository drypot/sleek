var _ = require('underscore');

_.each(undefined, function (v) {
	console.log(v);
});

//console.log(_.isFunction(function () {}));
//console.log(_.isFunction({}));
//
//console.log(_.isObject(function () {}));
//console.log(_.isObject({}));
//console.log(_.isObject([]));
//console.log(_.isObject("abc"));
//console.log(_.isObject(1));
//console.log('-');
//
//console.log(_.isEmpty(null));
//console.log(_.isEmpty(undefined));
//console.log(_.isEmpty(0));
//console.log(_.isEmpty(1));
//console.log(_.isEmpty([]));
//console.log(_.isEmpty([1]));
//console.log(_.isEmpty({}));
//console.log(_.isEmpty({a:1}));
