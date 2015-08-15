var init = require('../base/init');
var config = require('../base/config');
var expb = require('../express/express-base');

require('../user/user-base');
require('../post/post-list');
require('../post/post-view');
require('../post/post-new');
require('../post/post-update');
require('../post/post-search');

init.run();
