var Base = require('./base.js');
var PlayerList = require('./playerList.js');
var RoundSession = require('./roundSession.js');
var PostCollection = require('./postCollection.js');

var stories = [];

var MODEL_NAME = 'Story';

var MIN_PLAYERS = 3;
var MAX_MAX_PLAYERS = 20;
var DEFAULT_STORY_TITLE = 'It was a dark and stormy night.';
var POST_CHAR_LIMIT = 500;

module.exports.create = function(maxPlayers, createdById, maxRounds, title, cb) {
  if(!title || title > POST_CHAR_LIMIT) title = DEFAULT_STORY_TITLE;
  if(maxPlayers > MAX_MAX_PLAYERS) maxPlayers = MAX_MAX_PLAYERS;
  
  var story = new Story(maxPlayers, createdById, maxRounds, title);
  story.save(function(success) {
    console.log(story, "saved");
    stories.push(story);
    cb(story);
  })
  
}

/*module.exports.find = function(id, cb) {
  for(var i = 0; i < stories.length; i++) {
    if(stories[i].id() === id) return cb(stories[i]);
  }
  return cb(null);
}*/

var find = exports.find = function(id, cb) {
    Base.find(MODEL_NAME, id, cb);
}


function Story(maxPlayers, createdById, maxRounds, title) {
    this.attributes({
      name: MODEL_NAME,
      createdById: createdById,
      maxPlayers: maxPlayers,
      minPlayers: MIN_PLAYERS,
      title: title,
      roundSession: RoundSession.create(maxRounds),
      postCollection: null
    });
}

Base.extend(Story, {
  attrs: ['createById', 'maxPlayers', 'minPlayers', 'roundSession', 'title'],
  _playerList: {},
  playerList: function(uid) {
    var u = [];
    for(var id  in this._playerList) {
      u.push(id);
    }
    return u;
  },
  isRoomFull: function() { return (this.playerList().legnth === this.maxPlayers());  },
  storyStream: [],
  join: function(uid) {
    if(this.roundSession.isIdle() && !this.isRoomFull()) {
      this._playerList[uid] = Date.now();
    }
  },
  leave: function(uid) {
    if(this._playerList[uid] !== undefined) {
      delete this._playerList[uid];
      return true;
    }
    else
      return false;
  },
  posts: function() {
    if(this.roundSession.isWaitingForVotes())
      return this.postCollection().posts();
    else
      return [];
  },
  post: function(message, uid, cb) {
    if(message && this.roundSession().isWaitingForPosts())
      this.postCollection().add(message, uid, cb);
    else
      cb(false);
  },
  vote: function(postId, uid) {
    if(this.roundSession().isWaitingForVotes()) {
      var post = this.postCollection().find(postId);
      if(post) return post.vote(uid);
    }
    
    return false;
  },
  currentRound: function(){
    return this.roundSession().current();
  },
  state: function() {
    return this.roundSession().state();
  },
  
  //overwrites Base.save
  save: function(cb) {
    //Save Story Attributes.
    //Save currentPostCollection Attributes
    //Save stroyStream
    cb(this);
  }
});


  
  //====================================
  // Round Over. 
  //  *Figure out players points.
  //    loop through players and
  //    detect if they have posted. give points.
  //    detect if they have voted. give points.
  //  *Figure out winner.
  //    Detect post with highest votes.
  //    In case there are 2 or More Posts with equal vote count. 1 Will be picked randomly.
  //    Give Extra points to winner.
  //  *Figure out runner up.
  //    Detect post with highest votes after the winner.
  //    In Case Winner was picked randomly, runner up is automatically the post that lost the random draw.
  //    In Case there are multiple runner ups. One is picked at random.
  //  *Set State to 'waiting to players'.
  //  -Update versionIndex.
  //====================================
