
/**
 * Creates an empty player list
 */
this.create = function(maxPlayers) {
    return new PlayerList(maxPlayers);
}

function PlayerList(maxPlayers) {
    var _maxPlayers = maxPlayers;
    var _players = {};
    var _playerCount = 0;
    
    function add(uid) {
        if(!_players[uid] && !listIsFull()) {
            _players[uid] = createPlayerStruct(uid);
            calculatePlayerCount();
            return true;
        }
        return false;
    }
    
    function remove(uid) {
        delete _players[uid];
    }
    
    function playerCount() { return _playerCount; }
    
    function find(uid) {
        return _players[uid];
    }
    
    function findWithPostId(postId) {
        for(var i in _players) {
            var p = _players[i];
            if(p.post && p.post.id() === postId)
                return p;
        }
        return false;
    }
    
    function isInList(uid) {
        return _players[uid] !== undefined;
    }
    
    function bindPost(uid, post) {
        var u = find(uid);
        if (u.post == null) {
            u.post = post;
            return true;
        }
        return false;
    }
    
    function resetPostBinds() {
        for(var i in _players) _players.post = null;
    }
    
    //Utility functions
    function listIsFull() {
        return playerCount() == _maxPlayers;
    }
    
    function calculatePlayerCount() {
        var count = 0;
        for(var i in _players) {
            count++;
        }
        _playerCount = count;
    }
    
    function createPlayerStruct(id) {
        var _update_at = now();
        return {
            post: null,
            id: id,
            updatedAt: function() { return _update_at; },
            update: function() { _update_at = now(); }
        }
    }
    
    //Public Interface.
    return {
        add: add,
        remove: remove,
        bindPost: bindPost,
        find: find,
        count: playerCount,
        resetPostBinds: resetPostBinds
    }
}

function now() { return (new Date()).getTime(); }