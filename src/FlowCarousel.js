define([
	'Config',
	'ArrayDataSource',
	'AbstractDataSource',
	'Util',
], function(Config, ArrayDataSource, AbstractDataSource, util) {
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
		 * Set to true once the component is initiated and to false once it's destroyed.
		 *
		 * @property _initiated
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._initiated = false;

		/**
		 * Carousel configuration.
		 *
		 * @property _config
		 * @type Config
		 * @default Config
		 * @private
		 */
		this._config = new Config();

		/**
		 * Data source to use.
		 *
		 * Data source is only set when the carousel is initiated with data or it's set with
		 * {{#crossLink "FlowCarousel/setDataSource"}}{{/crossLink}}.
		 *
		 * @property _dataSource
		 * @type {AbstractDataSource}
		 * @default null
		 * @private
		 */
		this._dataSource = null;

		/**
		 * Renderer used to render the data.
		 *
		 * @type {AbstractRenderer}
		 * @default null
		 * @private
		 */
		this._renderer = null;

		/**
		 * Selector of elements to turn into a carousel.
		 *
		 * @property _selector
		 * @type {string}
		 * @default null
		 * @private
		 */
		this._selector = null;

		/**
		 * The top wrap elements jQuery object.
		 * @type {jQuery}
		 * @default null
		 * @private
		 */
		this._$wrap = null;
	}

	/**
	 * Initializes the carousel component.
	 *
	 * @method init
	 * @param {string} selector Selector of elements to turn into a carousel
	 * @param {object} [userConfig] Optional user configuration object overriding defaults in the
	 * {{#crossLink "Config"}}{{/crossLink}}.
	 * @param {object|AbstractDataSource} [data] Data to render
	 */
	FlowCarousel.prototype.init = function(selector, userConfig, data) {
		if (typeof selector !== 'string') {
			throw new Error('Expected a string as the selector argument, but got ' + typeof selector);
		}

		this._selector = selector;

		if (util.isObject(userConfig)) {
			this._config.extend(userConfig);
		}

		if (data instanceof AbstractDataSource || util.isArray(data)) {
			this.setDataSource(data);
		} else if (typeof data !== 'undefined' && data !== null) {
			throw new Error('Unexpected data type "' + typeof(data) + '" provided');
		}

		this._initWraps(this._selector);
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

	/**
	 * Sets the data source to use.
	 *
	 * Expects either an instance of AbstractDataSource (you can roll your own) or a simple array that will be
	 * converted to an ArrayDataSource.
	 *
	 * This can optionally be set in the init method as second argument.
	 *
	 * This method supports call chaining by returning itself.
	 *
	 * @method setDataSource
	 * @param {AbstractDataSource|array} Either an instance of AbstractDataSource or a simple array
	 * @return {FlowCarousel}
	 */
	FlowCarousel.prototype.setDataSource = function(data) {
		if (data instanceof AbstractDataSource) {
			this._dataSource = data;
		} else if (util.isArray(data)) {
			this._dataSource = new ArrayDataSource(data);
		} else {
			throw new Error(
				'Invalid data of type "' + data + '" provided, expected an instance of AbstractDataSource or a ' +
				'simple array'
			);
		}

		return this;
	};

	/**
	 * Returns the data used for rendering the component.
	 *
	 * Returns null if the component has not yet been initialized.
	 *
	 * @method getDataSource
	 * @return {AbstractDataSource|null} Used data source or null if not available yet
	 */
	FlowCarousel.prototype.getDataSource = function() {
		return this._dataSource;
	};

	/**
	 * Initializes the top-level wrap elements.
	 *
	 * @method _initWraps
	 * @param {string} selector Wraps selector
	 * @private
	 */
	FlowCarousel.prototype._initWraps = function(selector) {
		var self = this;

		this._$wrap = $(selector);

		this._$wrap.each(function() {
			self._initWrap(this);
		});
	};

	/**
	 * Initializes a single wrap element.
	 *
	 * @method _initWrap
	 * @param {DOMelement} element Element to initialize
	 * @private
	 */
	FlowCarousel.prototype._initWrap = function(element) {
		console.log('init', element);
	};

	return FlowCarousel;
});