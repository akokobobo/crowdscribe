var ids = 1;

module.exports.create = function(fbId, uname) {
    return new User(fbId, uname);
}

module.exports.find = function(userId, cb) {
    Base.find(MODEL_NAME, userId, cb);
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
    score: 0
}