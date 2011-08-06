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
        if(!this.hasPosted(userId)) {
            var pcContext = this;
            Post.create(message, userId, function(post) {
                pcContext._userPosts[userId] = post;
                cb(post !== null);
            });   
        } else cb(false);
    },
    find: function(postId) {
        for(var i in this._userPosts) {
            if(this._userPosts[i].id() === postId)
                return this._userPosts[i];
        }
        return false;
    },
    postIds: function() {
        var postIds = [];
        for(var i in this._userPosts) {
            postIds.push(this._userPosts[i].id());
        }
        return postIds;
    },
    posts: function() {
        var posts = [];
        for(var i in this._userPosts) {
            posts.push(this._userPosts[i]);
        }
        return posts;  
    },
    postsInfo: function() {
        var posts = [];
        for(var i in this._userPosts) {
            posts.push(this._userPosts[i].info());
        }
        return posts;
    },
    getWinnerAndRunnerUp: function() {
        var posts = this.posts();
        var winnerVote = 0;
        var runnerUpVote = 0;
        
        var postsByScore = {};
        
        while(posts.length) {
            var post = posts.pop();
            if(!postsByScore[post.voteCount()])
                postsByScore[post.voteCount()] = [];
                
            postsByScore[post.voteCount()].push(post);
            
            if(post.voteCount() > winnerVote) {
                runnerUpVote = winnerVote;
                winnerVote = post.voteCount();
            }
            
        }
        
        var winners = postsByScore[winnerVote] || [];
        var winnerRandomIndex = Math.floor(Math.random() * winners.length);
        
        var winner = winners.splice(winnerRandomIndex, 1);
        if(winner.length) winner = winner[0];
        else winner = null;
        
        var runnerUps = [];
        if(winners.length) runnerUps = winners;
        else if(postsByScore[runnerUpVote]) runnerUps = postsByScore[runnerUpVote];
        
        var runnerUpRandomIndex = Math.floor(Math.random() * runnerUps.length);
        var runnerUp = runnerUps.splice(runnerUpRandomIndex, 1);
        if(runnerUp.length) runnerUp = runnerUp[0];
        else runnerUp = null;
        
        return {
            winner: winner,
            runnerUps: runnerUp
        };   
    },
    hasPosted: function(userId) {
        if(this._userPosts[userId] !== undefined) return true; 
        return false;
    }
});