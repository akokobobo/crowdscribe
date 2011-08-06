exports.create = function() {
    return new PostCollection();
}

function PostCollection() {
    
}

PostCollection.prototype = {
    _userPosts: {},
    _userVotes: {},
    add: function(message, userId) {
        if(!this.hasPosted(userId)) {
            this._userPosts[userId] = Post.create(message, userId);
            return true;
        } else {
            return false;
        }
    },
    find: function(postId) {
        for(var i in this._userPosts) {
            if(this._userPosts[i].id === postId)
                return this._userPosts[i];
        }
        return false;
    },
    vote: function(postId, userId) {
        return this.find(postId).vote(userId);
    },
    posts: function() {
        var posts = [];
        for(var i in this._userPosts) {
            posts.push(this._userPosts[i]);
        }
        return posts;
    },
    postInfo: function() {
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
            if(!postsByScore[post.voteCount])
                postsByScore[post.voteCount] = [];
                
            postsByScore[post.voteCount].push(post);
            
            if(post.voteCount > winnerVote) {
                runnerUpVote = winnerVote;
                winnerVote = post.voteCount;
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
}