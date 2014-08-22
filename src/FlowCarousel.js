define([
	'jquery',
	'Config',
	'AbstractDataSource',
	'ArrayDataSource',
	'HtmlDataSource',
	'AbstractAnimator',
	'DefaultAnimator',
	'AbstractRenderer',
	'HtmlRenderer',
	'AbstractNavigator',
	'KeyboardNavigator',
	'DragNavigator',
	'Deferred',
	'Util',
	'EventEmitter',
], function(
	$,
	Config,
	AbstractDataSource,
	ArrayDataSource,
	HtmlDataSource,
	AbstractAnimator,
	DefaultAnimator,
	AbstractRenderer,
	HtmlRenderer,
	AbstractNavigator,
	KeyboardNavigator,
	DragNavigator,
	Deferred,
	Util,
	EventEmitter
) {
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
	 * @class FlowCarousel
	 * @extends EventEmitter
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
		 * Map of navigators used to navigate the component.
		 *
		 * Use the config to set built-in navigators to use or add a custom one using
		 * {{#crossLink "FlowCarousel/addNavigator"}}{{/crossLink}}.
		 *
		 * @type {AbstractNavigator[]}
		 * @private
		 * @default {}
		 */
		this._navigators = {};

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
		 * List of item indexes that have been rendered.
		 *
		 * @property _renderedItemIndexes
		 * @type {array}
		 * @private
		 */
		this._renderedItemIndexes = [];

		/**
		 * List of placeholder indexes that have been rendered.
		 *
		 * TODO consider getting rid of this index list
		 *
		 * @property _renderedPlaceholderIndexes
		 * @type {array}
		 * @private
		 */
		this._renderedPlaceholderIndexes = [];

		/**
		 * Mapping of renderer item indexes to their dom elements.
		 *
		 * @property _itemIndexToElementMap
		 * @type {object}
		 * @default {}
		 * @private
		 */
		this._itemIndexToElementMap = {};

		/**
		 * Map of delayed tasks used by {{#crossLink "FlowCarousel/_performDelayed"}}{{/crossLink}}.
		 *
		 * @property _delayedTasks
		 * @type {object}
		 * @private
		 */
		this._delayedTasks = {};

		/**
		 * The deferred promise to the currently loading itemset.
		 *
		 * @property _getItemsPromise
		 * @type {Deferred.Promise|null}
		 * @private
		 */
		this._getItemsPromise = null;

		/**
		 * The deferred promise to the current animation.
		 *
		 * Set to null if no animation is playing.
		 *
		 * @property _activeAnimationPromise
		 * @type {Deferred.Promise|null}
		 * @private
		 */
		this._activeAnimationPromise = null;

		/**
		 * Has the {{#crossLink "FlowCarousel/Event/STARTUP_ITEMS_RENDERED:property"}}{{/crossLink}} event bee emitted.
		 *
		 * @property _startupItemsRenderedEmitted
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._startupItemsRenderedEmitted = false;
	}

	FlowCarousel.prototype = Object.create(EventEmitter.prototype);

	/**
	 * Reference to the {{#crossLink "Config"}}{{/crossLink}} class.
	 *
	 * Useful to access the enumerations in the configuration class.
	 *
	 * @property Config
	 * @type {Config}
	 */
	FlowCarousel.Config = Config;

	/**
	 * Reference to the {{#crossLink "AbstractDataSource"}}{{/crossLink}} class.
	 *
	 * @property AbstractDataSource
	 * @type {Config}
	 */
	FlowCarousel.AbstractDataSource = AbstractDataSource;

	/**
	 * Reference to the {{#crossLink "AbstractRenderer"}}{{/crossLink}} class.
	 *
	 * @property AbstractRenderer
	 * @type {Config}
	 */
	FlowCarousel.AbstractRenderer = AbstractRenderer;

	/**
	 * Reference to the {{#crossLink "AbstractAnimator"}}{{/crossLink}} class.
	 *
	 * @property AbstractAnimator
	 * @type {Config}
	 */
	FlowCarousel.AbstractAnimator = AbstractAnimator;

	/**
	 * Reference to the {{#crossLink "AbstractNavigator"}}{{/crossLink}} class.
	 *
	 * @property AbstractNavigator
	 * @type {Config}
	 */
	FlowCarousel.AbstractNavigator = AbstractNavigator;

	/**
	 * Reference to the {{#crossLink "KeyboardNavigator"}}{{/crossLink}} class.
	 *
	 * @property KeyboardNavigator
	 * @type {KeyboardNavigator}
	 */
	FlowCarousel.KeyboardNavigator = KeyboardNavigator;

	/**
	 * Reference to the {{#crossLink "DragNavigator"}}{{/crossLink}} class.
	 *
	 * @property DragNavigator
	 * @type {DragNavigator}
	 */
	FlowCarousel.DragNavigator = DragNavigator;

	/**
	 * Reference to the {{#crossLink "Deferred"}}{{/crossLink}} class.
	 *
	 * @property Deferred
	 * @type {Config}
	 */
	FlowCarousel.Deferred = Deferred;

	/**
	 * Possible size modes used by {{#crossLink "FlowCarousel/_getWrapSize"}}{{/crossLink}}.
	 *
	 * @property SizeMode
	 * @type {object}
	 * @param {string} SizeMode.INNER='inner' Inner size
	 * @param {string} SizeMode.OUTER='outer' Outer size
	 * @private
	 * @static
	 */
	FlowCarousel.SizeMode = {
		INNER: 'inner',
		OUTER: 'outer'
	};

	/**
	 * List of possible events emitted by the carousel.
	 *
	 * The event system uses the Wolfy87 EventEmitter implementation https://github.com/Wolfy87/EventEmitter.
	 *
	 * You can subscribe to events using carousel.addListener(carousel.Event.INITIATED, function() { ... }); etc
	 *
	 * The [startIndex, endIndex] syntax shows the parameters passed to the callback.
	 *
	 * @property Event
	 * @param {string} Event.INITIATING='initiating' Emitted when starting initiation
	 * @param {string} Event.INITIATED='initiated' Emitted after completing initiation
	 * @param {string} Event.STARTUP_ITEMS_RENDERED='startup-items-rendered' Emitted after rendering the first data
	 * @param {string} Event.LOADING_ITEMS='loading-items' [startIndex, endIndex] Emitted when starting to load a new
	 * 				   set of items
	 * @param {string} Event.LOADED_ITEMS='loaded-items' [startIndex, endIndex, items] Emitted when a new set of items
	 * 				   was loaded and rendered
	 * @param {string} Event.ABORTED_ITEMS='aborted-items' [startIndex, endIndex] Emitted when loading a range of items
	 * 				   was aborted
	 * @param {string} Event.NAVIGATING_TO_ITEM='navigating-to-item' [itemIndex, instant] Emitted when starting to
	 * 				   navigate to a carousel item index
	 * @param {string} Event.NAVIGATED_TO_ITEM='navigated-to-item' [itemIndex, instant] Emitted when finished
	 * 				   navigate to a carousel item index including animation
	 * @param {string} Event.NAVIGATING_TO_PAGE='navigating-to-page' [pageIndex, instant] Emitted when starting to
	 * 				   navigate to a carousel item index
	 * @param {string} Event.NAVIGATED_TO_PAGE='navigated-to-page' [pageIndex, instant] Emitted when finished
	 * 				   navigate to a carousel item index including animation
	 * @param {string} Event.LAYOUT_CHANGED='layout-changed' Emitted when the layout is re-calculated
	 * @type {object}
	 */
	FlowCarousel.Event = {
		INITIATING: 'initiating',
		INITIATED: 'initiated',
		STARTUP_ITEMS_RENDERED: 'startup-items-rendered',

		LOADING_ITEMS: 'loading-items',
		LOADED_ITEMS: 'loaded-items',
		ABORTED_ITEMS: 'aborted-items',

		NAVIGATING_TO_ITEM: 'navigating-to-item',
		NAVIGATED_TO_ITEM: 'navigated-to-item',

		NAVIGATING_TO_PAGE: 'navigating-to-page',
		NAVIGATED_TO_PAGE: 'navigated-to-page',

		LAYOUT_CHANGED: 'layout-changed'
	};

	/**
	 * Initializes the carousel component.
	 *
	 * Returns a promise that will be resolved once the carousel has been initiated.
	 *
	 * Emits:
	 * - FlowCarousel.Event.INITIATING at the start of the procedure
	 * - FlowCarousel.Event.INITIATED after initiation but the initial data may not have loaded yet
	 * - FlowCarousel.Event.STARTUP_ITEMS_RENDERED after the initial set of data has rendered
	 *
	 * @method init
	 * @param {string} selector Selector of elements to turn into a carousel
	 * @param {object} [userConfig] Optional user configuration object overriding defaults in the
	 * {{#crossLink "Config"}}{{/crossLink}}.
	 * @return {Deferred.Promise}
	 */
	FlowCarousel.prototype.init = function(selector, userConfig) {
		var promise;

		this.emitEvent(FlowCarousel.Event.INITIATING);

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
			throw new Error('Unexpected data source type "' + typeof this._config.dataSource + '" provided');
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
		promise = this._setupCarousel(this._mainWrap, this._config.orientation);

		// setup the default navigators
		this._setupDefaultNavigators();

		// emit the initiated event once done
		promise.done(function() {
			this.emitEvent(FlowCarousel.Event.INITIATED);

			this._validateItemsToRender();
		}.bind(this));

		return promise;
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
	 * Returns the size of a single page of items.
	 *
	 * @method getPageSize
	 * @return {number}
	 */
	FlowCarousel.prototype.getPageSize = function() {
		var wrapSize = this._getElementSize(this._mainWrap, this._config.orientation),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage);

		return itemsPerPage * itemSize;
	};

	/**
	 * Returns the size of the entire scroller that would fit all the elements.
	 *
	 * @method getTotalSize
	 * @return {number}
	 */
	FlowCarousel.prototype.getTotalSize = function() {
		var wrapSize = this._getElementSize(this._mainWrap, this._config.orientation),
			itemCount = this._dataSource.getItemCount(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage);

		return itemCount * itemSize;
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
	 * Returns the number of pages the dataset contains given current wrap size.
	 *
	 * @method getPageCount
	 * @return {number}
	 */
	FlowCarousel.prototype.getPageCount = function() {
		return Math.ceil(this._dataSource.getItemCount() / this.getItemsPerPage());
	};

	/**
	 * Returns the number of items displayed on a single page.
	 *
	 * @method getItemsPerPage
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemsPerPage = function() {
		var wrapSize = this._getElementSize(this._mainWrap, this._config.orientation);

		return this._config.getItemsPerPage(wrapSize);
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
	 * Returns currently visible page number.
	 *
	 * Always returns an integer flooring to the closest round page number.
	 *
	 * The page number starts at zero for first page.
	 *
	 * @method getCurrentPageIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentPageIndex = function() {
		var itemsPerPage = this.getItemsPerPage();

		return Math.floor(this._currentItemIndex / itemsPerPage);
	};

	/**
	 * Returns current item absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentItemPosition = function() {
		return this._animator.getCurrentPosition();
	};

	/**
	 * Returns item position at given index.
	 *
	 * @method getItemPositionByIndex
	 * @param {number} itemIndex Item index
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemPositionByIndex = function(itemIndex) {
		var itemSize = this.getItemSize(),
			itemsPerPage = this.getItemsPerPage(),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage);

		return Math.floor(itemIndex * itemSize + itemIndex * (itemMargin - gapPerItem));
	};

	/**
	 * Returns the closest full item index at given position taking into account the direction of movement.
	 *
	 * @method getClosestItemIndexAtPosition
	 * @param {number} position Scroller position
	 * @param {number} direction Move direction (-1/1)
	 * @return {number} Closest item index
	 */
	FlowCarousel.prototype.getClosestItemIndexAtPosition = function(position, direction) {
		var itemSize = this.getItemSize(),
			itemCount = this.getItemCount(),
			itemsPerPage = this.getItemsPerPage(),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			itemIndex = -position / (itemSize + (itemMargin - gapPerItem)),
			result;

		if (direction < 0) {
			result = Math.ceil(itemIndex);
		} else {
			result = Math.floor(itemIndex);
		}

		// limit the range
		return Math.min(Math.max(result, 0), itemCount - itemsPerPage);
	};

	/**
	 * Returns the closest full page index at given position taking into account the direction of movement.
	 *
	 * @method getClosestPageIndexAtPosition
	 * @param {number} position Scroller position
	 * @param {number} direction Move direction (-1/1)
	 * @return {number} Closest page index
	 */
	FlowCarousel.prototype.getClosestPageIndexAtPosition = function(position, direction) {
		var closestItemIndex = this.getClosestItemIndexAtPosition(position, direction),
			itemsPerPage = this.getItemsPerPage(),
			pageCount = this.getPageCount(),
			pageIndex = closestItemIndex / itemsPerPage,
			result;

		if (direction < 0) {
			result = Math.ceil(pageIndex);
		} else {
			result = Math.floor(pageIndex);
		}

		// limit the range
		return Math.min(Math.max(result, 0), pageCount - 1);
	};

	/**
	 * Returns the range of items that should be rendered for current item index and config.
	 *
	 * @method getRenderRange
	 * @param {number} [itemIndex=this._currentItemIndex] Optional item index to use, defaults to current
	 * @return {object} Render range with start and end keys
	 * @private
	 */
	FlowCarousel.prototype.getRenderRange = function(itemIndex) {
		itemIndex = itemIndex || this._currentItemIndex;

		var itemsPerPage = this.getItemsPerPage(),
			itemCount = this._dataSource.getItemCount();

		return this._config.getRenderRange(itemIndex, itemsPerPage, itemCount);
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
	 * Adds a new navigator to use.
	 *
	 * @method addNavigator
	 * @param {string} type Type of the navigator, should be unique
	 * @param {AbstractNavigator} instance Navigator instance
	 */
	FlowCarousel.prototype.addNavigator = function(type, instance) {
		if (typeof this._navigators[type] !== 'undefined') {
			throw new Error('Navigator of type "' + type + '" already added');
		}

		if (!(instance instanceof AbstractNavigator)) {
			throw new Error('The navigator is expected to be an instance of AbstractNavigator');
		}

		this._navigators[type] = instance;

		// initiate the navigator
		this._navigators[type].init(this);
	};

	/**
	 * Returns navigator instance by type.
	 *
	 * @method getNavigatorByType
	 * @param {string} type Type of the navigator, should be unique
	 * @return {AbstractNavigator|null} Navigator instance or null if not found
	 */
	FlowCarousel.prototype.getNavigatorByType = function(type) {
		if (typeof this._navigators[type] === 'undefined') {
			return null;
		}

		return this._navigators[type];
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
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_ITEM [itemIndex, instant] before animation
	 * - FlowCarousel.Event.NAVIGATED_TO_ITEM [itemIndex, instant] after animation
	 *
	 * @method navigateToItem
	 * @param {number} itemIndex Item index to navigate to
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [force=false] Force the animation even if we think we're already at given item index
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToItem = function(itemIndex, instant, force) {
		instant = typeof instant === 'boolean' ? instant : false;
		force = typeof force === 'boolean' ? force : false;

		var itemCount = this._dataSource.getItemCount(),
			isSameItemIndex = itemIndex === this._currentItemIndex,
			fakeAnimationDeferred = null,
			animationPromise;

		// validate index range
		if (itemIndex < 0) {
			throw new Error('Invalid negative  index "' + itemIndex + '" requested');
		} else if (itemIndex > itemCount - 1) {
			throw new Error('Too large index "' + itemIndex + '" requested, there are only ' + itemCount + ' items');
		}

		// return the existing animation promise if already animating
		if (this._isAnimating) {
			return this._activeAnimationPromise;
		}

		// update the target item index
		this._targetItemIndex = itemIndex;
		this._isAnimating = true;

		// animate to the new item position index if it's different from current item index
		if (!isSameItemIndex || force === true) {
			// start animating to given item, this is an asynchronous process
			animationPromise = this._animator.animateToItem(itemIndex, instant);

			// emitting this event before starting the animation causes lag for some reason
			this.emitEvent(FlowCarousel.Event.NAVIGATING_TO_ITEM, [itemIndex, instant]);
		} else {
			// if the currently active index is requested then just ignore the call and resolve immediately
			fakeAnimationDeferred = new Deferred();

			animationPromise = fakeAnimationDeferred.promise();
		}

		// render placeholders that are later replaced with real loaded items
		if (this._config.usePlaceholders && this._dataSource.isAsynchronous()) {
			this._renderTargetIndexPlaceholders();
		}

		// once the animation is complete, update the current item index
		animationPromise.done(function() {
			this._currentItemIndex = itemIndex;
			this._isAnimating = false;
			this._activeAnimationPromise = null;

			// remove items that have moved out of range
			this._removeInvalidItems();

			// check whether we need to render or remove some items
			this._validateItemsToRender();

			// set the scroller wrap size to the largest currently visible item size
			this._setScrollerSizeToLargestVisibleChildSize();

			this.emitEvent(FlowCarousel.Event.NAVIGATED_TO_ITEM, [itemIndex, instant]);
		}.bind(this));

		// resolve the instant fake animation
		if (fakeAnimationDeferred !== null) {
			fakeAnimationDeferred.resolve();
		}

		// store the promise so it can be returned when requesting a new animation while the last still playing
		this._activeAnimationPromise = animationPromise;

		return animationPromise;
	};

	/**
	 * Navigates to given page number.
	 *
	 * Notice that page numbers start from zero.
	 *
	 * Throws error if out of bounds index is requested.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_PAGE at the start of the procedure
	 * - FlowCarousel.Event.NAVIGATED_TO_PAGE after the animation to requested page
	 *
	 * @method navigateToPage
	 * @param {number} pageIndex Page index to navigate to
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [force=false] Force the animation even if we think we're already at given item index
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToPage = function(pageIndex, instant, force) {
		instant = typeof instant === 'boolean' ? instant : false;

		var itemIndex = pageIndex * this.getItemsPerPage(),
			promise;

		this.emitEvent(FlowCarousel.Event.NAVIGATING_TO_PAGE, [pageIndex, instant]);

		promise = this.navigateToItem(itemIndex, instant, force);

		promise.done(function() {
			this.emitEvent(FlowCarousel.Event.NAVIGATED_TO_PAGE, [pageIndex, instant]);
		}.bind(this));

		return promise;
	};

	/**
	 * Navigates to next carousel item.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_ITEM [itemIndex, instant] before animation
	 * - FlowCarousel.Event.NAVIGATED_TO_ITEM [itemIndex, instant] after animation
	 *
	 * @method navigateToNextItem
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToNextItem = function(instant) {
		var currentItemIndex = this.getCurrentItemIndex(),
			itemsPerPage = this.getItemsPerPage(),
			itemCount = this.getItemCount(),
			targetItemIndex = Math.min(currentItemIndex + 1, itemCount - itemsPerPage);

		return this.navigateToItem(targetItemIndex, instant);
	};

	/**
	 * Navigates to previous carousel item.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_ITEM [itemIndex, instant] before animation
	 * - FlowCarousel.Event.NAVIGATED_TO_ITEM [itemIndex, instant] after animation
	 *
	 * @method navigateToPreviousItem
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToPreviousItem = function(instant) {
		var currentItemIndex = this.getCurrentItemIndex(),
			targetItemIndex = Math.max(currentItemIndex - 1, 0);

		return this.navigateToItem(targetItemIndex, instant);
	};

	/**
	 * Navigates to next page if available.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_PAGE at the start of the procedure
	 * - FlowCarousel.Event.NAVIGATED_TO_PAGE after the animation to requested page
	 *
	 * @method navigateToNextPage
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToNextPage = function(instant) {
		var currentPageIndex = this.getCurrentPageIndex(),
			pageCount = this.getPageCount(),
			targetPageIndex = Math.min(currentPageIndex + 1, pageCount - 1);

		return this.navigateToPage(targetPageIndex, instant);
	};

	/**
	 * Navigates to previous page if available.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_PAGE at the start of the procedure
	 * - FlowCarousel.Event.NAVIGATED_TO_PAGE after the animation to requested page
	 *
	 * @method navigateToPreviousPage
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToPreviousPage = function(instant) {
		var currentPageIndex = this.getCurrentPageIndex(),
			targetPageIndex = Math.max(currentPageIndex - 1, 0);

		return this.navigateToPage(targetPageIndex, instant);
	};

	/**
	 * Returns the range of currently visible carousel item wrappers.
	 *
	 * @method getCurrentPageVisibleRange
	 * @return {object}
	 * @return {number} return.start Visible range start index
	 * @return {number} return.end Visible range end index
	 */
	FlowCarousel.prototype.getCurrentPageVisibleRange = function() {
		var itemsPerPage = this.getItemsPerPage(),
			itemCount = this.getItemCount();

		return {
			start: this._currentItemIndex,
			end: Math.max(Math.min(this._currentItemIndex + itemsPerPage - 1, itemCount - 1), 0)
		};
	};

	/**
	 * Returns the list of currently visible carousel item wrappers.
	 *
	 * @method getCurrentPageVisibleItemElements
	 * @return {DOMElement[]}
	 */
	FlowCarousel.prototype.getCurrentPageVisibleItemElements = function() {
		var visibleRange = this.getCurrentPageVisibleRange(),
			elements = [],
			element,
			i;

		for (i = visibleRange.start; i <= visibleRange.end; i++) {
			element = this.getItemElementByIndex(i);

			/* istanbul ignore if */
			if (element === null) {
				throw new Error('Requested item element at index #' + i + ' not found, this should not happen');
			}

			elements.push(element);
		}

		return elements;
	};

	/**
	 * Returns the item dom element by item index.
	 *
	 * Throws error if invalid index is requested.
	 *
	 * @method getItemElementByIndex
	 * @param {number} itemIndex Item index to fetch element of
	 * @return {DOMElement|null} Item dom element or null if not found
	 * @private
	 */
	FlowCarousel.prototype.getItemElementByIndex = function(itemIndex) {
		var itemCount = this.getItemCount();

		// validate index range
		if (itemIndex < 0) {
			throw new Error('Invalid negative  index "' + itemIndex + '" requested');
		} else if (itemIndex > itemCount - 1) {
			throw new Error('Too large index "' + itemIndex + '" requested, there are only ' + itemCount + ' items');
		}

		if (typeof this._itemIndexToElementMap[itemIndex] === 'undefined') {
			return null;
		}

		return this._itemIndexToElementMap[itemIndex];
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
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._setupCarousel = function(wrap, orientation) {
		var $element = $(wrap),
			className = {
				wrap: this._config.getClassName('wrap'),
				items: this._config.getClassName('items'),
				item: this._config.getClassName('item'),
				scroller: this._config.getClassName('scroller'),
				matchWrap: this._config.getClassName('matchWrap'),
				matchLargestItem: this._config.getClassName('matchLargestItem'),
				initiating: this._config.getClassName('initiating'),
				horizontal: this._config.getClassName('horizontal'),
				vertical: this._config.getClassName('vertical')
			},
			sizeMode = this._config.sizeMode,
			$itemsWrap,
			$scrollerWrap,
			layoutPromise,
			animationDeferred;

		// remove any existing content (HtmlDataSource should have done that already anyway
		$element.empty();

		// create the items and the scroller wraps
		$itemsWrap = $('<div></div>', {
			'class': className.items
		});

		$scrollerWrap = $('<div></div>', {
			'class': className.scroller
		});

		// add size mode class to the main wrap element
		if (sizeMode === Config.SizeMode.MATCH_WRAP) {
			$(this._mainWrap).addClass(className.matchWrap);
		} else if (sizeMode === Config.SizeMode.MATCH_LARGEST_ITEM) {
			$(this._mainWrap).addClass(className.matchLargestItem);
		} else {
			throw new Error('Invalid size mode "' + sizeMode + '" defined');
		}

		// add the items and scroller wraps
		$itemsWrap.append($scrollerWrap);
		$element.append($itemsWrap);

		// store references to the items and scroller wrap dom elements
		this._itemsWrap = $itemsWrap[0];
		this._scrollerWrap = $scrollerWrap[0];

		// add main carousel class to the wrap element
		$element.addClass(className.wrap);
		$element.addClass(className.initiating);

		// add class to wrap based on orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			$element.addClass(className.horizontal);
		} else if (orientation === Config.Orientation.VERTICAL) {
			$element.addClass(className.vertical);
		} else {
			throw new Error('Unexpected orientation "' + orientation + '" provided');
		}

		// setup the individual elements
		layoutPromise = this._setupLayout(wrap, orientation);

		// if we're using responsive layout then we need to recalculate sizes and positions if the wrap size changes
		if (this._config.useResponsiveLayout) {
			this._setupResponsiveLayoutListener(wrap, orientation);
		}

		// remove the loading class
		$element.removeClass(className.initiating);

		// throw error if both item and page start indexes are set
		if (this._config.startItemIndex !== null && this._config.startPageIndex !== null) {
			throw new Error('Set either the startItemIndex or startPageIndex option but not both');
		}

		// navigate to the start index item immediately if set
		if (this._config.startItemIndex !== null) {
			animationDeferred = new Deferred();

			// wait for the layout to complete and then perform the animation and resolve once that completes too
			layoutPromise.done(function() {
				this.navigateToItem(this._config.startItemIndex, !this._config.animateToStartIndex)
					.done(function() {
						animationDeferred.resolve();
					});
			}.bind(this));

			return animationDeferred.promise();
		} else if (this._config.startPageIndex !== null) {
			animationDeferred = new Deferred();

			// wait for the layout to complete and then perform the animation and resolve once that completes too
			layoutPromise.done(function() {
				this.navigateToPage(this._config.startPageIndex, !this._config.animateToStartIndex)
					.done(function() {
						animationDeferred.resolve();
					});
			}.bind(this));

			return animationDeferred.promise();
		} else {
			return layoutPromise;
		}
	};

	/**
	 * Sets up the layout and renders the initial set of items.
	 *
	 * Since fetching and rendering items can be asyncronous, this method returns a promise.
	 *
	 * Emits:
	 * - FlowCarousel.Event.LAYOUT_CHANGED when the layout changes
	 *
	 * @method _setupLayout
	 * @param {DOMelement} element Element to setup items in
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @param {number} [startItemIdex] Optional item index to navigate to instantly
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._setupLayout = function(element, orientation, startItemIndex) {
		var wrapSize = this._getElementSize(element, orientation),
			itemCount = this._dataSource.getItemCount(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			totalSize = Math.ceil(itemCount * itemSize),
			sizeProp = orientation === Config.Orientation.HORIZONTAL
				? 'width'
				: 'height',
			deferred = new Deferred();

		// define the scroller wrap size to fit all items
		$(this._scrollerWrap).css(sizeProp, totalSize);

		// if the start item index is set then navigate to it instantly
		if (typeof startItemIndex === 'number') {
			this._targetItemIndex = startItemIndex;
			this._currentItemIndex = startItemIndex;

			this._animator.animateToItem(startItemIndex, true, true);
		}

		// render placeholders that are later replaced with real loaded items
		if (this._config.usePlaceholders && this._dataSource.isAsynchronous()) {
			this._renderTargetIndexPlaceholders();
		}

		deferred.done(function() {
			this.emitEvent(FlowCarousel.Event.LAYOUT_CHANGED);
		}.bind(this));

		// setting up layout is synchronous for now
		deferred.resolve();

		return deferred.promise();
	};

	/**
	 * Sets up the default navigators to use as defined in the {{#crossLink "Config"}}{{/crossLink}}.
	 *
	 * @method _setupDefaultNavigators
	 * @private
	 */
	FlowCarousel.prototype._setupDefaultNavigators = function() {
		var navigator = null,
			type,
			i;

		for (i = 0; i < this._config.navigators.length; i++) {
			type = this._config.navigators[i];

			switch (type) {
				case Config.Navigator.KEYBOARD:
					navigator = new KeyboardNavigator(this._config.keyboardNavigatorMode);
				break;

				case Config.Navigator.DRAG:
					navigator = new DragNavigator(this._config.dragNavigatorMode);
				break;

				default:
					throw new Error('Navigator of type "' + type + '" is not supported');
			}

			if (navigator !== null) {
				this.addNavigator(type, navigator);
			}
		}
	};

	/**
	 * Validates whether all the required items have been rendered and initiates rendering them if not.
	 *
	 * @method _validateItemsToRender
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._validateItemsToRender = function() {
		var renderRange = this.getRenderRange();

		return this._renderItemRange(renderRange.start, renderRange.end);
	};

	/**
	 * Removes items that have gone out of the render range.
	 *
	 * @method _removeInvalidItems
	 * @private
	 */
	FlowCarousel.prototype._removeInvalidItems = function() {
		var renderRange = this.getRenderRange(),
			filteredPlaceholderItemIndexes = [],
			filteredRenderedItemIndexes = [],
			itemIndex,
			itemElement,
			i;

		// destroy rendered items out of the render range
		for (i = 0; i < this._renderedPlaceholderIndexes.length; i++) {
			itemIndex = this._renderedPlaceholderIndexes[i];

			if (itemIndex < renderRange.start || itemIndex >= renderRange.end - 1) {
				itemElement = this.getItemElementByIndex(itemIndex);

				/* istanbul ignore if */
				if (itemElement === null) {
					throw new Error(
						'Placeholder element at index #' + itemIndex + ' not found, this should not happen'
					);
				}

				this._renderer.destroyItem(itemElement);

				delete this._itemIndexToElementMap[itemIndex];
			} else {
				filteredPlaceholderItemIndexes.push(itemIndex);
			}
		}

		this._renderedPlaceholderIndexes = filteredPlaceholderItemIndexes;

		// destroy rendered items out of the render range
		for (i = 0; i < this._renderedItemIndexes.length; i++) {
			itemIndex = this._renderedItemIndexes[i];

			if (itemIndex < renderRange.start || itemIndex >= renderRange.end - 1) {
				itemElement = this.getItemElementByIndex(itemIndex);

				/* istanbul ignore if */
				if (itemElement === null) {
					throw new Error('Item element at index #' + itemIndex + ' not found, this should not happen');
				}

				this._renderer.destroyItem(itemElement);

				delete this._itemIndexToElementMap[itemIndex];
			} else {
				filteredRenderedItemIndexes.push(itemIndex);
			}
		}

		this._renderedItemIndexes = filteredRenderedItemIndexes;
	};

	/**
	 * Renders a range of carousel items.
	 *
	 * Emits:
	 * - FlowCarousel.Event.LOADING_ITEMS [startIndex, endIndex] before starting to load a range of items
	 * - FlowCarousel.Event.ABORTED_ITEMS [startIndex, endIndex] if loading or a range of items was aborted
	 * - FlowCarousel.Event.LOADED_ITEMS [startIndex, endIndex, items] after loading and rendering a range of items
	 * - FlowCarousel.Event.STARTUP_ITEMS_RENDERED if the rendered range of items was the first
	 *
	 * @method _renderItemRange
	 * @param {number} startIndex Range start index
	 * @param {number} endIndex Range end index
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._renderItemRange = function(startIndex, endIndex) {
		var self = this,
			deferred = new Deferred(),
			loadingClassName = this._config.getClassName('loading');

		// for asyncronous data source add the loading class to the main wrap for the duration of the async request
		if (this._dataSource.isAsynchronous()) {
			$(this._mainWrap).addClass(loadingClassName);
		}

		// try to abort existing item loading if possible
		if (this._getItemsPromise !== null) {
			/* istanbul ignore if */
			if (typeof this._getItemsPromise.abort === 'function') {
				this._getItemsPromise.abort();
			}

			this._getItemsPromise._ignore = true;

			this._getItemsPromise = null;
		}

		this.emitEvent(FlowCarousel.Event.LOADING_ITEMS, [startIndex, endIndex]);

		// store the new itemset fetching deferred promise and fetch new items
		this._getItemsPromise = this._dataSource.getItems(startIndex, endIndex)
			.done(function(items) {
				// ignore invalid data if it couldn't be aborted
				if (this._ignore === true) {
					self.emitEvent(FlowCarousel.Event.ABORTED_ITEMS, [startIndex, endIndex]);

					return;
				}

				self._getItemsPromise = null;

				if (self._dataSource.isAsynchronous()) {
					$(self._mainWrap).removeClass(loadingClassName);
				}

				// rendering items can be asyncronous as well
				self._renderItems(items, startIndex).done(function() {
					// it's possible that the initial first page data loading was cancelled
					if (!this._startupItemsRenderedEmitted) {
						this.emitEvent(FlowCarousel.Event.STARTUP_ITEMS_RENDERED);

						this._startupItemsRenderedEmitted = true;
					}

					this.emitEvent(FlowCarousel.Event.LOADED_ITEMS, [startIndex, endIndex, items]);

					deferred.resolve();
				}.bind(self));
			});

		return deferred.promise();
	};

	/**
	 * Renders the item placeholders for current target index.
	 *
	 * @method _renderTargetIndexPlaceholders
	 * @private
	 */
	FlowCarousel.prototype._renderTargetIndexPlaceholders = function() {
		var targetItemIndex = this._targetItemIndex,
			renderRange = this.getRenderRange(targetItemIndex);

		// render placeholders that are later replaced with real loaded items
		// TODO this is not needed for syncronous data source
		this._renderItemPlaceholders(renderRange.start, renderRange.end);
	};

	/**
	 * Renders the item placeholders that will later be replaced with the actual items.
	 *
	 * Gives the user some "loading" feedback.
	 *
	 * @method _renderItemPlaceholders
	 * @param {number} startIndex The starting index
	 * @param {number} endIndex The end item index
	 * @private
	 */
	FlowCarousel.prototype._renderItemPlaceholders = function(startIndex, endIndex) {
		var elements = [],
			element,
			itemIndex;

		for (itemIndex = startIndex; itemIndex < endIndex; itemIndex++) {
			// don't render a placeholder onto already existing rendered item
			/* istanbul ignore if */
			if (this._renderedItemIndexes.indexOf(itemIndex) !== -1) {
				elements.push(null);
			} else {
				// request the placeholder element from the renderer
				element = this._renderer.renderPlaceholder(this._config, itemIndex);

				elements.push(element);
			}
		}

		this._insertRenderedElements(elements, startIndex, true);
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
			renderRange = this.getRenderRange(),
			renderingClassName = this._config.getClassName('rendering'),
			promises = [],
			outOfRange,
			itemIndex,
			item,
			promise,
			existingElement,
			existingElementPos,
			i;

		// it is possible that the carousel HTML element gets removed from DOM while the async request completes
		/* istanbul ignore if */
		if ($(this._mainWrap).parent().length === 0) {
			deferred.resolve();

			return deferred.promise();
		}

		for (i = 0; i < items.length; i++) {
			item = items[i];
			itemIndex = startIndex + i;
			outOfRange = itemIndex < renderRange.start || itemIndex > renderRange.end - 1;

			/* istanbul ignore if */
			if (outOfRange) {
				existingElement = this._itemIndexToElementMap[itemIndex];

				if (typeof existingElement !== 'undefined') {
					this._renderer.destroyItem(existingElement);

					delete this._itemIndexToElementMap[itemIndex];

					// remove the item from the placeholder item indexes list if exists
					existingElementPos = this._renderedPlaceholderIndexes.indexOf(itemIndex);

					if (existingElementPos !== -1) {
						this._renderedPlaceholderIndexes.splice(existingElementPos, 1);
					}
				}
			}

			// only render the item if it's not already rendered and it's not out of current render range
			if (this._renderedItemIndexes.indexOf(itemIndex) === -1 && !outOfRange) {
				promise = this._renderer.renderItem(this._config, itemIndex, item);
			} else {
				promise = null;
			}

			promises.push(promise);
		}

		// add the rendering class to the main wrap for the duration of the rendering process
		$(this._mainWrap).addClass(renderingClassName);

		// wait for all the elements to get rendered
		// TODO Add each element as soon as it renders?
		Deferred.when.apply($, promises)
			.done(function() {
				$(this._mainWrap).removeClass(renderingClassName);

				this._insertRenderedElements(arguments, startIndex);

				deferred.resolve();
			}.bind(this));

		return deferred.promise();
	};

	/**
	 * Inserts rendered dom elements into the carousel dom structure.
	 *
	 * @method _insertRenderedElements
	 * @param {DOMElement[]} elements Elements to insert
	 * @param {number} startIndex First element index in the carousel
	 * @param {boolean} [arePlaceholders=false] Are the elements placeholders
	 * @private
	 */
	FlowCarousel.prototype._insertRenderedElements = function(elements, startIndex, arePlaceholders) {
		var elementIndex,
			placeholderPos,
			placeholderElement,
			i;

		// it is possible that the carousel HTML element gets removed from DOM while the async request completes
		/* istanbul ignore if */
		if ($(this._mainWrap).parent().length === 0) {
			return;
		}

		for (i = 0; i < elements.length; i++) {
			// elements that were already rendered were set to null in _renderItems(), skip these
			if (elements[i] === null) {
				continue;
			}

			elementIndex = startIndex + i;

			// add the rendered and inserted items to the list of rendered items and the index to element mapping
			if (!arePlaceholders) {
				placeholderPos = this._renderedPlaceholderIndexes.indexOf(elementIndex);

				// remove placeholder if exists
				/* istanbul ignore if */
				if (placeholderPos !== -1 && typeof this._itemIndexToElementMap[elementIndex] !== 'undefined') {
					placeholderElement = this._itemIndexToElementMap[elementIndex];

					this._renderer.destroyItem(placeholderElement);

					delete this._itemIndexToElementMap[elementIndex];
					this._renderedPlaceholderIndexes.splice(placeholderPos, 1);
				}

				this._insertRenderedElement(elements[i], elementIndex);

				this._renderedItemIndexes.push(elementIndex);
			} else {
				// only add placeholders if they don't already exist
				if (this._renderedPlaceholderIndexes.indexOf(elementIndex) === -1) {
					this._insertRenderedElement(elements[i], elementIndex, true);

					this._renderedPlaceholderIndexes.push(elementIndex);
				}
			}
		}

		// set the scroller wrap size to the largest currently visible item size
		this._setScrollerSizeToLargestVisibleChildSize();
	};

	/**
	 * Inserts a rendered dom element into the carousel dom structure.
	 *
	 * @method _insertRenderedElement
	 * @param {DOMElement} element Element to insert
	 * @param {number} index Element index
	 * @param {boolean} isPlaceholder Is the element a placeholder
	 * @private
	 */
	FlowCarousel.prototype._insertRenderedElement = function(element, index, isPlaceholder) {
		// calculate the properties of the element
		var $element = $(element),
			orientation = this._config.orientation,
			sizeMode = this._config.sizeMode,
			wrapSize = this._getElementSize(this._mainWrap, orientation),
			oppositeOrientation = this._getOppositeOrientation(orientation),
			wrapOppositeSize = this._getElementSize(this._mainWrap, oppositeOrientation),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			effectiveSize = itemSize - gapPerItem,
			effectiveOffset = Math.floor(index * itemSize + index * (itemMargin - gapPerItem)),
			$wrapper = $('<div></div>'),
			cssProperties = {},
			$wrappedElement;

		// make sure the wrap has size if wrap size matching is used
		/* istanbul ignore if */
		if (sizeMode == Config.SizeMode.MATCH_WRAP && wrapOppositeSize === 0) {
			throw new Error('The wrap opposite size was calculated to be zero, this should not happen');
		}

		// the properties to set depends on the orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			cssProperties.width = effectiveSize;
			cssProperties.left = effectiveOffset;

			if (sizeMode == Config.SizeMode.MATCH_WRAP) {
				cssProperties.height = wrapOppositeSize;
			}
		} else if (orientation === Config.Orientation.VERTICAL) {
			cssProperties.height = effectiveSize;
			cssProperties.top = effectiveOffset;

			if (sizeMode == Config.SizeMode.MATCH_WRAP) {
				cssProperties.width = wrapOppositeSize;
			}
		}

		// wrap the item element in a carousel wrapper
		$wrappedElement = $element.wrap($wrapper).parent();

		// apply the css styles and add carousel item class
		$wrappedElement.css(cssProperties);
		$wrappedElement.addClass(this._config.getClassName('item'));

		// add the placeholder class as well if the element is a placeholder
		if (isPlaceholder) {
			$wrappedElement.addClass(this._config.getClassName('placeholder'));
		}

		// the element may be display: none to begin with, make it visible
		$element.css('display', 'block');

		// append the element to the scroller wrap
		$(this._scrollerWrap).append($wrappedElement);

		/* istanbul ignore if */
		if (typeof this._itemIndexToElementMap[index] !== 'undefined') {
			throw new Error('Element at index #' + index + ' already exists, this should not happen');
		}

		// add the wrapped element to the index to element map
		this._itemIndexToElementMap[index] = $wrappedElement[0];
	};

	/**
	 * Sets the scroller wrap size to the largest visible child size.
	 *
	 * @method _setScrollerSizeToLargestVisibleChildSize
	 * @private
	 */
	FlowCarousel.prototype._setScrollerSizeToLargestVisibleChildSize = function() {
		// only perform this routine if matching the largest item size
		if (this._config.sizeMode !== Config.SizeMode.MATCH_LARGEST_ITEM) {
			return;
		}

		var oppositeOrientation = this._getOppositeOrientation(this._config.orientation),
			sizeProp = this._config.orientation === Config.Orientation.HORIZONTAL
				? 'height'
				: 'width',
			visibleItems = this.getCurrentPageVisibleItemElements(),
			largestChildSize = this._getLargestElementSize(
				visibleItems,
				oppositeOrientation,
				FlowCarousel.SizeMode.OUTER
			);

		/* istanbul ignore if */
		if (largestChildSize === 0) {
			throw new Error('Largest child size calculated to be zero, this should not happen');
		}

		$(this._scrollerWrap).css(sizeProp, largestChildSize + 'px');
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
		var deferred = new Deferred(),
			lastItemIndex = this._currentItemIndex;

		// reset current state
		this._reset();

		// recalculate the layout navigating instantly to the last item and validate items to render afterwards
		this._setupLayout(element, orientation, lastItemIndex).done(function() {
			this._validateItemsToRender().done(function() {
				deferred.resolve();
			}.bind(this));
		}.bind(this));

		return deferred.promise();
	};

	/**
	 * Resets the component state and removes all rendered items.
	 *
	 * @method _reset
	 * @private
	 */
	FlowCarousel.prototype._reset = function() {
		$(this._scrollerWrap)
			.empty()
			.attr('style', null);

		this._itemIndexToElementMap = {};
		this._isAnimating = false;
		this._targetItemIndex = 0;
		this._currentItemIndex = 0;
		this._renderedItemIndexes = [];
		this._renderedPlaceholderIndexes = [];
		this._itemIndexToElementMap = {};
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
			// perform the re-layout routine only when the wrap size has not changed for some time
			this._performDelayed('re-layout', function() {
				this._reLayout(element, orientation);
			}.bind(this), this._config.responsiveLayoutDelay);
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
	 * Returns biggest element size of given elements given orientation and size mode.
	 *
	 * Horizontal orientation returns element width and vertical height.
	 *
	 * Mode sets whether to return the inner or outer width/height (defaults to inner).
	 *
	 * @method _getLargestElementSize
	 * @param {DOMElement[]} elements Array of elements
	 * @param {Config/Orientation:property} orientation Orientation to get size of
	 * @param {FlowCarousel.SizeMode:property} [mode=FlowCarousel.SizeMode.INNER] Size mode
	 * @return {number}
	 * @private
	 */
	FlowCarousel.prototype._getLargestElementSize = function(elements, orientation, mode) {
		var biggestSize = 0,
			children,
			inspectElement,
			elementSize;

		$(elements).each(function(index, element) {
			children = $(element).children();

			// use the first child for reference if possible
			/* istanbul ignore else */
			if (children.length > 0) {
				inspectElement = children[0];
			} else {
				inspectElement = element;
			}

			elementSize = this._getElementSize(inspectElement, orientation, mode);

			if (elementSize > biggestSize) {
				biggestSize = elementSize;
			}
		}.bind(this));

		return biggestSize;
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

	/**
	 * Performs some action delayed by given amount.
	 *
	 * If the method is called several times with the same name, the action is executed only once after the time
	 * has passed from the last call.
	 *
	 * @method performDelayed
	 * @param {String} name Name of the action
	 * @param {Function} callback Callback to call
	 * @param {Number} [delay=1000] The delay, default to 1000 ms
	 */
	FlowCarousel.prototype._performDelayed = function(name, callback, delay) {
		delay = delay || 1000;

		if (typeof this._delayedTasks[name] !== 'undefined' && this._delayedTasks[name] !== null) {
			window.clearTimeout(this._delayedTasks[name]);

			this._delayedTasks[name] = null;
		}

		this._delayedTasks[name] = window.setTimeout(function() {
			this._delayedTasks[name] = null;

			callback.apply(callback, [name, delay]);
		}.bind(this), delay);
	};

	return FlowCarousel;
});