//Array Prototype

Array.prototype.unique = function() {
    for(var i = 0; i < this.length; i++) {
        var current = this[i];
        for(var j = i + 1; j < this.length; j++) {
            var next = this[j];
            if(current === next) {
                this.splice(j, 1);
                j--;
            }
        }
    }
    return this;
}

//Number Prototype

Number.prototype.minutes = Number.prototype.minute = function () {
	return this.seconds() * 60;
}

Number.prototype.seconds = Number.prototype.second = function () {
	return this * 1000;
}