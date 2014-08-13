Function.prototype.bind = Function.prototype.bind || function (to) {
	'use strict';

	var partial = Array.prototype.splice.call(arguments, 1),
		fn = this,
		bound = function () {
			// Join the already applied arguments to the now called ones (after converting to an array again).
			var args = partial.concat(Array.prototype.splice.call(arguments, 0));
			// If not being called as a constructor
			if (!(this instanceof bound)) {
				// return the result of the function called bound to target and partially applied.
				return fn.apply(to, args);
			}
			// If being called as a constructor, apply the function bound to self.
			fn.apply(this, args);
		};

	bound.prototype = fn.prototype;

	return bound;
};