var Base = require('./base.js');
var Post = require('./post.js');

exports.create = function(cb) {
    var postCollection = new PostCollection();
    postCollection.save(function(success) {
        cb(postCollection);
    });
}

function PostCollection() {
    this.attributes({name: 'PostCollection', count: 0});
}

Base.extend(PostCollection, {
    attrs: ['count', 'postIds'],
    _userPosts: {},
    add: function(message, userId, cb) {
        if(!this._hasPosted(userId)) {
            var pcContext = this;
            Post.create(message, userId, function(post) {
                pcContext._userPosts[userId] = post;
                cb(true);
            });   
        } else cb(false);
    },
    find: function(postId) {
      for(var i in this._userPosts) {
        if(this._userPosts[i].id() == postId) return this._userPosts[i];
      }
      return null;
    },
    postIds: function() {
        var postIds = [];
        for(var i in this._userPosts) {
            postIds.push(this._userPosts[i].id());
        }
        return postIds;
    },
    _hasPosted: function(userId) {
        if(this._userPosts[userId] !== undefined) return true; 
        return false;
    }
});