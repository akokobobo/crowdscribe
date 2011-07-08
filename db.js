var app = require('./app.js');
var redis = app.redis;

this.store = store;
this.getUniqueId = getUniqueId;

function getUniqueId(name, cb) {
  var key = name+':index';
  redis.get(key, function(e, r) {
    var index = 1;
    if(r !== null)
      index = parseInt(r.toString()) + 1;
      
    //record index, no worries about callback. Everything should go well ;)
    store(key, index);
    cb(index);
  });
}

function store(key, value, cb) {
  var valueType = (typeof value).toLowerCase();
  if((typeof cb).toLowerCase() !== 'function') cb = function(){};
  
  if(valueType === 'string' || valueType === 'number')
    redis.set(key, value, function(e, r){ cb(r) });
  else
    redis.HMSET(key, value, function(e, r){ cb(r) });
}
