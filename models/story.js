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
var USER_TIME_OUT = (5).minutes();

module.exports.create = function(maxPlayers, createdById, maxRounds, title, cb) {
  if(!title || title > POST_CHAR_LIMIT) title = DEFAULT_STORY_TITLE;
  if(maxPlayers > MAX_MAX_PLAYERS) maxPlayers = MAX_MAX_PLAYERS;
  
  var story = new Story(maxPlayers, createdById, maxRounds, title);
  story.save(function(success) {
    stories.push(story);
    cb(story);
  })
  
}

var find = module.exports.find = function(id, cb) {
    Base.find(MODEL_NAME, id, cb);
}

module.exports.all = function() { return stories; }


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
    this._playerList[createdById] = Date.now();
    console.log(this._playerList);
}

Base.extend(Story, {
  attrs: ['createdById', 'maxPlayers', 'minPlayers', 'roundSession', 'title', 'stream', 'postCollection'],
  _playerList: {},
  playerList: function() {
    var u = [];
    for(var id  in this._playerList) {
      u.push(id);
    }
    return u;
  },
  isPlaying: function(uid) {
    if(this._playerList[uid] !== undefined &&
       this._playerList[uid] + USER_TIME_OUT > Date.now())
      return true;
    else
      return false;
  },
  isRoomFull: function() { return (this.playerList().legnth === this.maxPlayers());  },
  postStream: [],
  stream: function() {
    var stream = [];
    for(var i = 0; i < this.postStream.length; i++) {
      stream.push(this.postStream[i].id());
    }
    return stream;
  },
  _isOkToJoin: function(uid) {
    return (this.roundSession().isIdle() && !this.isRoomFull() && this.createdById() !== uid);
  },
  _tryToStartRound: function() {
    if(this.playerList().length >= MIN_PLAYERS)
      this.roundSession().start();
  },
  join: function(uid) {
    if(this._isOkToJoin(uid)) {
      this._playerList[uid] = Date.now();
      this._tryToStartRound();
      return true;
    } else
      return false;
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
    if(this.postCollection())
      return this.postCollection().posts();
    else
      return [];
  },
  post: function(message, uid, cb) {
    if(!this.postCollection()) {
      //create PollCollection and recall this fuction
      var context = this;
      PostCollection.create(function(collection) {
        context.postCollection(collection);
        context.post(message, uid, cb);
      });
      return;
    }
    
    //PollCollection exisits, lets start posting
    if(message &&
       this.isPlaying(uid) &&
       this.roundSession().isWaitingForPosts())
      this.postCollection().add(message, uid, cb);
    else
      cb(false);
  },
  vote: function(postId, uid) {
    if(this.roundSession().isWaitingForVotes() && this.postCollection()) {
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
    var storyContext = this;
    //Save Story Attributes.
    Base.classPrototype.save.apply(storyContext, [function(success) {
      if(success && storyContext.postCollection()) {
        //Save currentPostCollection Attributes
          storyContext.postCollection().save(cb);
      } else {
        cb(success);
      }
    }]);
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
