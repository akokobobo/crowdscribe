var Base = require('./base.js');
var MODEL_NAME = 'Post';

/**
 * Creates and Saves a post.
 * @param {String} message
 * @param {Number} user id
 * @param {Function} cb the new post is passed as argument to callback
 */
module.exports.create = function(message, user, cb) {
  var post = new Post(message, user);
  post.save(function(success) {
    cb(post);
  });
};


var find = exports.find = function(id, cb) {
    Base.find(MODEL_NAME, id, cb);
}

function Post(message, userId) {
  //set default attributes
  this.attributes({name: MODEL_NAME, message: message, userId: userId});
}

Base.extend(Post, {
  attrs: ['userId', 'storyId', 'message'],
  //Private Variables
  _submitedVotes: {},
  _voteCount: 0,
  
  voteCount: function() { return this._voteCount; },
  vote: function(userId) {
    if(!this.hasVoted(userId)) {
      this._submitedVotes[userId] = userId;
      this._voteCount++;
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
    if(userId === this.userId()) return true;
    if(this._submitedVotes[userId] !== undefined) return true;
    return false;
  },
  info: function() {
    return {
      id: this.id(),
      voteCount: this.voteCount(),
      userId: this.userId(),
      message: this.message()
    }
  }
});


