/**
 * Extends Base to model parameter.
 * 
 */
this.extend = function(model, options) {
    var modelPrototype = model.prototype;
    
    model.prototype = new Base(options);
    //attrs no longer needed
    delete options['attrs'];
    
    //overwrite all Base prototype functions defined by model.
    for(var i in modelPrototype) {
        model.prototype[i] = modelPrototype[i];
    }
}

function Base(options) {
    if(options['attrs'])
        this._createAttrAccesors(options['attrs']);
}

Base.prototype._attrs = [];


Base.prototype.attributes = function(_attributes) {
    var attributes = {};
    for(var i = 0; i < this._attrs.length; i++) {
        attributes[i] = this[i](_attributes[i]);
    }
    return attributes;
}

Base.prototype._createAttrAccesors = function(attrs) {
    var context = this;
    for(var i = 0; i < attrs.length; i++) {
        var attrName = attrs[i];
        //Creating accessor function
        this[attrName] = (function() {
            var _value;
            return function(value) {
                if(value !== undefined) _value = value;
                return _value;
            }
        })();
        this._attrs.push(attrName);
    }
}


Base.prototype.create = function() {
    
}

Base.prototype.save = function() {
    
}