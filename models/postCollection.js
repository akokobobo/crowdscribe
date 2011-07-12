var Base = require('./base.js');
var Post = require('./post.js');
var MODEL_NAME = 'PostCollection';

exports.create = function(cb) {
    var postCollection = new PostCollection();
    postCollection.save(function(success) {
        cb(postCollection);
    });
}

var find = exports.find = function(id, cb) {
    Base.find(MODEL_NAME, id, cb);
}

function PostCollection() {
    this.attributes({name: MODEL_NAME, count: 0});
}

Base.extend(PostCollection, {
    attrs: ['count', 'postIds'],
    _userPosts: {},
    add: function(message, userId, cb) {
        if(!this._hasPosted(userId)) {
            var pcContext = this;
            Post.create(message, userId, function(post) {
                console.log("Created Post: ", post.id());
                pcContext._userPosts[userId] = post;
                cb(post !== null);
            });   
        } else cb(false);
    },
    postIds: function() {
        var postIds = [];
        for(var i in this._userPosts) {
            console.log(i, " : ",this._userPosts[i].id());
            postIds.push(this._userPosts[i].id());
        }
        console.log('PostIDS ARE: ', postIds);
        return postIds;
    },
    _hasPosted: function(userId) {
        if(this._userPosts[userId] !== undefined) return true; 
        return false;
    }
});