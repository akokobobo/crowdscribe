var assert = require('assert');
var redis = require('./app.js').redis;
var Post = require('./models/post.js');
var RoundSession = require('./models/roundSession.js');

module.exports.start = function() {
    testPosts(function() {
        testRoundSession(function() {
            title("TESTS FINISHED");
        });
    });
    
}

function testPosts(done) {
    title("Testing POSTS...");
    Post.create("Hello", 123, function(post) {
        ok(post.id() > 0, "Id is " + post.id() + " > 0");
        equal(post.message(), "Hello", "Message passed");
        equal(post.userId(), 123, "UserId passed");
        ok(post.vote(123) === false, "Post Owner Could not vote");
        ok(post.vote(124), "Some other user could vote");
        ok(post.vote(124) === false, "Same User Cannot vote twice");
        equal(post.voteCount(), 1, "Vote count = 1");
        equal(post.voterIds().length, 1, "Correct Amount of voters");
        ok(post.voterIds()[0] === 124, "First voter is correct");
        
        done();
    });
}

function testRoundSession(done) {
    title("Testing RoundSession...");
    var maxRounds = 2;
    RoundSession.create(maxRounds, function(round) {
        equal(round.max(), maxRounds, "Max rounds " + round.max());
        equal(round.current(), 1, "Current round is 1");
        ok(round.isIdle(), "Round is IDLE");
        round.start();
        ok(round.isStarting(), "Round is Starting");
        title("Session Ends in " + round.sessionEndsIn());
        setTimeout(function() {
            ok(round.isWaitingForPosts(), "Waiting for Posts");
            title("Session Ends in " + round.sessionEndsIn());
            setTimeout(function() {
                ok(round.isWaitingForVotes(), "Waiting for Votes");
                title("Session Ends in " + round.sessionEndsIn());
                
                setTimeout(function() {
                    ok(round.isOver(), "All rounds are over");
                    
                    
                    done();
                }, round.sessionEndsIn() + 10);
                
            }, round.sessionEndsIn() + 10);
            //safe milisecond
        }, round.sessionEndsIn() + 10);
        
    })
}


//SOME UTILITY FUNCTIONS
function title(message) {
    console.log(message + "\n");
}

function passTest(message) {
    console.log('+\t' + message);
}

function failTest(message) {
    console.log('-FAIL\t' + message);
}

function ok(test, message) {
    if(test === true) {
        passTest(message);
    } else {
        failTest(message);
    }
}

function equal(actual, expected, message) {
    if(actual === expected) passTest(message);
    else failTest("Failed '" + message +"' Expected: " + expected + " Got: " + actual);
}