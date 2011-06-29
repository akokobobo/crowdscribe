this.extend = function(model, attributes) {
    model.prototype = new Base(attributes);
}

function Base(attributes) {
    this._setInitialAttributes(attributes);
}

Base.prototype.name = function() { return 'Base'; }

Base.prototype._attrs = [];

Base.prototype._setInitialAttributes = function(_attributes) {
    for(var i in _attributes) {
        this._createAttrAccessor(i);
        this[i](_attributes[i]);
    }
}

Base.prototype.attributes = function(_attributes) {
    var attributes = {};
    for(var i = 0; i < this._attrs.length; i++) {
        attributes[i] = this[i](_attributes[i]);
    }
    return attributes;
}

Base.prototype._createAttrAccessor = function(attributeName) {
    var context = this;
    if(!context[attributeName]) {
        context[attributeName] = (function(attrName) {
            var currentValue;
            return function(value) {
                if(value !== undefined) currentValue = value;
                return currentValue;
            }
        })(attributeName);
        context['_attrs'].push(attributeName);
    }
}


Base.prototype.create = function() {
    
}

Base.prototype.save = function() {
    
}