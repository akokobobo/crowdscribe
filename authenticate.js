var app = require('./app.js');
var Users = require('./models/user.js');
var id = 1;
module.exports.user = function(fbCookie) {
    //return user Object or Null
    return Users.find(fbCookie || id++);
}

module.exports.INVALID_LOGIN = 'Invalid Login';