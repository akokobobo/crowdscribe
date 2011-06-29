var PlayerList = require('../playerList.js');

var MIN_PLAYERS = 6;
var MAX_MAX_PLAYERS = 20;
var defaultFirstPost = 'It was a dark and stormy night.';
var POST_CHAR_LIMIT = 500;

this.create = function(maxPlayers, firstPost, name) {
  
}

var STORY_STATE = {
  WAITING_FOR_PLAYERS: 0x1,
  ROUND_STARTING: 0x2,
  WAITING_FOR_POSTS: 0x3,
  WAITING_FOR_VOTES: 0x4
};

var TIMER = {
  ROUND_STARTING: 1000,
  POST: 1000, //1minute
  VOTE: 1000 //1minute
};

function Story(attributes) {
  var _id, _userId, _maxPlayers, _maxRounds, _minPlayers;
  var _currentRound = 1;
  var _state = STORY_STATE.WAITING_FOR_PLAYERS;
  //list of players.
  var _playerList = PlayerList.create(_maxPlayers);
  
  //queues players to join the next round.
  var idleList = [];
  var _playerCount = 0;
  
  function id() { return _id; }
  function maxPlayers() { return _maxPlayers; }
  function minPlayers() { return _minPlayers; }
  function playerCount() { return _playerList.playerCount(); }
  function currentRound() { return _currentRound; }
  function getState() { return _state; }
  
  //User Joins
  function join(uid) {
    if(isWaitingForPlayers())
      return _playerList.add(uid);
    else
      return false;
  }
  
  //User leaves the story
  function leave(uid) {
    _playerList.remove(uid);
  }
  
  function post(uid, userPost) {
    if(isWaitingForPosts())
      return _playerList.bindPost(uid, userPost);
    else
      return false;
  }
  
  function vote(uid, postId) {
    if(isWaitingForVotes()) {
      var u = _playerList.findByPostId(postId);
      if (u) {
        return u.post.vote(uid);
      }
    }
    
    return false;
  }
  
  var versionIndex = 0;
  
  //Updates story state
  function update() {
    //current state
    if(isWaitingForPlayers()) {
      //state switches to round starting if minimum players have join the game
      if(_playerList.count() >= minPlayers()) {
        setState('ROUND_STARTING');
        preCalculateExpirationTimers();
      }
    } else if(isRoundStarting()) {
      if(roundStartingHasExpired()) {
        setState('WAITING_FOR_POSTS');
      }
    } else if(isWaitingForPosts()) {
      if(waitingForPostsHasExpired()) {
        setState('WAITING_FOR_VOTES');
      }
      
    } else if(isWaitingForVotes()) {
      if(waitingForVotesHasExpired()) {
        roundIsOver();
      }
    }
  }
  
  //============================
  // Pre-Calculate expiration timers On Round Start
  //  (this includes from rounding starting to end of votes)
  //============================
  
  //expirationTimer will be a copy of TIMER constant with time values which indecate when a state expires
  
  var expirationTimer = {};
  function preCalculateExpirationTimers() {
    var timeNow = now();
    var previousTimer = 0;
    for(var i in TIMER) {
      roundTimers[i] = timeNow + TIMER[i] + previousTimer;
      previousTimer = TIMER[i];
    }
  }
  
  //Expiration Utility functions
  function roundStartingHasExpired() { return now() >= expirationTimer['ROUND_STARTING']; }
  function waitingForPostsHasExpired() { return now() >= expirationTimer['WAITING_FOR_POSTS']; }
  function waitingForVotesHasExpired() { return now() >= expirationTimer['WAITING_FOR_VOTES']; }
  
  
  //Utility functions
  function isRoundStarting() { return getState() == STORY_STATE.ROUND_STARTING; }
  function isWaitingForPlayers() { return getState() == STORY_STATE.WAITING_FOR_PLAYERS; }
  function isWaitingForPosts() { return getState() == STORY_STATE.WAITING_FOR_POSTS; }
  function isWaitingForVotes() { return getState() == STORY_STATE.WAITING_FOR_VOTES; }
  
  function setState(stateToSetStr) {
    if(STORY_STATE[stateToSetStr] === undefined) throw("Tying to set illegal story state " + stateToSetStr);
    
    _state = STORY_STATE[stateToSetStr];
  }
  
  //Gets time elapsed from the last roundTimeStamp to now
  function getTimeElapsed() {
    return now() - _roundTimeStamp;
  }
  
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
  function roundIsOver() {
    
  }
  
  //Public Interface
  return {
    
  }
  
}
