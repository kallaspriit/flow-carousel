/* global module */
(function(global, factory) {
	'use strict';

	// add support for ComminJS module pattern
	if (typeof module === 'object'&& typeof module.exports ===  'object') {
		module.exports = global.document ?
			// for environments where a proper window is present, just execute the factory, don't expose globals
			factory(global, true) :

			// the global object does not have a document, return a factory that can be initiated as
			// require('FlowCarousel')(window).
			function(w) {
				if (typeof w !== 'object' || !w.document) {
					throw new Error('FlowCarousel requires a window with a document');
				}

				return factory(w);
			};
	} else if (typeof define === 'function' && define.amd) {
		// add support for RequireJS
		define(['jquery'], function($) {
			return factory(global, true, $);
		});
	} else {
		// there is no CommonJS module available, execute the factory directly
		if (typeof window.jQuery !== 'function') {
			throw new Error('FlowCarousel requires jquery to be registered under window.jQuery');
		}

		factory(global, false, window.jQuery);
	}
})(typeof window !== 'undefined' ? window : this, function(window, noGlobal, $) {
	'use strict';

	/**
	 * FlowCarousel main class.
	 *
	 * Responsive paginated high-performance HTML5 carousel with AngularJS support.
	 *
	 * Copyright Stagnation Lab
	 * Released under the MIT license
	 * https://github.com/kallaspriit/flow-carousel
	 *
	 * @module FlowCarousel
	 * @constructor
	 */
	function FlowCarousel() {
		this.version = '0.1.0';
	}

	/**
	 * Initializes the carousel component.
	 */
	FlowCarousel.prototype.init = function() {
		console.log('FlowCarousel.init() called', this.version, $('SCRIPT').length);
	};

	// export globals if not requested to hide them
	if (noGlobal !== true) {
		window.FlowCarousel = FlowCarousel;
	}

	return FlowCarousel;
});