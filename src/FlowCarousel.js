define([
	'Config',
	'AbstractDataSource',
	'ArrayDataSource',
	'HtmlDataSource',
	'AbstractAnimator',
	'DefaultAnimator',
	'AbstractRenderer',
	'HtmlRenderer',
	'Deferred',
	'Util',
], function(
	Config,
	AbstractDataSource,
	ArrayDataSource,
	HtmlDataSource,
	AbstractAnimator,
	DefaultAnimator,
	AbstractRenderer,
	HtmlRenderer,
	Deferred,
	Util
) {
	'use strict';

	// expect jQuery to exists outside of this component and use its deferred implementation
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
		 * @property _renderer
		 * @type {AbstractRenderer}
		 * @default null
		 * @private
		 */
		this._renderer = null;

		/**
		 * Animator to use.
		 *
		 * @property _animator
		 * @type {AbstractAnimator}
		 * @default null
		 * @private
		 */
		this._animator = null;

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
		 *
		 * @property _mainWrap
		 * @type {DOMElement}
		 * @default null
		 * @private
		 */
		this._mainWrap = null;

		/**
		 * Wrap for the items that contains the {{#crossLink "FlowCarousel/_scrollerWrap:property"}}{{/crossLink}}
		 * which in turn contains the actual item wrappers and items.
		 *
		 * @property _itemsWrap
		 * @type {DOMElement}
		 * @default null
		 * @private
		 */
		this._itemsWrap = null;

		/**
		 * This is the wrap that's animated on navigation and contains the carousel element wraps.
		 *
		 * @property _scrollerWrap
		 * @type {DOMElement}
		 * @default null
		 * @private
		 */
		this._scrollerWrap = null;

		/**
		 * Currently displayed page number starting from zero.
		 *
		 * @property _currentPageIndex
		 * @type {number}
		 * @default 0
		 * @private
		 */
		this._currentPageIndex = 0;

		/**
		 * Is the carousel currently animating.
		 *
		 * @property _isAnimating
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._isAnimating = false;

		/**
		 * Target item position index.
		 *
		 * This is set when animating to an index is requested.
		 *
		 * @property _targetItemIndex
		 * @type {number}
		 * @default 0
		 * @private
		 */
		this._targetItemIndex = 0;

		/**
		 * Current item position index.
		 *
		 * This is updated once the animation completes.
		 *
		 * @property _currentItemIndex
		 * @type {number}
		 * @default 0
		 * @private
		 */
		this._currentItemIndex = 0;

		/**
		 * Shortcut to the list of possible orientations from Config.
		 *
		 * @property Orientation
		 * @param {string} Orientation.HORIZONTAL='horizontal' Horizontal orientation
		 * @param {string} Orientation.VERTIAL='vertical' Vertical orientation
		 * @type {object}
		 */
		this.Orientation = Config.Orientation;
	}

	/**
	 * Possible size modes used by {{#crossLink "FlowCarousel/_getWrapSize"}}{{/crossLink}}.
	 *
	 * @property SizeMode
	 * @type {object}
	 * @param {string} SizeMode.INNER='inner' Inner size
	 * @param {string} SizeMode.OUTER='outer' Outer size
	 * @static
	 */
	FlowCarousel.SizeMode = {
		INNER: 'inner',
		OUTER: 'outer'
	};

	/**
	 * Initializes the carousel component.
	 *
	 * @method init
	 * @param {string} selector Selector of elements to turn into a carousel
	 * @param {object} [userConfig] Optional user configuration object overriding defaults in the
	 * {{#crossLink "Config"}}{{/crossLink}}.
	 */
	FlowCarousel.prototype.init = function(selector, userConfig) {
		this._selector = selector;

		if (typeof selector !== 'string') {
			throw new Error('Expected a string as the selector argument, but got ' + typeof selector);
		}

		// extend the config with user-provided values if available
		if (Util.isObject(userConfig)) {
			this._config.extend(userConfig);
		}

		// initialize the wrap element that match given selector
		this._setupElement(this._selector);

		// use provided data source or a simple array if provided, use HtmlDataSource if nothing is provided
		if (this._config.dataSource instanceof AbstractDataSource || Util.isArray(this._config.dataSource)) {
			this.setDataSource(this._config.dataSource);
		} else if (typeof this._config.dataSource !== 'undefined' && this._config.dataSource !== null) {
			throw new Error('Unexpected data source type "' + typeof(this._config.dataSource) + '" provided');
		} else {
			this._dataSource = new HtmlDataSource(this._mainWrap);
		}

		// use custom renderer if provided or the HtmlRenderer if not
		if (this._config.renderer !== null) {
			if (this._config.renderer instanceof AbstractRenderer) {
				this._renderer = this._config.renderer;
			} else {
				throw new Error('Custom renderer provided in config but it\'s not an instance of AbstractRenderer');
			}
		} else {
			if (this._dataSource instanceof HtmlDataSource) {
				this._renderer = new HtmlRenderer();
			} else {
				throw new Error(
					'Expecting a custom "renderer" to be defined in the config if not using the HtmlDataSource'
				);
			}
		}

		// use custom animator if provided or the DefaultAnimator if not
		if (this._config.animator !== null) {
			if (this._config.animator instanceof AbstractAnimator) {
				this._animator = this._config.animator;
			} else {
				throw new Error('Custom animator provided in config but it\'s not an instance of AbstractAnimator');
			}
		} else {
			this._animator = new DefaultAnimator(this);
		}

		// setup the carousel rendering and events
		this._setupCarousel(this._mainWrap, this._config.orientation);
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
	 * Returns current animator instance.
	 *
	 * @method getAnimator
	 * @return {Config}
	 */
	FlowCarousel.prototype.getAnimator = function() {
		return this._animator;
	};

	/**
	 * Returns the main carousel wrap dom element.
	 *
	 * @method getMainWrap
	 * @return {DOMElement}
	 */
	FlowCarousel.prototype.getMainWrap = function() {
		return this._mainWrap;
	};

	/**
	 * Returns the items wrap containing the scroller wrap.
	 *
	 * @method getItemsWrap
	 * @return {DOMElement}
	 */
	FlowCarousel.prototype.getItemsWrap = function() {
		return this._itemsWrap;
	};

	/**
	 * Returns the scroller wrap containing the item wraps.
	 *
	 * @method getScrollerWrap
	 * @return {DOMElement}
	 */
	FlowCarousel.prototype.getScrollerWrap = function() {
		return this._scrollerWrap;
	};

	/**
	 * Returns the orientation of the carousel.
	 *
	 * @method getOrientation
	 * @return {Config/Orientation:property}
	 */
	FlowCarousel.prototype.getOrientation = function() {
		return this._config.orientation;
	};

	/**
	 * Returns the size of a single item given current wrap size.
	 *
	 * @method getItemSize
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemSize = function() {
		var wrapSize = this._getElementSize(this._mainWrap, this._config.orientation),
			itemsPerPage = this._config.getItemsPerPage(wrapSize);

		return this._calculateItemSize(wrapSize, itemsPerPage);
	};

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemCount = function() {
		return this._dataSource.getItemCount();
	};

	/**
	 * Returns the target item position index.
	 *
	 * This can be different from the return value of getCurrentItemIndex() if the carousel is animating.
	 *
	 * @method getTargetItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getTargetItemIndex = function() {
		return this._targetItemIndex;
	};

	/**
	 * Returns the current item position index.
	 *
	 * This can be different from the return value of getTargetItemIndex() if the carousel is animating.
	 *
	 * @method getCurrentItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentItemIndex = function() {
		return this._currentItemIndex;
	};

	/**
	 * Returns the current item position index.
	 *
	 * This can be different from the return value of getTargetItemIndex() if the carousel is animating.
	 *
	 * @method getCurrentItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.isAnimating = function() {
		return this._isAnimating;
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
		} else if (Util.isArray(data)) {
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
	 * Navigates to a carousel item by index.
	 *
	 * Throws error if out of bounds index is requested.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * @method navigateToItem
	 * @param {number} itemIndex Item index to navigate to.
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToItem = function(itemIndex) {
		var itemCount = this._dataSource.getItemCount(),
			promise;

		// validate index range
		if (itemIndex < 0) {
			throw new Error('Invalid negative  index "' + itemIndex + '" requested');
		} else if (itemIndex > itemCount - 1) {
			throw new Error('Too large index "' + itemIndex + '" requested, there are only ' + itemCount + ' items');
		}

		// TODO what if the carousel is already animating
		if (this._isAnimating) {
			throw new Error('Starting new animation while the last has not completed is not yet implemented');
		}

		// update the target item index
		this._targetItemIndex = itemIndex;
		this._isAnimating = true;

		// animate to the new item position index if it's different from current item index
		if (itemIndex !== this._currentItemIndex) {
			// start animating to given item, this is an asynchronous process
			promise = this._animator.animateToItem(itemIndex);
		} else {
			// if the currently active index is requested then just ignore the call and resolve immediately
			promise = new Deferred();

			promise.resolve();
		}

		// once the animation is complete, update the current item index
		promise.done(function() {
			this._currentItemIndex = itemIndex;
			this._isAnimating = false;
		}.bind(this));

		return promise;
	};

	/**
	 * Initializes the top-level wrap element.
	 *
	 * If the selector matches multiple elements, only the first one is considered.
	 *
	 * If the selector does not match any elements, an error is thrown.
	 *
	 * @method _setupElement
	 * @param {string} selector Wraps selector
	 * @private
	 */
	FlowCarousel.prototype._setupElement = function(selector) {
		var matches = $(selector);

		// make sure that the selector matches only a single element and throw error otherwise
		if (matches.length === 0) {
			throw new Error('Selector "' + selector + '" did not match any elements');
		} else if (matches.length > 1) {
			throw new Error(
				'Selector "' + selector + '" matches more then one element, try using "' + selector + ':first"'
			);
		}

		// store reference to the main wrap dom element
		this._mainWrap = matches[0];

		// register the carousel instance on the main wrap dom element data
		$(this._mainWrap).data(this._config.dataTarget, this);
	};

	/**
	 * Initializes a single wrap element.
	 *
	 * @method _setupCarousel
	 * @param {DOMelement} wrap The carousel wrap to setup
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @private
	 */
	FlowCarousel.prototype._setupCarousel = function(wrap, orientation) {
		var $element = $(wrap),
			className = {
				wrap: this._config.getClassName('wrap'),
				items: this._config.getClassName('items'),
				item: this._config.getClassName('item'),
				scroller: this._config.getClassName('scroller'),
				loading: this._config.getClassName('loading'),
				ready: this._config.getClassName('ready'),
				horizontal: this._config.getClassName('horizontal'),
				vertical: this._config.getClassName('vertical')
			},
			$itemsWrap,
			$scrollerWrap;

		// remove any existing content (HtmlDataSource should have done that already anyway
		$element.empty();

		// create the items and the scroller wraps
		$itemsWrap = $('<div></div>', {
			'class': className.items
		});

		$scrollerWrap = $('<div></div>', {
			'class': className.scroller
		});

		// add the items and scroller wraps
		$itemsWrap.append($scrollerWrap);
		$element.append($itemsWrap);

		// store references to the items and scroller wrap dom elements
		this._itemsWrap = $itemsWrap[0];
		this._scrollerWrap = $scrollerWrap[0];

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

		// setup the individual elements
		this._setupLayout(wrap, orientation);

		// if we're using responsive layout then we need to recalculate sizes and positions if the wrap size changes
		if (this._config.useResponsiveLayout) {
			this._setupResponsiveLayoutListener(wrap, orientation);
		}

		// remove the loading class
		$element.removeClass(className.loading);
		$element.addClass(className.ready);
	};

	/**
	 * Sets up the layout and renders the initial set of items.
	 *
	 * Since fetching and rendering items can be asyncronous, this method returns a promise.
	 *
	 * @method _setupLayout
	 * @param {DOMelement} element Element to setup items in
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._setupLayout = function(element, orientation) {
		var wrapSize = this._getElementSize(element, orientation),
			itemCount = this._dataSource.getItemCount(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			totalSize = itemCount * itemSize,
			sizeProp = orientation === Config.Orientation.HORIZONTAL
				? 'width'
				: 'height',
			renderRange = this._getRenderRangeForPage(this._currentPageIndex, itemsPerPage);

		// define the scroller wrap size to fit all items
		$(this._scrollerWrap).css(sizeProp, totalSize);

		// render the items
		return this._renderItemRange(renderRange.start, renderRange.end);
	};

	/**
	 * Returns the range of items that should be rendered to display given page.
	 *
	 * @method _getRenderRangeForPage
	 * @param {number} pageIndex Page number starting from zero
	 * @param {number} itemsPerPage How many items are shown on one page
	 * @return {object} The start and end index of range to render
	 * @private
	 */
	FlowCarousel.prototype._getRenderRangeForPage = function(pageIndex, itemsPerPage) {
		return {
			start: pageIndex * itemsPerPage,
			end: (pageIndex + 1) * itemsPerPage
		};
	};

	/**
	 * Renders a range of carousel items.
	 *
	 * @method _renderItemRange
	 * @param {number} startIndex Range start index
	 * @param {number} endIndex Range end index
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._renderItemRange = function(startIndex, endIndex) {
		var deferred = new Deferred();

		this._dataSource.getItems(startIndex, endIndex)
			.done(function(items) {
				this._renderItems(items, startIndex);
			}.bind(this))
			.fail(function() {
				throw new Error('Loading item range ' + startIndex + ' to ' + endIndex + ' failed');
			}.bind(this));

		return deferred.promise();
	};

	/**
	 * Renders given carousel items.
	 *
	 * @method _renderItems
	 * @param {array} items Items to render
	 * @param {number} startIndex Range start index
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._renderItems = function(items, startIndex) {
		var deferred = new Deferred(),
			promises = [],
			i,
			itemIndex,
			item,
			promise;

		for (i = 0; i < items.length; i++) {
			item = items[i];
			itemIndex = startIndex + i;

			promise = this._renderer.renderItem(this._config, itemIndex, item);

			promises.push(promise);
		}

		// wait for all the elements to get rendered
		// TODO Add each element as soon as it renders?
		Deferred.when.apply($, promises)
			.done(function() {
				this._insertRenderedElements(arguments, startIndex);

				deferred.resolve();
			}.bind(this))
			.fail(function() {
				deferred.reject();
			});

		return deferred.promise();
	};

	/**
	 * Inserts rendered dom elements into the carousel dom structure.
	 *
	 * @method _insertRenderedElements
	 * @param {DOMElement[]} elements Elements to insert
	 * @param {number} startIndex First element index in the carousel
	 * @private
	 */
	FlowCarousel.prototype._insertRenderedElements = function(elements, startIndex) {
		var oppositeOrientation = this._getOppositeOrientation(this._config.orientation),
			sizeProp = this._config.orientation === Config.Orientation.HORIZONTAL
				? 'height'
				: 'width',
			elementIndex,
			largestChildSize,
			i;

		for (i = 0; i < elements.length; i++) {
			elementIndex = startIndex + i;

			this._insertRenderedElement(elements[i], elementIndex);
		}

		largestChildSize = this._getLargestChildSize(
			this._scrollerWrap,
			oppositeOrientation,
			FlowCarousel.SizeMode.OUTER
		);

		$(this._scrollerWrap).css(sizeProp, largestChildSize);
	};

	/**
	 * Inserts a rendered dom element into the carousel dom structure.
	 *
	 * @method _insertRenderedElement
	 * @param {DOMElement} element Element to insert
	 * @param {number} index Element index
	 * @private
	 */
	FlowCarousel.prototype._insertRenderedElement = function(element, index) {
		// calculate the properties of the element
		var $element = $(element),
			orientation = this._config.orientation,
			wrapSize = this._getElementSize(this._mainWrap, orientation),
			oppositeOrientation = this._getOppositeOrientation(orientation),
			wrapOppositeSize = this._getElementSize(this._mainWrap, oppositeOrientation),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			effectiveSize = itemSize - gapPerItem,
			effectiveOffset = index * itemSize + index * (itemMargin - gapPerItem),
			$wrapper = $('<div></div>', {
				'class': this._config.getClassName('item')
			}),
			cssProperties = {},
			$wrappedElement;

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

		// wrap the item element in a carousel wrapper
		$wrappedElement = $element.wrap($wrapper).parent();

		// apply the css styles and add carousel item class
		$wrappedElement.css(cssProperties);
		$wrappedElement.addClass(this._config.getClassName('item'));

		// the element may be display: none to begin with, make it visible
		$element.css('display', 'block');

		// append the element to the scroller wrap
		$(this._scrollerWrap).append($wrappedElement);
	};

	/**
	 * Re-initializes the layout.
	 *
	 * Used to apply responsive layout when the wrap size changes.
	 *
	 * Since fetching and rendering items can be asynchronous, this method returns a promise.
	 *
	 * @method _reLayout
	 * @param {DOMelement} element Element to layout
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._reLayout = function(element, orientation) {
		// just forward to _setupLayout
		// TODO Dont just add new elements but move around existing ones if possible
		return this._setupLayout(element, orientation);
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
			currentSize = this._getElementSize(element, orientation);

		$(element).data(this._config.cssPrefix + 'last-width', currentSize);

		if (lastSize === null)  {
			return;
		}

		// perform the layout routine if the wrap size has changed
		if (currentSize !== lastSize) {
			this._reLayout(element, orientation);
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
	 * Returns the size of an element.
	 *
	 * Horizontal orientation returns element width and vertical height.
	 *
	 * Mode sets whether to return the inner or outer width/height (defaults to inner).
	 *
	 * @method _getElementSize
	 * @param {DOMelement} element Element to get size of
	 * @param {Config/Orientation:property} orientation Orientation to get size of
	 * @param {FlowCarousel.SizeMode:property} [mode=FlowCarousel.SizeMode.INNER] Size mode
	 * @return {number}
	 * @private
	 */
	FlowCarousel.prototype._getElementSize = function(element, orientation, mode) {
		mode = mode || FlowCarousel.SizeMode.INNER;

		var methods = mode === FlowCarousel.SizeMode.INNER
			? ['innerWidth', 'innerHeight']
			: ['outerWidth', 'outerHeight'];

		if (orientation === Config.Orientation.HORIZONTAL) {
			return $(element)[methods[0]]();
		} else if (orientation === Config.Orientation.VERTICAL) {
			return $(element)[methods[1]]();
		} else {
			throw new Error('Invalid orientation "' + orientation + '" requested');
		}
	};

	/**
	 * Returns biggest element size in given wrap for given orientation and size mode.
	 *
	 * Horizontal orientation returns element width and vertical height.
	 *
	 * Mode sets whether to return the inner or outer width/height (defaults to inner).
	 *
	 * @method _getLargestChildSize
	 * @param {DOMelement} wrap Element to get size of
	 * @param {Config/Orientation:property} orientation Orientation to get size of
	 * @param {FlowCarousel.SizeMode:property} [mode=FlowCarousel.SizeMode.INNER] Size mode
	 * @return {number}
	 * @private
	 */
	FlowCarousel.prototype._getLargestChildSize = function(wrap, orientation, mode) {
		var biggestSize = 0;

		$(wrap).children().each(function(index, element) {
			var elementSize = this._getElementSize(element, orientation, mode);

			if (elementSize > biggestSize) {
				biggestSize = elementSize;
			}
		}.bind(this));

		return biggestSize;
	};

	/**
	 * Returns the extra padding+margin+border size of given element in given orientation.
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

	/**
	 * Returns the opposite orientation name.
	 *
	 * For Config.Orientation.HORIZONTAL returns Config.Orientation.VERTICAL and vice versa.
	 *
	 * @method _getOppositeOrientation
	 * @param {Config/Orientation:property} orientation Orientation to get opposite of
	 * @return {Config/Orientation:property}
	 * @private
	 */
	FlowCarousel.prototype._getOppositeOrientation = function(orientation) {
		return orientation === Config.Orientation.HORIZONTAL
			? Config.Orientation.VERTICAL
			: Config.Orientation.HORIZONTAL;
	};

	return FlowCarousel;
});