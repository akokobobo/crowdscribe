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
  _version: 1,
  updateVersion: function() {
    this._version++;
  },
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
    if(this.playerList().length >= MIN_PLAYERS) {
      this.roundSession().start();
      this.updateVersion();
    }
  },
  join: function(uid) {
    if(this._isOkToJoin(uid)) {
      this._playerList[uid] = Date.now();
      this._tryToStartRound();
      this.updateVersion();
      return true;
    } else
      return false;
  },
  leave: function(uid) {
    if(this._playerList[uid] !== undefined) {
      delete this._playerList[uid];
      this.updateVersion();
      return true;
    }
    else
      return false;
  },
  postsInfo: function() {
    if(this.postCollection())
      return this.postCollection().postsInfo();
    else
      return [];
  },
  post: function(message, uid, cb) {
    if(!this.postCollection()) {
      //create PollCollection and recall this fuction
      var context = this;
      PostCollection.create(function(collection) {
        //setting collection
        context.postCollection(collection);
        //and recalling the function
        context.post(message, uid, cb);
      });
      return;
    }
    
    //PollCollection exisits, lets start posting
    if(message && this.isPlaying(uid) && this.roundSession().isWaitingForPosts()) {
      this.postCollection().add(message, uid, function(success) {
        if(success)
          this.updateVersion();
        cb(success);
      });
    } else {
      cb(false);
    }
  },
  vote: function(postId, uid) {
    if(this.roundSession().isWaitingForVotes() && this.postCollection()) {
      var post = this.postCollection().find(postId);
      if(post && post.vote(uid)) {
          this.updateVersion();
          return true;
      }
    }
    
    return false;
  },
  currentRound: function(){
    return this.roundSession().current();
  },
  state: function() {
    var roundState = this.roundSession().state();
    if(this.roundSession().stateChanged()) this.updateVersion();
    return roundState;
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
  },
  
  _getWinnerPosts: function() {
    var winnerPost = [];
    var highVote = 0;
    var posts = this.posts();
    
    while(posts.length) {
      var post = posts.pop();
      
      if(post.voteCount() > highVote) {
        winnerPost = [];
        winnerPost.push(post);
        highVote = post.voteCount();
      } else if (post.voteCount() === highVote) {
        winnerPost.push(post);
      }
    }
    return winnerPost;
  },
  
  
  _calculateWinnerAndUpdateScore: function() {
   var winnerPosts = this._getWinnerPosts(0);
    var runnerUp = [];
    if(winnerPosts) {
      //select a winner at random.
      winner = winnerPosts.splice(Math.floor(Math.random() * winnerPosts.length), 1)[0];
      runnerUp = winnerPosts;
    }
    
    if(!runnerUp.length) runnerUp = this._getRunnerUp(winner.voteCount());
    
  },
  
  update: function() {
    var somethingChanged = false;
    //============
    //Round Idle
    //============
    if(this.roundSession().isIdle()) {
      //round switched over
      if(this.roundSession().stateChanged()) {
        this._calculateWinnerAndUpdateScore();
        this._tryToStartRound();
        this.updateVersion();
      } else {
        this._tryToStartRound();
        this.updateVersion();
      }
    }
  },
  
  info: function() {
    return {
      id: this.id(),
      posts: this.postsInfo(),
      round: this.roundSession().info(),
      playerList: this.playerList()
    }
  },
  
  get_update: function(version) {
    this.update();
    //client is up to date
    if(parseInt(version) === this._version) return 1;
    
    
    return this.info();
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
