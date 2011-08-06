var Base = require('./base.js');
var PlayerList = require('./playerList.js');
var RoundSession = require('./roundSession.js');
var PostCollection = require('./postCollection.js');

var storiesById = {};
var ids = 1;

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
  
  
  /*story.save(function(success) {
    stories.push(story);
    cb(story);
  })*/
  
}

var find = module.exports.find = function(id, cb) {
  cb(storiesById[id] || null);
}


module.exports.all = function() { return stories; }

var EVENTS = {
  ROUND_STARTING: 'roundStarting',
  WATTING_FOR_VOTES: 'waittingForVotes',
  WATTING_FOR_POSTS: 'waittingForPosts',
  VOTE: 'vote',
  POST: 'post',
  TICK: 'tick'
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
    this._playerList[createdById] = Date.now();
}

Base.extend(Story, {
  attrs: ['createdById', 'maxPlayers', 'minPlayers', 'roundSession', 'title', 'stream', 'postCollection'],
  players: function() {
    var players = [];
    for(var id in this._connections) {
      players.push(this._connections[id].user);
    }
    return players;
  },
  _connections: {},
  playerCount: function() {
    var count = 0;
    for(var id in this._connections)
      count++;
    return count;
  },
  isPlayerConnected: function(socket) {
    for(var id in this._connections) {
      if(this._connections[id].user.id() == socket.user.id())
        return true;
    }
    return false;
  },
  _addConnection: function(socket) {
    this._connection[socket.trasport.sessionid] = socket;
    //bind story with socket.
    socket['story'] = this;
  },
  isRoomFull: function() { return !(this.playerCount() < this.maxPlayers());  },
  postStream: [],
  stream: function() {
    var stream = [];
    for(var i = 0; i < this.postStream.length; i++) {
      stream.push(this.postStream[i].id());
    }
    return stream;
  },
  _isOkToJoin: function(socket) {
    return (this.roundSession().isIdle() && !this.isRoomFull() && !this.isPlayerConnected(socket));
  },
  _startRound: function() {
    if(this.playerCount() >= MIN_PLAYERS) {
      if(this.roundSession().start()) {
        this.broadcast('roundStarting');
      }
    }
  },
  broadcast: function(channel, data) {
    for(var id in this._connections)
      this._connections[id]
        .emit(channel, data || undefined);
  },
  join: function(socket) {
    if(this._isOkToJoin(socket)) {
      this._addConnection(socket);
      this._startRound();
      return true;
    } else
      return false;
  },
  leave: function(uid) {
    
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
  
  _calculateWinnerAndUpdateScore: function() {
    var result = this.postCollection().getWinnerAndRunnerUp();
    if(!result.winner) return;
    var storyContext = this;
    
    this.players().forEach(function(player, i, arr) {
      var winner = result.winner.user().id() == player.id();
      var runnerUp = result.runnerUp.user().id() == player.id();
      var score = {
        winner: winner,
        runnerUp: runnerUp,
        pts: 0
      };
      
      if(storyContext.postCollection().hasPosted(player.id())) score.pts += 2;
      
      if(winner) score.pts += 4;
      else if(runnerUp) score.pts += 1;
      
      storyContext._previousScores[player.id()] = score;
      player.addScore(score.pts);
    });
    
  },
  
  update: function() {
    if(this.roundSession().isIdle()) {
      //round switched over
      if(this.roundSession().stateChanged()) {
        this._calculateWinnerAndUpdateScore();
      }
      
      this._startRound();
    }
  },
  
  info: function() {
    return {
      id: this.id(),
      posts: this.postsInfo(),
      round: this.roundSession().info(),
      playerList: this.playerList(),
      previouseScore: this._previousScores
    };
  },
  
  get_update: function(version) {
    this.update();
    //client is up to date
    if(parseInt(version) === this._version) return 1;
    
    
    return this.info();
  }
});

