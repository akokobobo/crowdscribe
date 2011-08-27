var ids = 1;

var create = module.exports.create = function(fbId, uname) {
    return new User(fbId, uname);
}

module.exports.find = function(userId, cb) {
    if(userById[userId])
        return userById[userId];
    else
        return create(userId, "Auto generated" + userId);
}

var userById = {};
function User(fbid, username) {
    this.id = fbid;
    this.username = username;
    
    userById[this.id] = this;
}


User.prototype = {
    id: null,
    username: '',
    score: 0,
    info: function() {
        return {
            id: this.id,
            username: this.username,
            score: this.score
        };
    }
}

create(1, "Adi1");
create(2, "Adi2");
create(3, "Adi3");