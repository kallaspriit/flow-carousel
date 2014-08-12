define([
	'./Config'
], function(Config) {
	'use strict';

	// expect jQuery to exists outside of this component
	var $ = window.jQuery;

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

		this._config = new Config();
	}

	/**
	 * Initializes the carousel component.
	 */
	FlowCarousel.prototype.init = function() {
		console.log('FlowCarousel.init() called', this.version, this._config.x, $('SCRIPT').length);
	};

	return FlowCarousel;
});