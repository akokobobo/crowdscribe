var User = require('./user.js');

var ids = 1;
module.exports.create = function(message, userId, cb) {
  return new Post(message, userId);
};

function Post(message, userId) {
    this.id = ids++;
    this.message = message;
    this.userId = userId;
}

Post.prototype =  {
  id: null,
  message: null,
  userId: null,
  _submitedVotes: {},
  voteCount: 0,
  user: function() { return User.find(this.userId); },
  vote: function(userId) {
    if(!this.hasVoted(userId)) {
      this._submitedVotes[userId] = userId;
      this.voteCount++;
      return true;
    }
    return false;
  },
  voterIds: function() {
    var ids = [];
    for(var id in  this._submitedVotes) ids.push(parseInt(id));
    return ids;
  },
  hasVoted: function(userId) {
    //owner can not vote
    if(userId === this.userId) return true;
    if(this._submitedVotes[userId] !== undefined) return true;
    return false;
  },
  info: function() {
    return {
      id: this.id,
      voteCount: this.voteCount,
      userId: this.userId,
      message: this.message
    }
  }
}


