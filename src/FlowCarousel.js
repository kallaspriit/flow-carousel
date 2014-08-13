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
		 * The interval reference for responsive layout changes.
		 *
		 * @property _responsiveLayoutListenerInterval
		 * @type {number}
		 * @default null
		 * @private
		 */
		this._responsiveLayoutListenerInterval = null;

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

		this._setupWraps(this._selector);
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
	 * @chainable
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
	 * @method _setupWraps
	 * @param {string} selector Wraps selector
	 * @private
	 */
	FlowCarousel.prototype._setupWraps = function(selector) {
		this._$wrap = $(selector);

		this._$wrap.each(function(index, el) {
			this._setupWrap(el, this._config.orientation);
		}.bind(this));
	};

	/**
	 * Initializes a single wrap element.
	 *
	 * @method _setupWrap
	 * @param {DOMelement} element Element to initialize
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @private
	 */
	FlowCarousel.prototype._setupWrap = function(element, orientation) {
		var $element = $(element),
			className = {
				wrap: this._config.getClassName('wrap'),
				loading: this._config.getClassName('loading'),
				ready: this._config.getClassName('ready'),
				horizontal: this._config.getClassName('horizontal'),
				vertical: this._config.getClassName('vertical'),
				item: this._config.getClassName('item')
			};

		// add main carousel class to the wrap element
		$element.addClass(className.wrap);
		$element.addClass(className.loading);

		// add class to wrap based on orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			$element.addClass(className.horizontal);
		} else if (orientation === Config.Orientation.VERTICAL) {
			$element.addClass(className.vertical);
		} else {
			throw new Error('Unexpected orientation "' + orientation + '" provided');
		}

		// add item class to all immediate children
		$element.children().addClass(className.item);

		// setup the individual elements
		this._setupLayout(element, orientation);

		// if we're using responsive layout then we need to recalculate sizes and positions if the wrap size changes
		if (this._config.useResponsiveLayout) {
			this._setupResponsiveLayoutListener(element, orientation);
		}

		// remove the loading class
		$element.removeClass(className.loading);
		$element.addClass(className.ready);
	};

	/**
	 * Initializes items in a wrap.
	 *
	 * @method _setupLayout
	 * @param {DOMelement} element Element to setup items in
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @private
	 */
	FlowCarousel.prototype._setupLayout = function(element, orientation) {
		var $element = $(element),
			wrapSize = this._getWrapSize(element, orientation),
			oppositeOrientation = orientation === Config.Orientation.HORIZONTAL
				? Config.Orientation.VERTICAL
				: Config.Orientation.HORIZONTAL,
			wrapOppositeSize = this._getWrapSize(element, oppositeOrientation),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			effectiveOffset = 0,
			effectiveSize,
			extraSize,
			cssProperties;

		$element.children().each(function(index, el) {
			// calculate the extra size of an element
			extraSize = this._getExtraSize(el, orientation);
			effectiveSize = itemSize - extraSize - gapPerItem;
			cssProperties = {};

			// the properties to set depends on the orientation
			if (orientation === Config.Orientation.HORIZONTAL) {
				cssProperties.width = effectiveSize;
				cssProperties.left = effectiveOffset;
				cssProperties.height = wrapOppositeSize;

			} else if (orientation === Config.Orientation.VERTICAL) {
				cssProperties.height = effectiveSize;
				cssProperties.top = effectiveOffset;
				cssProperties.width = wrapOppositeSize;
			}

			$(el).css(cssProperties);

			effectiveOffset += itemSize + (itemMargin - gapPerItem);
		}.bind(this));
	};

	/**
	 * Sets up main wrap size change listener to apply responsive layout.
	 *
	 * @method _setupResponsiveLayoutListener
	 * @param {DOMelement} element Element to listen changes of
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @private
	 */
	FlowCarousel.prototype._setupResponsiveLayoutListener = function(element, orientation) {
		this._responsiveLayoutListenerInterval = window.setInterval(function() {
			this._validateResponsiveLayout(element, orientation);
		}.bind(this), this._config.responsiveLayoutListenerInterval);
	};

	/**
	 * Checks whether the carousel wrap size has changed and triggers re-layout if so.
	 *
	 * @method _validateResponsiveLayout
	 * @param {DOMelement} element Element to validate
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @private
	 */
	FlowCarousel.prototype._validateResponsiveLayout = function(element, orientation) {
		var lastSize = $(element).data(this._config.cssPrefix + 'last-width') || null,
			currentSize = this._getWrapSize(element, orientation);

		$(element).data(this._config.cssPrefix + 'last-width', currentSize);

		if (lastSize === null)  {
			return;
		}

		// perform the layout routine if the wrap size has changed
		if (currentSize !== lastSize) {
			this._setupLayout(element, orientation);
		}
	};

	/**
	 * Calculates and returns a single item size based on wrap size and items per page.
	 *
	 * @method _calculateItemSize
	 * @param {number} wrapSize Wrapping element size
	 * @param {number} itemsPerPage Number of items per page
	 * @private
	 */
	FlowCarousel.prototype._calculateItemSize = function(wrapSize, itemsPerPage) {
		return wrapSize / itemsPerPage;
	};

	/**
	 * Returns the outer size of an element.
	 *
	 * Horizontal orientation returns element innter width and vertical inner height.
	 *
	 * @method _getWrapSize
	 * @param {DOMelement} element Element to get size of
	 * @param {Config/Orientation:property} orientation Orientation to get size of
	 * @return {number}
	 * @private
	 */
	FlowCarousel.prototype._getWrapSize = function(element, orientation) {
		if (orientation === Config.Orientation.HORIZONTAL) {
			return $(element).innerWidth();
		} else if (orientation === Config.Orientation.VERTICAL) {
			return $(element).innerHeight();
		} else {
			throw new Error('Invalid orientation "' + orientation + '" requested');
		}
	};

	/**
	 * Returns the extra padding+margin+border size of given element in given orientation.
	 *
	 * TODO handle border-box sizing
	 *
	 * @method _getExtraSize
	 * @param {DOMelement} element Element to get size of
	 * @param {Config/Orientation:property} orientation Orientation to get size of
	 * @return {number}
	 * @private
	 */
	FlowCarousel.prototype._getExtraSize = function(element, orientation) {
		var $el = $(element),
			border,
			padding,
			margin,
			borderProp,
			paddingProp,
			marginProp;

		// properties to use depend on the orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			borderProp = ['border-left-width', 'border-right-width'];
			paddingProp = ['padding-left', 'padding-right'];
			marginProp = ['margin-left', 'margin-right'];
		} else if (orientation === Config.Orientation.VERTICAL) {
			borderProp = ['border-top-width', 'border-bottom-width'];
			paddingProp = ['padding-top', 'padding-bottom'];
			marginProp = ['margin-top', 'margin-bottom'];
		} else {
			throw new Error('Invalid orientation "' + orientation + '" requested');
		}

		// calculate the extra size of an element
		border = parseInt($el.css(borderProp[0]), 10) + parseInt($el.css(borderProp[1]), 10);
		padding = parseInt($el.css(paddingProp[0]), 10) + parseInt($el.css(paddingProp[1]), 10);
		margin = parseInt($el.css(marginProp[0]), 10) + parseInt($el.css(marginProp[1]), 10);

		return border + padding + margin;
	};

	return FlowCarousel;
});