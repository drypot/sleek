'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const async2 = require('../base/async2');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const postb = require('../post/post-base');

mysql2.dropDatabase = true;

init.add((done) => {
  mysql2.close(done);
});

init.run();
