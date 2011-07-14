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
    this.attributes({max: maxRounds, current: 1});
}


Base.extend(RoundSession, {
    attrs: ['max', 'current'],
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
        this.current(this.current() + 1);
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
        }
    },
    state: function(preventUpdate) {
        if(preventUpdate !== true)
            this._update();
        return this._state;
    },
    _setState: function(state) {
      this._state = state;  
    },
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
        return this.isIdle() && this.current() > this.max();
    },
    save: function() { /*This model does not save*/ }
});