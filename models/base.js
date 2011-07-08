var db = require('../db.js');
/**
 * Extends Base to model parameter.
 * 
 */
module.exports.extend = function(model, options) {
    //find attributes of the model
    var modelAttrs = options['attrs'] || [];
    
    //key no longer need
    delete options['attrs'];
    
    //Copy base prototype into model
    for(var method in  Base.prototype)
        model.prototype[method] = Base.prototype[method];
        
    //Concat attributes specified by model and the Base _attr
    if(modelAttrs && modelAttrs.length)
        model.prototype._attrs = model.prototype._attrs.concat(modelAttrs).unique();
    
    //overwrite all Base prototype functions defined by model.
    for(var i in options)
        model.prototype[i] = options[i];
}

function Base() {}

Base.prototype._attrs = ['id', 'name'];


Base.prototype.attributes = function(_attributes) {
    if(_attributes === undefined) _attributes = {};
    
    var attributes = {};
    for(var i = 0; i < this._attrs.length; i++) {
        var attrName = this._attrs[i];
        //create accessor if not present
        if(typeof this[attrName] !== 'function') {
            this._createAttrAccessor(attrName);
        }
        
        attributes[attrName] = this[attrName](_attributes[attrName]);
    }
    return attributes;
}

Base.prototype._createAttrAccessor = function(attributeName) {
    var context = this;
    if(typeof this[attributeName] !== 'function') {
        this[attributeName] = (function() {
            var _value;
            return function(value) {
                if(value !== undefined) _value = value;
                return _value;
            }
        })();
    }
}


Base.prototype.create = function() {
    
}

Base.prototype.save = function(cb) {
    var model = this;
    
    if(this.id() === null || this.id() === undefined) {
        //get unique id
        db.getUniqueId(this.name(), function(id) {
            model.id(id);
            
            //recall model save method
            model.save(cb);
        });
    } else {
        if ((typeof cb).toLowerCase() !== 'function') cb = function() {};
        
        db.store(this.name() + ':' + this.id(), this.attributes(), function(success) {
            cb(success);
        });
    }
}