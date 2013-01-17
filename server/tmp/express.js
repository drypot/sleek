var ex = require('connect');
var util = require('util');

var app = connect();
console.log(util.inspect(app.request()));