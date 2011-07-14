/**
 * Module dependencies.
 */
require('./nativeOverloads.js');
var express = require('express');

var redisModule = require('redis');
var redis = redisModule.createClient();
redis.select(1);
this.redis = redis;

var test = require('./tests.js');
test.start();

var Story = require('./models/story.js');
var Authenticate = require('./authenticate.js');
var currentUser = module.exports.currentUser = null;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'mustache');
	app.register('.mustache', require('stache'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.use(express.cookieParser());

// Routes

app.get('/', function(req, res){
  res.render('index');
});

/**
 * Register user and log them in automatically
 * @param {String} username
 * @param {String} password
 * @returns {JSON} { error: 'Username/Password no good, username Already taken' } || {result: 'success', token: '2121ffg'}
 */
app.post('/signup', function(req, res) {
  
});

/**
 * Logs in a user.
 * @param {String} username
 * @param {String} password
 * @returns {JSON} { error: 'Username and Password combo no good' } || {result: 'success', token: '2121ffg'}
 */
app.post('/signin', function(req, res) {
  
});

/**
 * AUTH REQUIRED
 * Returns all active stories
 * @param {Array} fields of story to be returned. ID is passed by default
 * @returns {result: [story]}
 */
app.get('/stories', function(req, res) {
  res.send(Story.all());
});

/**
 * Creates a story
 * @param {String} message The first post body message
 * @param {Number} maxPlayers, the maximum ammount of players that may join
 * @param {String} name, optional story name
 * @returns {Number} the story id created.
 */
app.get('/story/create', function(req, res) {
  
});



/**
 * Creates a story
 * @param {String} message The first post body message
 * @param {Number} maxPlayers, the maximum ammount of players that may join
 * @param {String} name, optional story name
 * @returns {Number} the story id created.
 */
app.get('/story/create', function(req, res) {
  if(!Authenticate.user(req.cookie.fb || "")) return res.send(Authenticate.INVALID_LOGIN)
  
  return Story.create(
    req.body.maxPlayers,
    currentUser,
    req.body.maxRounds,
    req.body.title,
    function(story) {
      res.send(story.id());
  });
  
});

/**
 * Returns a story object by id
 * @param {Array} fields of story to be returned. ID is passed by default
 */
app.get('/story/:id', function(req, res) {
  Story.find(req.params('id'), function(story) {
    res.send(story ? story.info() : 'Story not found');
  });
});

/**
 * Joins a story
 * @returns {Bool} true if joined success.
 * 
 */
app.get('/story/:id/join', function(req, res) {
  Story.find(req.params('id'), function(story) {
    res.send(story ? story.join(currentUser) : 'Story not found');
  });
});

/**
 * Explicitly leaves a story. Users are droped of the story if they timeout
 */
app.get('/story/:id/leave', function(req, res) {
  Story.find(req.params('id'), function(story) {
    res.send(story ? story.leave(currentUser) : 'Story not found');
  });
});

/**
 * Returns all users playing on a story
 * @param {Array} fields needed of user. ID is passed by default
 */
app.get('/story/:id/players', function(req, res) {
  Story.find(req.params('id'), function(story) {
    res.send(story ? story.playerList() : 'Story not found');
  });
});

/**
 * Returns all current posts that might be penting for votes
 */
app.get('/story/:id/posts', function(req, res) {
  Story.find(req.params('id'), function(story) {
    res.send(story ? story : 'Story not found')
    if(story) {
      story.post(req.body('message'), currentUser, function(success) {
	res.send(success);
      });
    } else {
      res.send('Story not found');
    }
  });
});

/**
 * Returns the story stream that has been submitted so far.
 */
app.get('/story/:id/stream', function(req, res) {
  
});

/**
 * Submits a post
 * @param {String} The post body message
 */
app.post('/story/:id/post', function(req, res) {
  Story.find(req.params('id'), function(story) {
    if(story) {
      story.post(req.body('message'), currentUser, function(success) {
	res.send(success);
      });
    } else {
      res.send('Story not found');
    }
  });
});

/**
 * Submits a vote on a post
 * @param {Number} Post ID
 */
app.post('/story/:id/vote', function(req, res) {
  Story.find(req.params('id'), function(story) {
    res.send(story ? story.vote(req.body('postId'), currentUser) : 'Story not found')
  });
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
