var RoundSession = require('./roundSession.js');
var PostCollection = require('./postCollection.v2.js');
var User = require('./user.js');

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
  
  cb(new Story(maxPlayers, createdById, maxRounds, title));
}

module.exports.all = function() {
  var all = [];
  for(var id in storiesById) {
    all.push(storiesById[id]);
  }
  return all;
}

var find = module.exports.find = function(id, cb) {
  cb(storiesById[id] || null);
}


function Story(maxPlayers, createdById, maxRounds, title) {
    this.id = ids++;
    this.createdById = createdById;
    this.maxPlayers = maxPlayers;
    this.minPlayers = MIN_PLAYERS;
    this.title = title;
    this.roundSession = RoundSession.create(maxRounds);
    this.postCollections = PostCollection.create();
    
    storiesById[this.id] = this;
}

Story.prototype = {
  id: null,
  createdById: null,
  maxPlayers: null,
  minPlayers: null,
  title: null,
  roundSession: null,
  postCollections: null,
  currentRound: function() {
    return this.roundSession.current;
  },
  
  
  connections: {},
  playerCount: function() {
    var count = 0;
    for(var id in this.connections)
      count++;
    return count;
  },
  isPlayerConnected: function(socket) {
      for(var id in this.connections) {
        if(this.connections[id].user.id == socket.user.id)
          return true;
      }
      return false;
  },
  isRoomFull: function() { return !(this.playerCount() < this.maxPlayers);  },
  addConnection: function(socket) {
      this.connection[socket.trasport.sessionid] = socket;
  },
  broadcast: function(event, data, excludeSocket) {
      for(var id in this.connections) {
          if(this.connections[id] != excludeSocket) {
              this.connections[id].emit(event, data || null);
          }
      }
  },
  
  join: function(socket) {
      //add to the list if user id of this socket is not in the connections
      if(this.okToJoin(socket)) {
          this.addConnection(socket);
          //broadcast user joined
          this.broadcast('join', socket.user.info(), socket);
          return true;
      }
      return false;
  },
  post: function(message, socket) {
    if(message && this.isPlayerConnected(socket) && this.roundSession.isWaitingForPosts()) {
      if(this.postCollection.add(message, socket.user.id)) {
        return true;  
      }
    }
    return false;
  },
  vote: function(postId, socket) {
    if(this.roundSession.isWaitingForVotes()) {
      var post = this.postCollection.find(postId);
      if(post && post.vote(socket.user.id))
        return true;
    }
    
    return false;
  },
  _calculateWinnerAndUpdateScore: function() {
    var result = this.postCollection().getWinnerAndRunnerUp();
    if(!result.winner) return;
    
    this.postCollection().posts().forEach(function(post, i, arr) {
      post.user().score += 1;
    });
    
    result.winner.user().score += 4;
    result.runnerUp.user().score += 2;
    
    this.broadcast('score:update', {winner: result.winner.userId, runnerUp: result.runnerUp.userId});
  },
  tick: function() {
    var state = this.roundSession.state();
    var stateChanged = this.roundSession.stateChanged();
    if(state === this.roundSession.IDLE) {
      //round switched over
      if(stateChanged) {
        this._calculateWinnerAndUpdateScore();
      }
      //start round
      this.roundStart();
      return;
    }
    
    if(stateChanged) {
      var channel;
      switch(state) {
        case this.roundSession.ROUND_STARTING:
          channel = 'round:waiting_for_posts';
          break;
        case this.roundSession.WAITING_FOR_POSTS:
          channel = 'round:waiting_for_posts';
          break;
        case this.roundSession.WAITING_FOR_VOTES:
          channel = 'round:waiting_for_votes';
          break;
        default:
        break;
      }
      
      if(channel)
        this.broadcast(channel);
    }
  },
  
  roundStart: function() {
    if(this.roundSession.isIdle() && this.playerCount() >= this.minPlayers) {
      this.roundSession.start();
      this.broadcast('round:starting');
    }
  },
  
  okToJoin: function(socket) {
      return (this.roundSession.isIdle() && !this.isRoomFull() && !this.isPlayerConnected(socket));
  },
  
  info: function() {
    return  {
      id: this.id,
      title: this.title,
      createdById: this.createdById,
      maxPlayers: this.maxPlayers,
      minPlayers: this.minPlayers,
      roundSession: this.roundSession.state(),
      postCollections: this.postCollections.postInfo()
    };
  }
}


