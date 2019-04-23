'use strict';

const init = require('../base/init');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const postb = require('../post/post-base');

init.run(function (err) {
  console.log('start rebuilding:');
  postb.rebuildTokens(function (err) {
    if (err) throw err;
    mongo.db.close(function (err) {
      if (err) throw err;
      console.log('done');
    })
  });
});
