var init = require('../base/init');
var config = require('../base/config');
var mongo = require('../mongo/mongo');
var postb = require('../post/post-base');

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
