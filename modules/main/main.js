var init = require('../base/init');
var config = require('../base/config');
var exp = require('../express/express');

require('../user/user-base');
require('../post/post-api');
require('../post/post-base-html');
require('../search/search-base-api');
require('../search/search-base-html');

init.run();
