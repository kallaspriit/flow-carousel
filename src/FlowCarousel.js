/* global module */
(function(global) {
	'use strict';

	function FlowCarousel() {
		this.version = '0.1.0';
	}

	FlowCarousel.prototype.init = function() {
		console.log('FlowCarousel.init() called');
	};

	// add support for  AMD if available
	if (typeof module === 'object'&& typeof module.exports ===  'object') {
		module.exports = FlowCarousel;
	} else {
		global.FlowCarousel = FlowCarousel;
	}

	// add support for RequireJS
	if (typeof define === 'function' && define.amd) {
		define('FlowCarousel', [], function() {
			return FlowCarousel;
		});
	}
})(typeof window !== 'undefined' ? window : this);