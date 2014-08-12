define([
	'./Config'
], function(Config) {
	'use strict';

	// expect jQuery to exists outside of this component
	//var $ = window.jQuery;

	/**
	 * FlowCarousel main class.
	 *
	 * Responsive paginated high-performance HTML5 carousel with AngularJS support.
	 *
	 * Copyright Stagnation Lab
	 * Released under the MIT license
	 * https://github.com/kallaspriit/flow-carousel
	 *
	 * @class FlowCarousel
	 * @constructor
	 */
	function FlowCarousel() {
		/**
		 * Component version number.
		 *
		 * @property version
		 * @type string
		 */
		this.version = '0.1.0';

		/**
		 * Carousel configuration.
		 *
		 * @property _config
		 * @type Config
		 * @private
		 */
		this._config = new Config();
	}

	/**
	 * Initializes the carousel component.
	 *
	 * @method init
	 */
	FlowCarousel.prototype.init = function(userConfig) {
		if (typeof userConfig === 'object') {
			this._config.extend(userConfig);
		}
	};

	/**
	 * Returns current configuration.
	 *
	 * @method getConfig
	 * @return {Config}
	 */
	FlowCarousel.prototype.getConfig = function() {
		return this._config;
	};

	return FlowCarousel;
});