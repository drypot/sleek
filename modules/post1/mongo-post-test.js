



describe('post collection', function () {

  describe('inserting', function () {
    it('should success', function (done) {
      var p = {
        tid: 1000, cdate: new Date(50), visible: true,
        writer: 'snowman', text: 'text'
      }
      mongo.insertPost(p, function (err) {
        should.not.exists(err);
        mongo.posts.count(function (err, count) {
          expect(err).not.exist;
          count.should.equal(1);
          done();
        });
      });
    });
  });

  describe('finding by id', function () {
    var p = {
      tid: 1000, cdate: new Date(50), visible: true,
      writer: 'snowman', text: 'text'
    }
    it('given empty collection', function (done) {
      mongo.posts.remove(done);
    });
    it('given p', function (done) {
      p._id = mongo.getNewPostId();
      mongo.insertPost(p, done);
    });
    it('should success', function (done) {
      mongo.findPost(p._id, function (err, post) {
        expect(err).not.exist;
        post.should.eql(p);
        done();
      });
    });
  });

  describe('finding by thread', function () {
    it('given empty collection', function (done) {
      mongo.posts.remove(done);
    });
    it('given posts', function (done) {
      var rows = [
        {
          _id: mongo.getNewPostId(), tid: 1000, cdate: new Date(10), visible: true,
          writer: 'snowman', text: 'cool post 11'
        },
        {
          _id: mongo.getNewPostId(), tid: 1000, cdate: new Date(20), visible: true,
          writer: 'snowman', text: 'cool post 12'
        },
        {
          _id: mongo.getNewPostId(), tid: 1000, cdate: new Date(30), visible: false,
          writer: 'snowman', text: 'cool post 13'
        },
        {
          _id: mongo.getNewPostId(), tid: 1010, cdate: new Date(10), visible: true,
          writer: 'snowman', text: 'cool post 21'
        },
        {
          _id: mongo.getNewPostId(), tid: 1010, cdate: new Date(20), visible: true,
          writer: 'snowman', text: 'cool post 22'
        }
      ];
      mongo.insertPost(rows, done);
    });
    it('should success', function (done) {
      var count = 0;
      var cursor = mongo.findPostsByThread(1000);
      function read() {
        cursor.nextObject(function (err, post) {
          expect(err).not.exist;
          if (post) {
            count++;
            setImmediate(read);
            return;
          }
          count.should.equal(3);
          done();
        });
      }
      read();
    });
    it('should success', function (done) {
      var count = 0;
      var cursor = mongo.findPostsByThread(1010);
      function read() {
        cursor.nextObject(function (err, post) {
          expect(err).not.exist;
          if (post) {
            count++;
            setImmediate(read);
            return;
          }
          count.should.equal(2);
          done();
        });
      }
      read();
    });
    it('should return sorted', function (done) {
      var posts = [];
      var cursor = mongo.findPostsByThread(1000);
      function read() {
        cursor.nextObject(function (err, post) {
          expect(err).not.exist;
          if (post) {
            posts.push(post);
            setImmediate(read);
            return;
          }
          posts[0].cdate.should.below(posts[1].cdate);
          posts[1].cdate.should.below(posts[2].cdate);
          done();
        });
      }
      read();
    });
  });

  describe('updating', function () {
    var p = {
      tid: 1030, cdate: new Date(50), visible: true,
      writer: 'snowman', text: 'text'
    }
    it('given empty collection', function (done) {
      mongo.posts.remove(done);
    });
    it('given p', function (done) {
      p._id = mongo.getNewPostId();
      mongo.insertPost(p, done);
    });
    it('should success', function (done) {
      p.writer  = 'fireman';
      p.hit = 17;
      mongo.updatePost(p, function (err) {
        expect(err).not.exist;
        mongo.findPost(p._id, function (err, post) {
          expect(err).not.exist;
          post.should.eql(p);
          done();
        });
      });
    });
  });
});