var Base = require('./base.js');

module.exports.create = function() {
    
}

function User() {
    
}

Base.extend(User, {
    attrs: ['username', 'password', 'token']
});