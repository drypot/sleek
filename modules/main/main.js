var init = require('../base/init');
var config = require('../base/config');
var exp = require('../express/express');

require('../user/user-base');
require('../post/post-list');
require('../post/post-view');
require('../post/post-create');
require('../post/post-update');
require('../post/post-search');

init.run();
