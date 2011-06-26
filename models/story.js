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