'use strict';

const init = require('../base/init');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');

init.run(function (err) {
  if (err) throw err;
  var posts = mongo.posts.find();
  (function nextPost() {
    posts.next(function (err, post) {
      if (err) throw err;
      if (post) {
        if (post.files) {
          console.log(post.files);
          if (post.files.length === 0) {
            delete post.files;
            mongo.posts.save(post, function (err) {
              if (err) throw err;
              console.log('files removed.');
              setImmediate(nextPost);
            });
            return;
          }
          if (typeof post.files[0] === 'string') {
            for (var i = 0; i < post.files.length; i++) {
              post.files[i] = { name: post.files[i] };
            }
            mongo.posts.save(post, function (err) {
              if (err) throw err;
              console.log('files converted.');
              setImmediate(nextPost);
            });
            return;
          }
          console.log('skip conversion.');
        }
        return setImmediate(nextPost);
      }
      console.log('ended');
    });
  })();
});
