var assert = require('assert');
var redis = require('./app.js').redis;
var Post = require('./models/post.js');
var PostCollection = require('./models/postCollection.js');
var RoundSession = require('./models/roundSession.js');
var Story = require('./models/story.js');

module.exports.start = function() {
    /*testPosts(function() {
        testRoundSession(function() {
            testPostCollections(function() {
                testStory(function() {
                    summary();
                });
            });
        });
    });*/
    testStory(function() {
        summary();
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
    var round = RoundSession.create(maxRounds);
    equal(round.max(), maxRounds, "Max rounds " + round.max());    
    runRoundSession(round, function() {
        runRoundSession(round, done, true);
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

function testStory(done) {
    title("Testing Story...");
    //Messages;
    
    var msg2 = "And i needed to pee!";
    var msg3 = "In someone else's bed";
    var msg4 = "Besides a curb";
    
    //Create Story
    var players = [123, 124, 125, 126, 127, 128, 129, 130];
    var rounds = 6;
    var maxPlayers = 5;
    var storyTitle = "I woke up";
    Story.create(maxPlayers, players[0], rounds, storyTitle, function(story) {
        ok(story.id() > 0, "Story created with id: " + story.id());
        equal(story.title(), storyTitle, "Story title is ok");
        equal(story.maxPlayers(), maxPlayers, "Max Players is ok");
        equal(story.currentRound(), 1, "current round is 1");
        equal(story.state(), 1, "State is idle");
        
        
        //try to post a message
        story.post(msg2, players[0], function(success) {
            ok(!success, "Could not post");
            //try to vote
            ok(!story.vote(1, players[0]), "Could not vote");
            //player 2 joins
            ok(!story.join(players[0]), "Player could not join");
            equal(story.playerList().length, 1, "Still only 1 player");
            equal(story.playerList()[0].toString(), players[0].toString(), "And the player in story is the creator");
            
            //2 new players join and the game should start
            story.join(players[1]);
            story.join(players[2]);
            ok(story.roundSession().isStarting(), "Story is starting...");
            
            //players should not be able to post or vote
            story.post(msg2, players[1], function(success) {
                ok(!success, "Could not post again.");
                ok(!story.vote(1, players[1]), "Could not vote again");
            
                setTimeout(function() {
                    //players should be allowed to post but not vote
                    ok(story.roundSession().isWaitingForPosts(), "Watiting for Posts");
                    story.post(msg2, players[0], function(s1) {
                        story.post(msg3, players[1], function(s2) {
                            story.post(msg3, players[2], function(s3) {
                                ok(s1 === true && s2 === true && s3 === true, "All posts where a success");
                                
                                //Getting ready to vote
                                setTimeout(function() {
                                    var posts = story.posts();
                                    //voting
                                    ok(!story.vote(posts[0].id, players[0]), "Player could not vote on his own post");
                                    ok(story.vote(posts[0].id, players[1]), "Success Vote");
                                    ok(story.vote(posts[0].id, players[2]), "Success Vote");
                                    var posts = story.posts();
                                    equal(posts[0].voteCount, 2, "Post has 2 votes");
                                    
                                    done();
                                    /*
                                    title("peak story data");
                                    Story.find(story.id(), function(data) {
                                        console.log(data);
                                        
                                        done();
                                    });*/
                                }, story.roundSession().sessionEndsIn() + 10);
                            });
                        });
                    });
                    
                    
                }, story.roundSession().sessionEndsIn() + 10);
            });
        });
    });
}







//SOME UTILITY FUNCTIONS
function title(message) {
    console.log(message + "\n");
}

function passTest(message) {
    console.log('+\t' + message);
    pass++;
}

function failTest(message) {
    console.log('-FAIL\t' + message);
    fail++;
}

function summary() {
    title((fail + pass) + " tests run! " + fail + " failed and " + pass + " passed");
}

var fail = 0;
var pass = 0;

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