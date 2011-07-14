var assert = require('assert');
var redis = require('./app.js').redis;
var Post = require('./models/post.js');
var PostCollection = require('./models/postCollection.js');
var RoundSession = require('./models/roundSession.js');

module.exports.start = function() {
    testPosts(function() {
        testRoundSession(function() {
            testPostCollections(function() {
                summary();
            });
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
        runRoundSession(round, function() {
            runRoundSession(round, done, true);
        });
    });
}

function testPostCollections(done) {
    title("Testing PostCollections...");
    PostCollection.create(function(pCollection){
        ok(pCollection.id() > 0, "Id is " + pCollection.id() + " > 0");
        pCollection.add("Hello There", 123, function(success) {
            ok(success, "Post created and saved");
            equal(pCollection.postIds().length, 1, "There is one post");
            pCollection.add("Hello", 123, function(success) {
                ok(!success, "Rejected post from same user");
                
                pCollection.add("Hello2", 1234, function(success) {
                    ok(success, "Second post added");
                    
                    pCollection.save(function(success) {
                        PostCollection.find(pCollection.id(), function(saveData) {
                            done();
                        });
                    });
                });
            });
        });
    }); 
}

function runRoundSession(round, cb, checkOver) {
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
                if(checkOver)
                    ok(round.isOver(), "All rounds are over");
                
                
                cb();
            }, round.sessionEndsIn() + 10);
            
        }, round.sessionEndsIn() + 10);
        //safe milisecond
    }, round.sessionEndsIn() + 10);
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

function summary() {
    title((fail + pass) + " tests run! " + fail + " failed and " + pass + " passed");
}

var fail = 0;
var pass = 0;

function ok(test, message) {
    if(test === true) {
        passTest(message);
        pass++;
    } else {
        failTest(message);
        fail++;
    }
}

function equal(actual, expected, message) {
    if(actual === expected) passTest(message);
    else failTest("Failed '" + message +"' Expected: " + expected + " Got: " + actual);
}