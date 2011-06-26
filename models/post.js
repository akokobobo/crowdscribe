var db = require('../db');
var MODEL_NAME = 'Post';

/**
 * Creates and Saves a post.
 * @param {String} message
 * @param {Number} userId
 * @param {Number} storyId
 * @param {Function} cb the new post is passed as argument to callback
 */
this.create = function(message, userId, storyId, cb) {
  var post = new Post({message: message, userId: userId, storyId: storyId});
  post.save(function() {
    cb(post);
  });
};

function Post(attributes) {
  var _id = attributes['id'] || null;
  var _message = attributes['message'] || null;
  var _userId = attributes['userId'] || null;
  var _storyId = attributes['storyId'] || null;
  var _voteCount = 0;
  
  function id() { return id; }
  function message() { return _message; }
  function userId() { return _userId; }
  function storyId() { return _storyId; }
  function voteCount() { return _voteCount; }
  function name() { return MODEL_NAME; }
  
  var _submitedVotes = {};
  function vote(uId) {
    if(!hasVoted(uid)) {
      _submitedVotes[uid] = true;
      _voteCount++;
    }
  }
  
  //returns true is user id is not in the list of people who have already voted.
  //and user id is not the creator of the post
  function hasVoted(uid) {
    return (_submitedVotes[uid] === undefined && _submitedVotes[uid] !== userId());
  }
  
  
  function save(cb) {
    db.save(this, cb);
  }
  
  function attrs() {
    return {
      id: id(),
      userId: userId(),
      message: message(),
      storyId: storyId(),
      voteCount: voteCount()
    }
  }
  
  //Public Interface
  return {
    id: id,
    userId: userId,
    message: message,
    storyId: storyId,
    name: name,
    vote: vote,
    save: save,
    attrs: attrs,
    //to be used only when saving model
    setID: function(__id) { _id = __id; }
  }
  
}

