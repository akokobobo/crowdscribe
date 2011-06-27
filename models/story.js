var app = require('../app');
var redis = app.redis;

var MIN_PLAYERS = 6;
var MAX_MAX_PLAYERS = 20;
var defaultFirstPost = 'It was a dark and stormy night.';
var POST_CHAR_LIMIT = 500;
this.create = function(maxPlayers, firstPost, name) {
  if(maxPlayers < MIN_PLAYERS || maxPlayers > MAX_MAX_PLAYERS) maxPlayers = MAX_MAX_PLAYERS;
  if(!firstPost || firstPost.length > POST_CHAR_LIMIT) firstPost = defaultFirstPost;
  if(!name) name = firstPost;
}

var STORY = {
  WAITING_FOR_PLAYERS: 0x1,
  ROUND_STARTING: 0x2,
  WAITING_FOR_POSTS: 0x3,
  WAITING_FOR_VOTES: 0x4
};

var TIMER = {
  ROUND_STARTING: 3000,
  POST: 10000, //1minute
  VOTE: 10000 //1minute
};

function Story(attributes) {
  var _id, _userId, _maxPlayers, _maxRounds;
  var _currentRound = 1;
  //list of players.
  //key are user ids, values are the time they last check in. This timer will also determin thier Timeout State.
  var _playerList = {};
  
  //queues players to join the next round.
  var idleList = [];
  var _playerCount
  
  function id() { return _id; }
  function maxPlayers() { return _maxPlayers; }
  function playerCount() { return _playerCount; }
  
  //
  function currentRound() { return _currentRound; }
  
  //User Joins
  function join(uid) {
    if(!_playerList[uid] && roomIsFull()) return;
    
    //if story has not started yet.
    _playerList[uid] = now();
    recountPlayers();
  }
  
  function roomIsFull() { return playerCount() == maxPlayers(); }
  function recountPlayers() {
    var count = 0;
    for(var i in _playerList)
      count++;
    _playerCount = count;
  }
  
}

function now() { return (new Date()).getTime(); }