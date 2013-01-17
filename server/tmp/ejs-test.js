var ejs = require('ejs');

var f = ejs.compile('ddd <%= abc %>');

console.log(f({ abc: 123 }));

console.log(fn.toString());