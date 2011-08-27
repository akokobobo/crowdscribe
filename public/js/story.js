(function($) {
    var storyState = null;
    var STATE = {
        IDLE: 1,
        ROUND_STARTING: 2,
        WAITING_FOR_POSTS: 3,
        WAITING_FOR_VOTES: 4
    }
    
    var $playerList, $streamList;
    var socket;
    
    $(document).ready(function() {
        $playerList = $('#players ul');
        $streamList = $('#story ol');
        
        socket = io.connect('http://localhost:80');
        
        socket.on('connect', function () {
            setupAllListeners();
            //join story
            joinStory($('#story-id').val());
        });

    });
    
      /*
   story:post - emit/listen
story:tick - emit/listen
story:vote - emit/listen
story:join - emit/listen
player:joined - listen
story:join_error - listen
round:starting - listen
round:waiting_for_posts - listen
round:waiting_for_votes - listen
round:switch - listen
score:update

*/
    function joinStory(id) {
        socket.emit('story:join', {id: id});
    }
    
    function setupAllListeners() {
        socket.on('join_error', function() {
            console.error('Ouch something went wrong while joining the story');
        });
        
        socket.on('story:joined', function(storyInfo) {
            console.log(storyInfo);
           //joined success, setting everything up.
           /*{
            id: this.id,
            title: this.title,
            createdById: this.createdById,
            maxPlayers: this.maxPlayers,
            minPlayers: this.minPlayers,
            roundSession: this.roundSession.state(),
            postCollections: this.postCollections.postInfo(),
            players: [],
            stream: []
          };*/
           
            //populate story so far.
            populateStorySoFar([{id: null, message: storyInfo.title}].concat(storyInfo.stream));
            
            //populate players list
            populatePlayerList(storyInfo.players)
            
            //PLAYER CAN ONLY BE IN THIS FUNCTION IF ROUND IS IDLE
            //set story state to idle
            storyState = STATE.IDLE;
            startTicker();
        });
        
//round:starting - listen
//round:waiting_for_posts - listen
//round:waiting_for_votes - listen
        socket.on('round:starting', function(roundInfo) {
            console.log(arguments);
            //hide posting area
            hidePostForm();
            //hide entries area.
            hideEntryList()
            //display round number
            displayRoundNumber(roundInfo.number);
            //display starting state
            setRoundState(STATE.ROUND_STARTING);
            //display count down
            startCountDown(roundInfo.expires);
            
        });
        
        socket.on('player:joined', function(userInfo) {
            $playerList.append(createPlayer(userInfo));
        });
        
    }
    
    function populateStorySoFar(posts) {
        $streamList.children().remove();
        for(var i = 0; i < posts.length; i++) {
            $streamList.append(createPost(posts[i]));
        }
    }
    
    function populatePlayerList(players) {
        $playerList.children().remove();
        for(var i = 0; i < players.length; i++) {
            $playerList.append(createPlayer(players[i]));
        }
    }
    
    
    function createPost(post) {
        return $('<li class="entry" data-post-id="'+ post.id +'">'
                        +'<span class="content">' + post.message + '</span>'
            +'</li>');
    }
    
    function createPlayer(player) {
        return $('<li class="player" data-player-id="' + player.id + '">'
                        +'<span class="name">' + player.username + '</span> (<span class="points">0</span>)'
                +'</li>');
    }
    
    function hidePostForm() {
        $('#round .entry-form').hide();
    }
    
    function hideEntryList() {
        $('#entries').hide();
    }
    
    function displayRoundNumber(number) {
        $('#round>h2').html('Round ' + number);
    }
    
    function setRoundState(state) {
        var $state = $('#round>h4 .state');
        switch(state) {
            case STATE.ROUND_STARTING:
                $state.html('Starting in');
                break;
            case STATE.WAITING_FOR_POSTS:
                $state.html('Posting expires in');
                break;
            case STATE.WAITING_FOR_VOTES:
                $state.html('Voting expires in');
                break;
            default:
                break;
        }
    }
    
    function startCountDown(expires) {
        var expiretionDate = Date.now() + expires;
        
        $('#round>h4 .timer').html(getNiceTimer(expirationDate))
        
        var token = setInterval(function() {
            
        }, 1000);
    }
    
    function getNiceTimer(expirationDate) {
        var now = Date.now();
        var minutes = 0;
        var seconds = 0;
        return (minutes || "") + ":" + seconds;
    }
    
    
    var tickTimer = 1000;
    function startTicker() {
        /*setInterval(function() {
            socket.emit('tick');
        }, tickTimer);*/
    }

})(jQuery);