var Base = require('./base.js');

module.exports.create = function(maxRounds) {
    return new RoundSession(maxRounds);
}

var STATE = {
    IDLE: 1,
    ROUND_STARTING: 2,
    WAITING_FOR_POSTS: 3,
    WAITING_FOR_VOTES: 4
}

var halfSecond = (0.5).seconds();
var one = (1).seconds();
var five = (5).seconds();
var ten = (10).seconds();
var thirty = (30).seconds();
var minute = (30).minutes();

var time = halfSecond;

var TIMERS = {
  ROUND_STARTING: time,
  POST: time, //1minute
  VOTE: time //1minute
};

var PREVENT_UPDATE = true;

function RoundSession(maxRounds) {
    this.max = maxRounds;
    this.current = 1;
}


RoundSession.prototype =  {
    max: 10,
    current: 1,
    _state: STATE.IDLE,
    _update: function() {
        //In case any of the state has expired, it will fall through the next case.
        switch(this._state) {
            case STATE.ROUND_STARTING:
                //set round to 'waiting for posts' if 'round starting' has expired
                if(this._roundStartingExpired())
                    this._setState(STATE.WAITING_FOR_POSTS);
                else
                    break;
            case STATE.WAITING_FOR_POSTS:
                if(this._waitingForPostExpired())
                    this._setState(STATE.WAITING_FOR_VOTES);
                else
                    break;
            case STATE.WAITING_FOR_VOTES:
                if(this._waitingForVoteExpired())
                    this._roundEnded();
                else
                    break;
            default:
            break;
        }
    },
    _roundEnded: function() {
        this._setState(STATE.IDLE);
        this.current(this.current + 1);
    },
    _roundStartingExpired: function() { return Date.now() >= this._roundExpiration; },
    _waitingForPostExpired: function() { return Date.now() >= this._postExpiration; },
    _waitingForVoteExpired: function() { return Date.now() >= this._voteExpiration; },
    _roundExpiration: 0,
    _postExpiration: 0,
    _voteExpiration: 0,
    _calculateExpirations: function() {
        var timeNow = Date.now();
        this._roundExpiration = timeNow + TIMERS.ROUND_STARTING;
        this._postExpiration = this._roundExpiration + TIMERS.POST;
        this._voteExpiration = this._postExpiration + TIMERS.VOTE;
    
    },
    //Returns remaining timer (in ms) of the current session
    sessionEndsIn: function() {
        var timer = null;
        var timeNow = Date.now();
        switch(this._state) {
            case STATE.ROUND_STARTING:
                timer = this._roundExpiration - timeNow;
                    break;
            case STATE.WAITING_FOR_POSTS:
                timer = this._postExpiration - timeNow;
                    break;
            case STATE.WAITING_FOR_VOTES:
                timer = this._voteExpiration - timeNow;
                    break;
            default:
            break;
        }
        
        return timer;
    },
    start: function() {
        //can only start if state is idle.
        if(this.isIdle()) {
            this._setState(STATE.ROUND_STARTING);
            this._calculateExpirations();
            return true;
        }
        return false;
    },
    _stateChanged: false,
    stateChanged: function() {
        return this._stateChanged;
    },
    state: function(preventUpdate) {
        var oldState = this._state;
        //prevent from updating
        if(preventUpdate !== true) this._update();
        
        if(oldState === this._state) this._stateChanged = false;
        else this._stateChanged = true;
        
        return this._state;
    },
    _setState: function(state) {
      this._state = state;  
    },
    IDLE: STATE.IDLE,
    ROUND_STARTING: STATE.ROUND_STARTING,
    WAITING_FOR_POSTS: STATE.WAITING_FOR_POSTS,
    WAITING_FOR_VOTES: STATE.WAITING_FOR_VOTES,
    isIdle: function() {
        return this.state() === STATE.IDLE;
    },
    isStarting: function() {
       return this.state() === STATE.ROUND_STARTING; 
    },
    isWaitingForPosts: function() {
      return this.state() === STATE.WAITING_FOR_POSTS;  
    },
    isWaitingForVotes: function() {
        return this.state() === STATE.WAITING_FOR_VOTES;
    },
    isOver: function() {
        return this.isIdle() && this.current > this.max;
    },
    info: function() {
        return {
            current: this.current,
            max: this.max,
            state: this._state,
            expires: this.sessionEndsIn()
        }
    }
};