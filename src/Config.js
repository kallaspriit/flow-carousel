define([
], function() {
	'use strict';

	/**
	 * Provides configuration.
	 *
	 * @class Config
	 * @constructor
	 */
	function Config() {

		/**
		 * Number of items to render side-by-side when not using responsive layout.
		 *
		 * This parameter is ignored when using responsive layout strategy.
		 *
		 * @property itemsPerPage
		 * @type number
		 * @default 5
		 */
		this.itemsPerPage = 5;

		/**
		 * Should responsive layout be used by default.
		 *
		 * @property useResponsiveLayout
		 * @type boolean
		 * @default true
		 */
		this.useResponsiveLayout = true;

		/**
		 * List of default responsive layout breakpoint.
		 *
		 * The list should be ordered from the smallest width to the largest.
		 *
		 * @property responsiveBreakpoints
		 * @type array
		 * @default true
		 */
		this.responsiveBreakpoints = [{
			width: 0,
			itemsPerPage: 1
		}, {
			width: 320,
			itemsPerPage: 2
		}, {
			width: 768,
			itemsPerPage: 3
		}, {
			width: 1224,
			itemsPerPage: 4
		}, {
			width: 1824,
			itemsPerPage: 5
		}];
	}

	/**
	 * Extends the base default configuration properties with user-defined values.
	 *
	 * @method extend
	 * @param {object} userConfig
	 */
	Config.prototype.extend = function(userConfig) {
		var key,
			value;

		for (key in userConfig) {
			value = userConfig[key];

			if (typeof this[key] === 'undefined') {
				throw new Error('user configuration contains unknown "' + key + '" property');
			}

			this[key] = value;
		}
	};

	/**
	 * Returns the number of items to render side-by-side based on the wrap width and
	 * {{#crossLink "Config/responsiveBreakpoints:property"}}{{/crossLink}} setting.
	 *
	 * @method getResponsiveItemsPerPage
	 * @param {number} wrapWidth Wrap width to base the calculation on
	 */
	Config.prototype.getResponsiveItemsPerPage = function(wrapWidth) {
		var i,
			breakpoint;

		for (i = this.responsiveBreakpoints.length - 1; i >= 0; i--) {
			breakpoint = this.responsiveBreakpoints[i];

			if (breakpoint.width <= wrapWidth) {
				return breakpoint.itemsPerPage;
			}
		}

		return this.responsiveBreakpoints[0].itemsPerPage;
	};

	return Config;
});