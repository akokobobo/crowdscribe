var Story = require('./models/story.v2.js');
var Authenticate = require('./authenticate.js');


var io = require('socket.io').listen(80);

io.sockets.on('connection', function (socket) {
  socket['user'] = socket.handshake.user;
  /*
   story:post - emit/listen
story:tick - emit/listen
story:vote - emit/listen
story:join - emit/listen
story:join_error - listen
round:starting - listen
round:waiting_for_posts - listen
round:waiting_for_votes - listen
round:switch - listen
score:update

*/
  //Listen for disconnect
  socket.on('disconnect', function () {
    sockets.emit('user disconnected');
  });
  
  //story params {id: 1}
  socket.on('story:join', function(story) {
    //return if socket has already a story binded to it
    if(socket['story']) return;
    
    Story.find(story.id, function(stry) {
      if(stry.join(socket)) {
        //bind story to this client
        socket['story'] = stry;
        //creates listeners for posting, voting etc...
        createSocketListeners(socket);
        //emit story info to client
        socket.emit('story:info', stry.info());
      }
      else
        socket.emit('join_error');
    });
  });
  
  function createSocketListeners(socket) {
    //post {message: "hello world"}
    socket.on('post', function(post) {
      socket.story.post(post.message, socket);
    });
    
    //vote {postId: 3}
    socket.on('vote', function(vote) {
      socket.story.vote(vote.postId, socket);
    });
    
    socket.on('tick', function() {
      socket.story.tick();
    });
  }
});

//SOCKET AUTHENTICATE
io.configure(function (){
  io.set('authorization', function (handshakeData, callback) {
    
    var user = Authenticate.user(handshakeData.headers.cookie);
    handshakeData['user'] = user;
    callback(
      user !== null ? undefined : "Count not authenticate",
      user !== null
    );
  });
});

