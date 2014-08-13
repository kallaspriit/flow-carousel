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
		 * Carousel orientation to use.
		 *
		 * One of {{#crossLink "Config/Orientation:property"}}{{/crossLink}}.
		 *
		 * Defaults to horizontal.
		 *
		 * @property orientation
		 * @type {Config/Orientation:property}
		 */
		this.orientation = Config.Orientation.HORIZONTAL;

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
		 * Item margin to use.
		 *
		 * @property margin
		 * @type {number}
		 * @default 0
		 */
		this.margin = 0;

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
		 * The list should be ordered from the smallest size to the largest.
		 *
		 * @property responsiveBreakpoints
		 * @type array
		 * @default true
		 */
		this.responsiveBreakpoints = [{
			size: 0,
			itemsPerPage: 1
		}, {
			size: 320,
			itemsPerPage: 2
		}, {
			size: 768,
			itemsPerPage: 3
		}, {
			size: 1224,
			itemsPerPage: 4
		}, {
			size: 1824,
			itemsPerPage: 5
		}];

		/**
		 * The interval at which to check for carousel wrap size changes so responsive layout could be applied.
		 *
		 * Value is in milliseconds.
		 *
		 * @property responsiveLayoutListenerInterval
		 * @type {number}
		 * @default 100
		 */
		this.responsiveLayoutListenerInterval = 100;

		/**
		 * The css classes prefix to use.
		 *
		 * @property cssPrefix
		 * @type {string}
		 * @default 'flow-carousel-'
		 */
		this.cssPrefix = 'flow-carousel-';

		/**
		 * CSS class names to use.
		 *
		 * @property cssClasses
		 * @type {object}
		 */
		this.cssClasses = {
			wrap: 'wrap',
			horizontal: 'horizontal',
			vertical: 'vertical',
			item: 'item',
			loading: 'loading',
			ready: 'ready',
		};
	}

	/**
	 * Enumeration of possible carousel orientations.
	 *
	 * @property Orientation
	 * @param {string} Orientation.HORIZONTAL='horizontal' Horizontal orientation
	 * @param {string} Orientation.VERTIAL='vertical' Vertical orientation
	 * @static
	 * @type {object}
	 */
	Config.Orientation = {
		HORIZONTAL: 'horizontal',
		VERTICAL: 'vertical'
	};

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
	 * Returns the number of items to render side-by-side based on the wrap size and
	 * {{#crossLink "Config/responsiveBreakpoints:property"}}{{/crossLink}} setting.
	 *
	 * @method getItemsPerPage
	 * @param {number} wrapSize Wrap size to base the calculation on
	 */
	Config.prototype.getItemsPerPage = function(wrapSize) {
		var i,
			breakpoint;

		if (!this.useResponsiveLayout) {
			return this.itemsPerPage;
		}

		for (i = this.responsiveBreakpoints.length - 1; i >= 0; i--) {
			breakpoint = this.responsiveBreakpoints[i];

			if (breakpoint.size <= wrapSize) {
				return breakpoint.itemsPerPage;
			}
		}

		return this.responsiveBreakpoints[0].itemsPerPage;
	};

	/**
	 * Returns class name to use by type.
	 *
	 * The class name is constructed by combining the value of {{#crossLink "Config/cssPrefix:property"}}{{/crossLink}}
	 * and the mapping in {{#crossLink "Config/cssClasses:property"}}{{/crossLink}}.
	 *
	 * Throws error if invalid class name type is requested.
	 *
	 * @method getClassName
	 * @param {string} type Class name type, one of the keys in cssClasses
	 * @return {string}
	 */
	Config.prototype.getClassName = function(type) {
		if (typeof(this.cssClasses[type]) === 'undefined') {
			throw new Error('Unknown CSS class type "' + type + '" requested');
		}

		return this.cssPrefix + this.cssClasses[type];
	};

	return Config;
});