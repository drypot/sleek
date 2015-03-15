var init = require('../base/init');
var config = require('../base/config');
var express2 = require('../main/express');

require('../user/user-auth');
require('../post/post-api');
require('../post/post-base-html');
require('../search/search-base-api');
require('../search/search-base-html');

init.run();