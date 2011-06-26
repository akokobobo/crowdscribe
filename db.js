var app = require('../app');
var redis = app.redis;

this.save = function(model, cb) {
  if(model.id() == null) {
    getIndex(model.name(), function(index) {
      model.setId(index);
      save(model, cb);
    });
  } else {
    save(model, cb);
  }
}

this.find = function() {  }

function save(model, cb) {
  redis.HMSET(
      model.name() + ':' + model.id(), //Key
      model.attr(), // Value
      cb //callback
    );
}

function getIndex(modelName, cb) {
  getOrCreateIndex(modelName, function(index) {
    updateIndexCount(modelName, index, cb);
  });
}

function getOrCreateIndex(modelName, cb) {
  redis.get('index:' + modelName, function(e, r) {
    if(r !== null) {
      cb(parseInt(r.toString()) + 1);
    } else {
      cb(1);
    }
  });
}

function updateIndexCount(modelName, index, cb) {
  redis.set("index:" + modelName, index, function() {  cb(index); });
}