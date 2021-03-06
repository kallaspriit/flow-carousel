define([
	'jquery',
	'Config',
	'AbstractDataSource',
	'ArrayDataSource',
	'HtmlDataSource',
	'AbstractAnimator',
	'TransformAnimator',
	'ScrollAnimator',
	'AbstractRenderer',
	'HtmlRenderer',
	'AbstractNavigator',
	'Deferred',
	'Util',
	'EventEmitter',
	'Exporter'
], function(
	$,
	Config,
	AbstractDataSource,
	ArrayDataSource,
	HtmlDataSource,
	AbstractAnimator,
	TransformAnimator,
	ScrollAnimator,
	AbstractRenderer,
	HtmlRenderer,
	AbstractNavigator,
	Deferred,
	Util,
	EventEmitter,
	Exporter
) {
	'use strict';

	/**
	 * FlowCarousel main class.
	 *
	 * Responsive paginated high-performance HTML5 carousel with AngularJS support.
	 *
	 * https://github.com/kallaspriit/flow-carousel
	 *
	 * @class FlowCarousel
	 * @extends EventEmitter
	 * @constructor
	 * @author Priit Kallas <priit@stagnationlab.com>
	 * @copyright Stagnation Lab
	 * @licence MIT
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
		 * The index of nth carousel was created (0 for first, 1 for next etc..).
		 *
		 * @property _id
		 * @type {number}
		 * @private
		 */
		this._id = FlowCarousel.instanceCount;

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
		 * Set to true once the component is destroyed, no methods are valid to call after this.
		 *
		 * @property _destroyed
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._destroyed = false;

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
		 * Is the carousel currently being dragged.
		 *
		 * @property _isDragged
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._isDragged = false;

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
		 * Item index of the last centered item.
		 *
		 * @property _lastCenterItemIndex
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastCenterItemIndex = null;

		/**
		 * Index of currently-hovered item or null if not hovering any items.
		 *
		 * @property _hoverItemIndex
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._hoverItemIndex = null;

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
		 * @property _activeAnimationDeferred
		 * @type {Deferred.Promise|null}
		 * @private
		 */
		this._activeAnimationDeferred = null;

		/**
		 * Has the {{#crossLink "FlowCarousel/Event/STARTUP_ITEMS_RENDERED:property"}}{{/crossLink}} event bee emitted.
		 *
		 * @property _startupItemsRenderedEmitted
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._startupItemsRenderedEmitted = false;

		/**
		 * The last obesrved largest child size.
		 *
		 * @property _lastLargestChildSize
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastLargestChildSize = null;

		/**
		 * Various cached sizes and values that do not need to be always calculated.
		 *
		 * @property _cache
		 * @type {object}
		 * @param {number|null} wrapSize The cached main wrap size
		 * @param {number|null} wrapOppositeSize The cached main wrap opposite size
		 * @private
		 */
		this._cache = {
			wrapSize: null,
			wrapOppositeSize: null
		};

		/**
		 * List of event listeners bound to the FlowCarousel instance.
		 *
		 * @property _eventListeners
		 * @type {object}
		 * @private
		 */
		this._eventListeners = {
			onWindowResize: this._onWindowResize.bind(this)
		};

		/**
		 * Empty clone of the cache used for resetting it.
		 *
		 * @property _emptyCache
		 * @type {object}
		 * @private
		 */
		this._emptyCache = Util.cloneObj(this._cache);

		/**
		 * Should caches be used when possible.
		 *
		 * @property _useCache
		 * @type {boolean}
		 * @default true
		 * @private
		 */
		this._useCache = true;

		/**
		 * Reference to the Event list.
		 *
		 * Useful for when you have an instance of the carousel but no reference to the class.
		 *
		 * @property Event
		 * @type FlowCarousel.Event
		 */
		this.Event = FlowCarousel.Event;

		/**
		 * Reference to the Config class.
		 *
		 * Useful for when you have an instance of the carousel but no reference to the class.
		 *
		 * @property Config
		 * @type FlowCarousel.Config
		 */
		this.Config = FlowCarousel.Config;

		// increment the instance count
		FlowCarousel.instanceCount++;
	}

	FlowCarousel.prototype = Object.create(EventEmitter.prototype);

	/**
	 * Number of instances that have been created in total.
	 *
	 * @property instanceCount
	 * @type {number}
	 * @default 0
	 * @static
	 */
	FlowCarousel.instanceCount = 0;

	/**
	 * Number of instances that are currently live meaning they have been initialized but not destroyed.
	 *
	 * @property liveCount
	 * @type {number}
	 * @default 0
	 * @static
	 */
	FlowCarousel.liveCount = 0;

	// The main FlowCarousel classes are referenced under the main FlowCarousel class so that only the main
	// class is registered in the global namespace.

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
	 * @type {AbstractDataSource}
	 */
	FlowCarousel.AbstractDataSource = AbstractDataSource;

	/**
	 * Reference to the {{#crossLink "ArrayDataSource"}}{{/crossLink}} class.
	 *
	 * @property ArrayDataSource
	 * @type {ArrayDataSource}
	 */
	FlowCarousel.ArrayDataSource = ArrayDataSource;

	/**
	 * Reference to the {{#crossLink "HtmlDataSource"}}{{/crossLink}} class.
	 *
	 * @property HtmlDataSource
	 * @type {HtmlDataSource}
	 */
	FlowCarousel.HtmlDataSource = HtmlDataSource;

	/**
	 * Reference to the {{#crossLink "AbstractRenderer"}}{{/crossLink}} class.
	 *
	 * @property AbstractRenderer
	 * @type {AbstractRenderer}
	 */
	FlowCarousel.AbstractRenderer = AbstractRenderer;

	/**
	 * Reference to the {{#crossLink "HtmlRenderer"}}{{/crossLink}} class.
	 *
	 * @property HtmlRenderer
	 * @type {HtmlRenderer}
	 */
	FlowCarousel.HtmlRenderer = HtmlRenderer;

	/**
	 * Reference to the {{#crossLink "AbstractAnimator"}}{{/crossLink}} class.
	 *
	 * @property AbstractAnimator
	 * @type {AbstractAnimator}
	 */
	FlowCarousel.AbstractAnimator = AbstractAnimator;

	/**
	 * Reference to the {{#crossLink "TransformAnimator"}}{{/crossLink}} class.
	 *
	 * @property TransformAnimator
	 * @type {TransformAnimator}
	 */
	FlowCarousel.TransformAnimator = TransformAnimator;

	/**
	 * Reference to the {{#crossLink "ScrollAnimator"}}{{/crossLink}} class.
	 *
	 * @property ScrollAnimator
	 * @type {ScrollAnimator}
	 */
	FlowCarousel.ScrollAnimator = ScrollAnimator;

	/**
	 * Reference to the {{#crossLink "AbstractNavigator"}}{{/crossLink}} class.
	 *
	 * @property AbstractNavigator
	 * @type {AbstractNavigator}
	 */
	FlowCarousel.AbstractNavigator = AbstractNavigator;

	/**
	 * Reference to the {{#crossLink "Deferred"}}{{/crossLink}} class.
	 *
	 * @property Deferred
	 * @type {Deferred}
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
	 * @param {string} Event.LOADING_ITEMS='loading-items' [startIndex, endIndex, items] Emitted when starting to load a
	 * 				   new set of items
	 * @param {string} Event.LOADED_ITEMS='loaded-items' [startIndex, endIndex, items] Emitted when a new set of items
	 * 				   was loaded
	 * @param {string} Event.ABORTED_ITEMS='aborted-items' [startIndex, endIndex] Emitted when loading a range of items
	 * 				   was aborted
	 * @param {string} Event.RENDERED_ITEMS='rendered-items' [startIndex, endIndex, elements] Emitted when a new set of
	 * 				   items was rendered
	 * @param {string} Event.DESTROYED_ITEMS='destroyed-items' [itemIndexes] Emitted when a set of items was destroyed
	 * @param {string} Event.NAVIGATING_TO_ITEM='navigating-to-item' [itemIndex, instant] Emitted when starting to
	 * 				   navigate to a carousel item index
	 * @param {string} Event.NAVIGATED_TO_ITEM='navigated-to-item' [itemIndex, instant] Emitted when finished
	 * 				   navigate to a carousel item index including animation
	 * @param {string} Event.NAVIGATING_TO_PAGE='navigating-to-page' [pageIndex, instant] Emitted when starting to
	 * 				   navigate to a carousel item index
	 * @param {string} Event.NAVIGATED_TO_PAGE='navigated-to-page' [pageIndex, instant] Emitted when finished
	 * 				   navigate to a carousel item index including animation
	 * @param {string} Event.LAYOUT_CHANGED='layout-changed' Emitted when the layout is re-calculated
	 * @param {string} Event.DRAG_BEGIN='drag-begin' [startPosition, dragOppositePosition, carouselPosition] Emitted
	 * 				   when the drag navigator begins to drag the scroller
	 * @param {string} Event.DRAG_END='drag-end' [navigationMode, startPosition, endPosition, deltaDragPosition,
	 * 				   closestIndex, direction, targetElement] Emitted when dragging stopped
	 * @type {object}
	 */
	FlowCarousel.Event = {
		INITIATING: 'initiating',
		INITIATED: 'initiated',
		STARTUP_ITEMS_RENDERED: 'startup-items-rendered',

		LOADING_ITEMS: 'loading-items',
		LOADED_ITEMS: 'loaded-items',

		ABORTED_ITEMS: 'aborted-items',

		RENDERED_ITEMS: 'rendered-items',
		DESTROYED_ITEMS: 'destroyed-items',

		NAVIGATING_TO_ITEM: 'navigating-to-item',
		NAVIGATED_TO_ITEM: 'navigated-to-item',

		NAVIGATING_TO_PAGE: 'navigating-to-page',
		NAVIGATED_TO_PAGE: 'navigated-to-page',

		LAYOUT_CHANGED: 'layout-changed',

		DRAG_BEGIN: 'drag-begin',
		DRAG_END: 'drag-end',
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
	 * @param {string|jQuery|DOMElement} element Element selector or jQuery reference or a dom element
	 * @param {object} [userConfig] Optional user configuration object overriding defaults in the
	 * 								{{#crossLink "Config"}}{{/crossLink}}.
	 * @return {Deferred.Promise}
	 */
	FlowCarousel.prototype.init = function(element, userConfig) {
		var deferred = new Deferred();

		if (this._initiated) {
			throw new Error('The carousel is already initiated');
		}

		this.emit(FlowCarousel.Event.INITIATING);

		// extend the config with user-provided values if available
		if (Util.isObject(userConfig)) {
			this._config.extend(userConfig);
		}

		// initialize the wrap element that match given selector
		this._setupElement(element);

		// use provided data source or a simple array if provided, use HtmlDataSource if nothing is provided
		if (this._config.dataSource instanceof AbstractDataSource || Util.isArray(this._config.dataSource)) {
			this.setDataSource(this._config.dataSource);
		} else if (typeof this._config.dataSource !== 'undefined' && this._config.dataSource !== null) {
			throw new Error('Unexpected data source type "' + typeof this._config.dataSource + '" provided');
		} else {
			// the data-source could have been set before init
			if (this._dataSource === null) {
				this._dataSource = new HtmlDataSource(this._mainWrap);
			}
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
			} else if (this._renderer === null) {
				throw new Error(
					'Expecting a custom "renderer" to be defined in the config if not using the HtmlDataSource'
				);
			}
		}

		// use custom animator if provided or the TransformAnimator if not
		if (this._config.animator !== null) {
			if (this._config.animator instanceof AbstractAnimator) {
				this._animator = this._config.animator;
			} else {
				throw new Error('Custom animator provided in config but it\'s not an instance of AbstractAnimator');
			}
		} else {
			// the animator could have been set before init
			if (this._animator === null) {
				this._animator = new TransformAnimator(this);
			}
		}

		// setup the carousel rendering and events
		this._setupCarousel(this._mainWrap, this._config.orientation);

		// setup the default navigators
		this._setupDefaultNavigators();

		// notify the animator that carousel is initiated
		this._initiated = true;

		// increment the livecount
		FlowCarousel.liveCount++;

		this.emit(FlowCarousel.Event.INITIATED);

		this._validateItemsToRender(true).done(function() {
			this.validateSize();

			deferred.resolve();
		}.bind(this));

		// listen for wrap size changes and perform re-layout when needed once the carousel is initiated
		deferred.done(function() {
			this._setupWindowResizeListener();
		}.bind(this));

		return deferred.promise();
	};

	/**
	 * Destroys the carousel component.
	 *
	 * @method destroy
	 */
	FlowCarousel.prototype.destroy = function() {
		var preservedMethodNames = ['isInitiated', 'isDestroyed'],
			navigatorName,
			propertyName;

		if (!this._initiated) {
			throw new Error('Unable to destroy carousel that has not been initiated');
		}

		// destroy the sub-components
		if (this._dataSource instanceof AbstractDataSource) { this._dataSource.destroy(); }
		if (this._renderer instanceof AbstractRenderer) { this._renderer.destroy(); }
		if (this._animator instanceof AbstractAnimator) { this._animator.destroy(); }

		// destroy navigators
		for (navigatorName in this._navigators) {
			if (this._navigators[navigatorName] instanceof AbstractNavigator) {
				this._navigators[navigatorName].destroy();
			}
		}

		// remove the carousel classes from the main wrap
		Util.removeElementClassesPrefixedWith(this._mainWrap, this._config.cssPrefix);

		// clear the generated contents
		$(this._mainWrap).empty();

		// ask the renderer to restore the initial contents using the current data-source
		this._renderer.restoreInitialContents(this._dataSource, this._mainWrap);

		// remove the data reference
		$(this._mainWrap).data(this._config.dataTarget, null);

		// remove the window resize listener
		$(window).off('resize', this._eventListeners.onWindowResize);

		// clear references and state
		this._config = null;
		this._dataSource = null;
		this._renderer = null;
		this._animator = null;
		this._navigators = {};
		this._mainWrap = null;
		this._itemsWrap = null;
		this._scrollerWrap = null;
		this._isAnimating = false;
		this._targetItemIndex = 0;
		this._currentItemIndex = 0;
		this._hoverItemIndex = null;
		this._renderedItemIndexes = [];
		this._renderedPlaceholderIndexes = [];
		this._itemIndexToElementMap = {};
		this._delayedTasks = {};
		this._getItemsPromise = null;
		this._activeAnimationDeferred = null;
		this._startupItemsRenderedEmitted = false;
		this._lastLargestChildSize = null;
		this._cache = Util.cloneObj(this._emptyCache);
		this._useCache = true;

		// disable all methods
		for (propertyName in this) {
			// preserve some methods
			if (preservedMethodNames.indexOf(propertyName) !== -1) {
				continue;
			}

			if (typeof this[propertyName] === 'function') {
				this[propertyName] = function() {
					throw new Error(
						'The carousel is destroyed, attempting to call any of its methods results in an error (' +
						'tried to call "' + this.name + '")'
					);
				}.bind({name: propertyName});
			}
		}

		// mark the component destroyed
		this._initiated = false;
		this._destroyed = true;

		// decrement the livecount
		FlowCarousel.liveCount--;
	};

	/**
	 * Returns the unique id and carousel index.
	 *
	 * @method getId
	 * @return {number}
	 */
	FlowCarousel.prototype.getId = function() {
		return this._id;
	};

	/**
	 * Returns whether the carousel has been initiated.
	 *
	 * @method isInitiated
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isInitiated = function() {
		return this._initiated;
	};

	/**
	 * Returns whether the carousel has been destroyed.
	 *
	 * @method isDestroyed
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isDestroyed = function() {
		return this._destroyed;
	};

	/**
	 * Returns whether the carousel is currently animating.
	 *
	 * @method isAnimating
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isAnimating = function() {
		return this._isAnimating;
	};

	/**
	 * Returns whether the carousel is currently animating.
	 *
	 * @method isAnimating
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isDragged = function() {
		return this._isDragged;
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
		var wrapSize = this._getMainWrapSize(),
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
		var wrapSize = this._getMainWrapSize(),
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
		var wrapSize = this._getMainWrapSize(),
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
	 * Returns the number of items on the last page.
	 *
	 * @method getItemCountOnLastPage
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemCountOnLastPage = function() {
		var itemCount = this.getItemCount(),
			itemsPerPage = this.getItemsPerPage(),
			pageCount = this.getPageCount();

		return itemCount - (pageCount - 1) * itemsPerPage;
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
	 * Calculating the number of items per page causes a layout which is bad for performance so cached value is used
	 * when possible.
	 *
	 * @method getItemsPerPage
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemsPerPage = function() {
		var wrapSize = this._getMainWrapSize(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize);

		this._cache.itemsPerPage = itemsPerPage;

		return itemsPerPage;
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
	 * Returns the currently-hovered item index or null if none is hovered.
	 *
	 * @method getHoverItemIndex
	 * @return {number|null}
	 */
	FlowCarousel.prototype.getHoverItemIndex = function() {
		return this._hoverItemIndex;
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
		return this.getItemPageIndex(this._currentItemIndex);
	};

	/**
	 * Returns given item index page index.
	 *
	 * Always returns an integer flooring to the closest round page number.
	 *
	 * The page number starts at zero for first page.
	 *
	 * @method getItemPageIndex
	 * @param {number} itemIndex Item index to calculate for
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemPageIndex = function(itemIndex) {
		var itemsPerPage = this.getItemsPerPage();

		return Math.floor(itemIndex / itemsPerPage);
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

		return -Math.floor(itemIndex * itemSize + itemIndex * (itemMargin - gapPerItem));
	};

	/**
	 * Returns the closest full item index at given position taking into account the direction of movement.
	 *
	 * @method getClosestItemIndexAtPosition
	 * @param {number} position Scroller position
	 * @param {number} [direction=1] Move direction (-1/1)
	 * @return {number} Closest item index
	 */
	FlowCarousel.prototype.getClosestItemIndexAtPosition = function(position, direction) {
		direction = direction || 1;

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
	 * @param {number} [direction=1] Move direction (-1/1)
	 * @return {number} Closest page index
	 */
	FlowCarousel.prototype.getClosestPageIndexAtPosition = function(position, direction) {
		direction = direction || 1;

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
	 * @param {boolean} [firstRender=false] Should this be considered first render
	 * @return {object} Render range with start and end keys
	 * @private
	 */
	FlowCarousel.prototype.getRenderRange = function(itemIndex, firstRender) {
		itemIndex = itemIndex || this._currentItemIndex;

		var itemsPerPage = this.getItemsPerPage(),
			itemCount = this._dataSource.getItemCount();

		return this._config.getRenderRange(itemIndex, itemsPerPage, itemCount, firstRender);
	};

	/**
	 * Returns the range of items that have already been rendered for current item index and config.
	 *
	 * @method getRenderedRange
	 * @return {object|null} Render range with start and end keys or null if no elements have been renderer
	 * @private
	 */
	FlowCarousel.prototype.getRenderedRange = function() {
		var range = {
				start: null,
				end: null
			},
			itemIndex,
			i;

		for (i = 0; i < this._renderedItemIndexes.length; i++) {
			itemIndex = this._renderedItemIndexes[i];

			itemIndex = parseInt(itemIndex, 10);

			if (range.start === null || itemIndex < range.start) {
				range.start = itemIndex;
			}

			if (range.end === null || itemIndex > range.end) {
				range.end = itemIndex;
			}
		}

		if (range.start === null || range.end === null) {
			return null;
		}

		return range;
	};

	/**
	 * Returns the current item position index.
	 *
	 * This can be different from the return value of getTargetItemIndex() if the carousel is animating.
	 *
	 * @method isAnimating
	 * @return {boolean}
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
				'Invalid data of type "' + typeof data + '" provided, expected an instance of AbstractDataSource or ' +
				'a simple array'
			);
		}

		return this;
	};

	/**
	 * Sets the renderer to use.
	 *
	 * Expects an instance of AbstractRenderer.
	 *
	 * This method supports call chaining by returning itself.
	 *
	 * @method setRenderer
	 * @param {AbstractDataSource|array} Either an instance of AbstractDataSource or a simple array
	 * @chainable
	 * @return {FlowCarousel}
	 */
	FlowCarousel.prototype.setRenderer = function(renderer) {
		if (renderer instanceof AbstractRenderer) {
			this._renderer = renderer;
		} else {
			throw new Error('Invalid renderer provided, expected an instance of AbstractRenderer');
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
	 * @param {number} [animationSpeed] Optional animation speed in pixels per millisecond
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToItem = function(itemIndex, instant, force, animationSpeed) {
		instant = typeof instant === 'boolean' ? instant : false;
		force = typeof force === 'boolean' ? force : false;

		var deferred = new Deferred(),
			itemCount = this._dataSource.getItemCount(),
			isSameItemIndex = itemIndex === this._currentItemIndex,
			itemsPerPage = this.getItemsPerPage(),
			currentItemIndex = this.getCurrentItemIndex(),
			pageLastItemIndex = Math.min(currentItemIndex + 1, itemCount - itemsPerPage);

		// if there are no items then resolve immediately and give up
		if (itemCount === 0) {
			deferred.resolve();

			return deferred.promise();
		}

		// validate index range
		if (itemIndex < 0) {
			throw new Error('Invalid negative  index "' + itemIndex + '" requested');
		} else if (itemIndex > itemCount - 1) {
			throw new Error('Too large index "' + itemIndex + '" requested, there are only ' + itemCount + ' items');
		}

		// ignore navigation request when already navigating
		if (this._isAnimating) {
			if (this._activeAnimationDeferred === null) {
				/* istanbul ignore if */
				throw new Error(
					'Carousel is animating but no active animation deferred is present, this should not happen'
				);
			}

			return this._activeAnimationDeferred;
		}

		// animate to the new item position index if it's different from current item index
		if (!isSameItemIndex || force === true) {
			this._isAnimating = true;
			this._targetItemIndex = itemIndex;

			// start animating to given item, this is an asynchronous process
			this._animator.animateToItem(itemIndex, instant, false, animationSpeed).done(function() {
				deferred.resolve();
			});

			// emitting this event before starting the animation causes lag for some reason
			this.emit(FlowCarousel.Event.NAVIGATING_TO_ITEM, itemIndex, instant);
		} else {
			// already at target page index, visualize limit
			if (itemIndex === 0 || (this.isLastPage() && itemIndex === pageLastItemIndex)) {
				this._showLimit(itemIndex).done(function() {
					deferred.resolve();
				});

				this._activeAnimationDeferred = deferred;
			} else {
				deferred.resolve();
			}

			return deferred.promise();
		}

		// render placeholders that are later replaced with real loaded items
		if (this._config.usePlaceholders && this._dataSource.isAsynchronous()) {
			this._renderTargetIndexPlaceholders();
		}

		// once the animation is complete, update the current item index
		deferred.done(function() {
			this._currentItemIndex = this._targetItemIndex;
			this._lastCenterItemIndex = this.getCurrentCenterItemIndex();
			this._isAnimating = false;
			this._activeAnimationDeferred = null;

			// remove items that have moved out of range
			this._destroyInvalidItems();

			// check whether we need to render or remove some items
			this._validateItemsToRender().done(function() {
				// update scroller size to largest visible child
				this.validateSize();
			}.bind(this));

			this.emit(FlowCarousel.Event.NAVIGATED_TO_ITEM, itemIndex, instant);
		}.bind(this));

		// store the promise so it can be returned when requesting a new animation while the last still playing
		this._activeAnimationDeferred = deferred;

		return deferred.promise();
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
	 * @param {number} [animationSpeed] Optional animation speed in pixels per millisecond
	 */
	FlowCarousel.prototype.navigateToPage = function(pageIndex, instant, force, animationSpeed) {
		instant = typeof instant === 'boolean' ? instant : false;

		var itemIndex = pageIndex * this.getItemsPerPage(),
			pageCount = this.getPageCount(),
			deferred = new Deferred();

		// already at target index, visualize limit
		if (itemIndex === this.getCurrentItemIndex() && force !== true) {
			if (
				(pageIndex === 0 || pageIndex === pageCount - 1)
				&& this.getPageCount() > 1
			) {
				this._showLimit(itemIndex).done(function() {
					deferred.resolve();
				});

				this._activeAnimationDeferred = deferred;
			} else {
				deferred.resolve();
			}

			return deferred.promise();
		}

		this.emit(FlowCarousel.Event.NAVIGATING_TO_PAGE, pageIndex, instant);

		this.navigateToItem(itemIndex, instant, force, animationSpeed).done(function() {
			deferred.resolve();
		});

		deferred.done(function() {
			this.emit(FlowCarousel.Event.NAVIGATED_TO_PAGE, pageIndex, instant);
		}.bind(this));

		return deferred.promise();
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
			maximumValidItemIndex = this.getMaximumValidItemIndex(),
			targetItemIndex = Math.min(currentItemIndex + 1, maximumValidItemIndex);

		return this.navigateToItem(targetItemIndex, instant);
	};

	/**
	 * Returns the maximum item index to scroll to so that the last page would be displayed full.
	 *
	 * @method getMaximumValidItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getMaximumValidItemIndex = function() {
		var itemsPerPage = this.getItemsPerPage(),
			itemCount = this.getItemCount();

		return Math.max(itemCount - itemsPerPage, 0);
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
	 * Returns whether given (or current if no argument is given) item is the first one.
	 *
	 * @method isFirstItem
	 * @param {number} [itemIndex=getCurrentItemIndex()] Optional item index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isFirstItem = function(itemIndex) {
		itemIndex = typeof itemIndex === 'number' ? itemIndex : this.getCurrentPageIndex();

		return itemIndex === 0;
	};

	/**
	 * Returns whether given (or current if no argument is given) item is the last one.
	 *
	 * @method isLastItem
	 * @param {number} [itemIndex=getCurrentItemIndex()] Optional item index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isLastItem = function(itemIndex) {
		itemIndex = typeof itemIndex === 'number' ? itemIndex : this.getCurrentItemIndex();

		return this.getItemCount() === 0 || itemIndex >= this.getMaximumValidItemIndex();
	};

	/**
	 * Returns whether given (or current if no argument is given) page is the first one.
	 *
	 * @method isFirstPage
	 * @param {number} [pageIndex=getCurrentPageIndex()] Optional page index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isFirstPage = function(pageIndex) {
		pageIndex = typeof pageIndex === 'number' ? pageIndex : this.getCurrentPageIndex();

		return pageIndex === 0;
	};

	/**
	 * Returns whether given (or current if no argument is given) page is the last one.
	 *
	 * @method isLastPage
	 * @param {number} [pageIndex=getCurrentPageIndex()] Optional page index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isLastPage = function(pageIndex) {
		pageIndex = typeof pageIndex === 'number' ? pageIndex : this.getCurrentPageIndex();

		return this.getPageCount() === 0 || pageIndex === this.getPageCount() - 1;
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
		var itemCount = this.getItemCount(),
			visibleRange = this.getCurrentPageVisibleRange(),
			elements = [],
			element,
			i;

		// return empty array if there are no items
		if (itemCount === 0) {
			return [];
		}

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

		// nothing to search for
		if (itemCount === 0) {
			return null;
		}

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
	 * Validates the dataset and redraws the carousel.
	 *
	 * You can call this when the data has changes in the background and the carousel should redraw itself.
	 *
	 * Returns promise that is resolved when the new items has been drawn.
	 *
	 * @method redraw
	 * @return {Deferred.Promise}
	 */
	FlowCarousel.prototype.redraw = function() {
		return this._reLayout();
	};

	/**
	 * Calculates the item index to scroll to so that the given index would be centered if possible.
	 *
	 * @method calculateCenteredItemStartIndex
	 * @param {number} startItemIndex Item index to center
	 * @param {boolean} [inverse=false] Should the inverse positive index be returned
	 */
	FlowCarousel.prototype.calculateCenteredItemStartIndex = function(startItemIndex, inverse) {
		inverse = typeof inverse === 'boolean' ? inverse : false;

		var maximumValidItemIndex = this.getMaximumValidItemIndex(),
			itemPerPage = this.getItemsPerPage(),
			isEvenNumberOfPages = itemPerPage % 2 === 0,
			sign = inverse ? 1 : -1,
			roundMethod = inverse ? 'floor' : 'ceil',
			centeredItemIndex = Math[roundMethod](startItemIndex + sign * itemPerPage / 2),
			result;

		// prefer before the center rather than after
		if (isEvenNumberOfPages) {
			centeredItemIndex += inverse ? -1 : 1;
		}

		// limit the calculated item index to valid range
		result = Math.max(Math.min(centeredItemIndex, maximumValidItemIndex), 0);

		return result;
	};

	/**
	 * Returns currently centered item index.
	 *
	 * @method getCurrentCenterItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentCenterItemIndex = function() {
		return this.calculateCenteredItemStartIndex(this._currentItemIndex, true);
	};

	/**
	 * Initializes the top-level wrap element.
	 *
	 * If the selector matches multiple elements, only the first one is considered.
	 *
	 * If the selector does not match any elements, an error is thrown.
	 *
	 * @method _setupElement
	 * @param {string|jQuery|DOMElement} source Wraps element or selector
	 * @private
	 */
	FlowCarousel.prototype._setupElement = function(source) {
		var matches = $(source),
			element,
			existingCarousel;

		// make sure that the selector matches only a single element and throw error otherwise
		if (matches.length === 0) {
			throw new Error('Selector "' + element + '" did not match any elements');
		} else if (matches.length > 1) {
			throw new Error(
				'Selector "' + element + '" matches more then one element, try using "' + element + ':first"'
			);
		}

		element = matches[0];
		existingCarousel = $(element).data(this._config.dataTarget);

		// make sure the same element is not initiated several times
		if (existingCarousel instanceof FlowCarousel) {
			throw new Error(
				'Element matching selector "' + element + '" is already a carousel component, ' +
				'destroy the existing one first'
			);
		}

		// store reference to the main wrap dom element
		this._mainWrap = element;

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
				matchWrap: this._config.getClassName('matchWrap'),
				matchLargestItem: this._config.getClassName('matchLargestItem'),
				initiating: this._config.getClassName('initiating'),
				horizontal: this._config.getClassName('horizontal'),
				vertical: this._config.getClassName('vertical')
			},
			sizeMode = this._config.sizeMode,
			startItemIndex = 0,
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

		if (this._config.startItemIndex !== null) {
			startItemIndex = this._config.startItemIndex;
		} else if (this._config.startPageIndex !== null) {
			startItemIndex = this._config.startPageIndex * this.getItemsPerPage();
		}

		// notify the animator that carousel element is ready
		this._animator.onCarouselElementReady();

		// setup the main layout and move/animate to the start item
		this._setupLayout(startItemIndex, this._config.animateToStartIndex, this._config.centerStartItemIndex);

		// remove the loading class
		$element.removeClass(className.initiating);

		// throw error if both item and page start indexes are set
		if (this._config.startItemIndex !== null && this._config.startPageIndex !== null) {
			throw new Error('Set either the startItemIndex or startPageIndex option but not both');
		}
	};

	/**
	 * Sets up the layout and renders the initial set of items.
	 *
	 * Emits:
	 * - FlowCarousel.Event.LAYOUT_CHANGED when the layout changes
	 *
	 * @method _setupLayout
	 * @param {number} [startItemIdex] Optional item index to navigate to instantly
	 * @param {boolean} [animateToStartItem=false] Should we animate to the start item
	 * @param {boolean} [centerStartItemIndex=false] Should we try to center on the start item
	 * @private
	 */
	FlowCarousel.prototype._setupLayout = function(startItemIndex, animateToStartItem, centerStartItemIndex) {
		var orientation = this._config.orientation,
			wrapSize = this._getMainWrapSize(),
			itemCount = this._dataSource.getItemCount(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			totalSize = Math.ceil(itemCount * itemSize),
			instantAnimation = animateToStartItem !== true,
			sizeProp = orientation === Config.Orientation.HORIZONTAL
				? 'width'
				: 'height';

		// the wrap size can become zero when hidden, stop the layout process
		/* istanbul ignore if */
		if (wrapSize === 0) {
			return;
		}

		// define the scroller wrap size to fit all items
		$(this._scrollerWrap).css(sizeProp, totalSize);

		// if the start item index is set then navigate to it instantly
		if (typeof startItemIndex === 'number' && startItemIndex !== 0) {
			// recalculate the start item index so the initial item is shown centered
			if (centerStartItemIndex) {
				startItemIndex = this.calculateCenteredItemStartIndex(startItemIndex);
			}

			this._targetItemIndex = startItemIndex;
			this._currentItemIndex = startItemIndex;
			this._lastCenterItemIndex = this.getCurrentCenterItemIndex();

			this.emit(FlowCarousel.Event.NAVIGATING_TO_ITEM, startItemIndex, instantAnimation);

			this._animator.animateToItem(startItemIndex, instantAnimation).done(function() {
				this.emit(FlowCarousel.Event.NAVIGATED_TO_ITEM, startItemIndex, instantAnimation);
			}.bind(this));
		}

		// render placeholders that are later replaced with real loaded items
		if (this._config.usePlaceholders && this._dataSource.isAsynchronous()) {
			this._renderTargetIndexPlaceholders();
		}

		this.emit(FlowCarousel.Event.LAYOUT_CHANGED);
	};

	/**
	 * Sets up the default navigators to use as defined in the {{#crossLink "Config"}}{{/crossLink}}.
	 *
	 * @method _setupDefaultNavigators
	 * @private
	 */
	FlowCarousel.prototype._setupDefaultNavigators = function() {
		var type;

		for (type in this._config.navigators) {
			if (typeof this._config.navigators[type].createInstance !== 'function') {
				throw new Error(
					'Expected the navigator definition to include "createInstance" method that returns a deferred ' +
					'promise that is resolved with a new instance of the given navigator'
				);
			}

			// skip disabled navigators
			if (!this._config.navigators[type].enabled) {
				continue;
			}

			// create navigator instance asyncronously and add it
			Deferred.when(this._config.navigators[type].createInstance(this)).done(function(navigator) {
				// the carousel may have gotten destroyed while the navigator was loading
				if (this.carousel === null || this.carousel.isDestroyed()) {
					return;
				}

				this.carousel.addNavigator(this.type, navigator);
			}.bind({carousel: this, type: type}));
		}
	};

	/**
	 * Validates whether all the required items have been rendered and initiates rendering them if not.
	 *
	 * @method _validateItemsToRender
	 * @param {boolean} [firstRender=false] Should this be considered first render
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._validateItemsToRender = function(firstRender) {
		firstRender = typeof firstRender === 'boolean' ? firstRender : false;

		var renderRange = this.getRenderRange(this._currentItemIndex, firstRender);

		return this._renderItemRange(renderRange.start, renderRange.end);
	};

	/**
	 * Removes items that have gone out of the render range.
	 *
	 * @method _destroyInvalidItems
	 * @private
	 */
	FlowCarousel.prototype._destroyInvalidItems = function() {
		var renderRange = this.getRenderRange(),
			filteredPlaceholderItemIndexes = [],
			filteredRenderedItemIndexes = [],
			destroyedItemIndexes = [],
			itemIndex,
			itemElement,
			i;

		// destroy rendered placeholders out of the render range
		for (i = 0; i < this._renderedPlaceholderIndexes.length; i++) {
			itemIndex = this._renderedPlaceholderIndexes[i];

			if (itemIndex < renderRange.start || itemIndex > renderRange.end) {
				itemElement = this.getItemElementByIndex(itemIndex);

				/* istanbul ignore if */
				if (itemElement === null) {
					throw new Error(
						'Placeholder element at index #' + itemIndex + ' not found, this should not happen'
					);
				}

				this._destroyItem(itemElement, itemIndex);

				destroyedItemIndexes.push(itemIndex);
			} else {
				filteredPlaceholderItemIndexes.push(itemIndex);
			}
		}

		this._renderedPlaceholderIndexes = filteredPlaceholderItemIndexes;

		// destroy rendered items out of the render range
		if (this._shouldDestroyInvalidItems()) {
			for (i = 0; i < this._renderedItemIndexes.length; i++) {
				itemIndex = this._renderedItemIndexes[i];

				if (itemIndex < renderRange.start || itemIndex > renderRange.end) {
					itemElement = this.getItemElementByIndex(itemIndex);

					/* istanbul ignore if */
					if (itemElement === null) {
						throw new Error('Item element at index #' + itemIndex + ' not found, this should not happen');
					}

					this._destroyItem(itemElement, itemIndex);

					destroyedItemIndexes.push(itemIndex);
				} else {
					filteredRenderedItemIndexes.push(itemIndex);
				}
			}

			this._renderedItemIndexes = filteredRenderedItemIndexes;
		}

		if (destroyedItemIndexes.length > 0) {
			this.emit(FlowCarousel.Event.DESTROYED_ITEMS, destroyedItemIndexes);
		}
	};

	/**
	 * Destroys an element and removes it from the index to element mapping.
	 *
	 * @method _destroyItem
	 * @param {DOMElement} element Element to destroy
	 * @param {number} index Element index
	 * @private
	 */
	FlowCarousel.prototype._destroyItem = function(element, index) {
		this._renderer.destroyItem(element);

		this._removeItemIndexToElement(index);
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

		for (itemIndex = startIndex; itemIndex <= endIndex; itemIndex++) {
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
			loadingClassName = this._config.getClassName('loading'),
			renderedRange = this.getRenderedRange(),
			dir = renderedRange === null || startIndex >= renderedRange.start ? 1 : -1,
			itemCount = this.getItemCount(),
			loadRange;

		// don't render anything if already rendered same range
		if (renderedRange !== null && renderedRange.start === startIndex && renderedRange.end === endIndex) {
			deferred.resolve();

			return deferred.promise();
		}

		if (renderedRange === null) {
			loadRange = {
				start: startIndex,
				end: endIndex
			};
		} else {
			if (dir === 1) {
				loadRange = {
					start: Math.max(startIndex, renderedRange.end + 1),
					end: endIndex
				};
			} else {
				loadRange = {
					start: startIndex,
					end: Math.min(endIndex, renderedRange.start - 1)
				};
			}
		}

		// do nothing if calculated start range is larger then item count
		if (loadRange.start > itemCount - 1) {
			deferred.resolve();

			return deferred.promise();
		}

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

		this.emit(FlowCarousel.Event.LOADING_ITEMS, loadRange.start, loadRange.end);

		// store the new itemset fetching deferred promise and fetch new items
		this._getItemsPromise = this._dataSource.getItems(loadRange.start, loadRange.end)
			.done(function(items) {
				// the carousel may get destroyed while the items are loading
				if (!self._initiated) {
					return;
				}

				// ignore invalid data if it couldn't be aborted
				if (this._ignore === true) {
					self.emit(FlowCarousel.Event.ABORTED_ITEMS, loadRange.start, loadRange.end, items);

					return;
				}

				self.emit(FlowCarousel.Event.LOADED_ITEMS, loadRange.start, loadRange.end, items);

				self._getItemsPromise = null;

				if (self._dataSource.isAsynchronous()) {
					$(self._mainWrap).removeClass(loadingClassName);
				}

				// rendering items can be asyncronous as well
				self._renderItems(items, loadRange.start).done(function() {
					// it's possible that the initial first page data loading was cancelled
					if (!this._startupItemsRenderedEmitted) {
						this.emit(FlowCarousel.Event.STARTUP_ITEMS_RENDERED);

						this._startupItemsRenderedEmitted = true;
					}

					deferred.resolve();
				}.bind(self));
			});

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
			renderingClassName = this._config.getClassName('rendering'),
			endIndex = startIndex + items.length - 1,
			promises = [],
			outOfRange,
			itemIndex,
			item,
			promise,
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

			// only render the item if it's not already rendered and it's not out of current render range
			/* istanbul ignore else */
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
		Deferred.when.apply($, promises)
			.done(function() {
				// the carousel may get destroyed while the items are loading
				if (!this._initiated) {
					throw new Error('Carousel was destroyed before rendering items');
				}

				$(this._mainWrap).removeClass(renderingClassName);

				this._insertRenderedElements(arguments, startIndex);

				this.emit(FlowCarousel.Event.RENDERED_ITEMS, startIndex, endIndex, arguments);

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
		var useFragment = typeof document.createDocumentFragment === 'function',
			$elementRangeFragment = useFragment ? $(document.createDocumentFragment()) : null,
			$elementWrapElement = useFragment ? $elementRangeFragment : $(this._scrollerWrap),
			itemIndex,
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

			itemIndex = startIndex + i;

			// add the rendered and inserted items to the list of rendered items and the index to element mapping
			if (!arePlaceholders) {
				placeholderPos = this._renderedPlaceholderIndexes.indexOf(itemIndex);

				// remove placeholder if exists
				/* istanbul ignore if */
				if (placeholderPos !== -1 && typeof this._itemIndexToElementMap[itemIndex] !== 'undefined') {
					placeholderElement = this._itemIndexToElementMap[itemIndex];

					this._destroyItem(placeholderElement, itemIndex);

					this._renderedPlaceholderIndexes.splice(placeholderPos, 1);
				}

				this._insertRenderedElement($elementWrapElement, elements[i], itemIndex);

				this._renderedItemIndexes.push(itemIndex);
			} else {
				// only add placeholders if they don't already exist
				if (this._renderedPlaceholderIndexes.indexOf(itemIndex) === -1) {
					this._insertRenderedElement($elementWrapElement, elements[i], itemIndex, true);

					this._renderedPlaceholderIndexes.push(itemIndex);
				}
			}
		}

		// the elements are first added to a fragment and then the whole fragment appended to scroller for performance
		if (useFragment) {
			$(this._scrollerWrap).append($elementRangeFragment);
		}
	};

	/**
	 * Inserts a rendered dom element into the carousel dom structure.
	 *
	 * @method _insertRenderedElement
	 * @param {DOMElement} $wrap Wrap to append the element to once ready
	 * @param {DOMElement} element Element to insert
	 * @param {number} index Element index
	 * @param {boolean} isPlaceholder Is the element a placeholder
	 * @private
	 */
	FlowCarousel.prototype._insertRenderedElement = function($wrap, element, index, isPlaceholder) {
		// calculate the properties of the element
		var $element = $(element),
			orientation = this._config.orientation,
			sizeMode = this._config.sizeMode,
			wrapSize = this._getMainWrapSize(),
			wrapOppositeSize = this._getMainWrapOppositeSize(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			effectiveSize = Math.ceil(itemSize - gapPerItem),
			effectiveOffset = Math.floor(index * itemSize + index * (itemMargin - gapPerItem)),
			$wrapper = $('<div></div>'),
			cssProperties = {},
			$itemWrapper;

		// make sure the wrap has size if wrap size matching is used
		/* istanbul ignore if */
		if (sizeMode == Config.SizeMode.MATCH_WRAP && wrapOppositeSize === 0 && this._initiated) {
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

		// the element may be display: none to begin with, make it visible
		$element.css('display', 'block');

		// wrap the item element in a carousel wrapper
		$itemWrapper = $element.wrap($wrapper).parent();

		// apply the css styles and add carousel item class
		$itemWrapper.css(cssProperties);
		$itemWrapper.addClass(this._config.getClassName('item'));

		// add the placeholder class as well if the element is a placeholder
		if (isPlaceholder) {
			$itemWrapper.addClass(this._config.getClassName('placeholder'));
		}

		// apply some pre-processing to each element about to be inserted into the dom
		this._preprocessItemElement($itemWrapper, index);

		// append the element to the scroller wrap
		$wrap.append($itemWrapper);

		/* istanbul ignore if */
		if (typeof this._itemIndexToElementMap[index] !== 'undefined') {
			throw new Error('Element at index #' + index + ' already exists, this should not happen');
		}

		// add the wrapped element to the index to element map
		this._mapItemIndexToElement(index, $itemWrapper[0]);
	};

	/**
	 * Adds a mapping between item index and its wrapper element.
	 *
	 * @method _mapItemIndexToElement
	 * @param {number} index Item index
	 * @param {DOMElement} element The DOM element
	 * @private
	 */
	FlowCarousel.prototype._mapItemIndexToElement = function(index, element) {
		this._itemIndexToElementMap[index] = element;
	};

	/**
	 * Removes mapping between item index and its wrapper element.
	 *
	 * @method _removeItemIndexToElement
	 * @param {number} index Item index to remove mapping for
	 * @private
	 */
	FlowCarousel.prototype._removeItemIndexToElement = function(index) {
		delete this._itemIndexToElementMap[index];
	};

	/**
	 * Preprocesses the item wrapper element about to be inserted into the DOM.
	 *
	 * @method _preprocessCarouselItemElement
	 * @param {jQuery} $itemWrapper The item wrapper element jQuery reference
	 * @param {number} index Item index
	 * @private
	 */
	FlowCarousel.prototype._preprocessItemElement = function($itemWrapper, index) {
		var self = this;
			//itemHoverClass = this._config.getClassName('itemHover');

		// store the item index in wrapper element data
		$itemWrapper.data(this._config.cssPrefix + 'index', index);

		// listen for hover and out events to store the currently hovered item
		$itemWrapper.hover(
			function() {
				var elementIndex = $(this).data(self._config.cssPrefix + 'index');

				self._hoverItemIndex = elementIndex;
			},
			function() {
				//$(this).removeClass(itemHoverClass);

				self._hoverItemIndex = null;
			}
		);
	};

	/**
	 * Makes sure that the scroller size matches the largest currently visible item size.
	 *
	 * This is executed only when using Config.SizeMode.MATCH_LARGEST_ITEM size mode.
	 *
	 * @method validateSize
	 * @return {boolean} Was new positive size found
	 */
	FlowCarousel.prototype.validateSize = function() {
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

		if (largestChildSize > 0) {
			// set the scroller to largest child size if it was possible to determine
			if (largestChildSize !== this._lastLargestChildSize) {
				$(this._scrollerWrap).css(sizeProp, Math.ceil(largestChildSize) + 'px');

				this._lastLargestChildSize = largestChildSize;

				return true;
			}
		}/* else {
			// failed to determine largest child size, try again
			window.setTimeout(function() {
				if (!this.isInitiated()) {
					return;
				}

				console.log('try again');

				this.validateSize();
			}.bind(this), 100);
		}*/

		return false;
	};

	/**
	 * Re-initializes the layout.
	 *
	 * Used to apply responsive layout when the wrap size changes.
	 *
	 * Since fetching and rendering items can be asynchronous, this method returns a promise.
	 *
	 * @method _reLayout
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._reLayout = function() {
		var focusItemIndex,
			promise;

		// focus to last center item index if requested so by the configuration
		if (this._config.centerStartItemIndex) {
			focusItemIndex = this._lastCenterItemIndex;
		} else {
			focusItemIndex = this._currentItemIndex;
		}

		// reset current state
		this._reset();

		// recalculate the layout navigating instantly to the last item
		this._setupLayout(focusItemIndex, false, this._config.centerStartItemIndex);

		// render the items that may have become visible after the layout procedure
		promise = this._validateItemsToRender();

		// update scroller size
		promise.done(function() {
			this.validateSize();
		}.bind(this));

		return promise;
	};

	/**
	 * Resets the component state and removes all rendered items.
	 *
	 * @method _reset
	 * @private
	 */
	FlowCarousel.prototype._reset = function() {
		var $scrollerWrap = $(this._scrollerWrap);

		$scrollerWrap
			.empty()
			//.attr('style', null)
			.data(this._config.cssPrefix + 'last-size', null);

		this._itemIndexToElementMap = {};
		this._isAnimating = false;
		this._targetItemIndex = 0;
		this._currentItemIndex = 0;
		this._lastCenterItemIndex = null;
		this._lastLargestChildSize = null;
		this._renderedItemIndexes = [];
		this._renderedPlaceholderIndexes = [];
		this._itemIndexToElementMap = {};
		this._cache = Util.cloneObj(this._emptyCache);
	};

	/**
	 * Sets up main wrap size change listener to apply responsive layout.
	 *
	 * @method _setupWindowResizeListener
	 * @private
	 */
	FlowCarousel.prototype._setupWindowResizeListener = function() {
		// also validate on window resize
		$(window).on('resize', this._eventListeners.onWindowResize);
	};

	/**
	 * Called on window resize event.
	 *
	 * @method _onWindowResize
	 * @private
	 */
	FlowCarousel.prototype._onWindowResize = function() {
		if (!this._initiated) {
			return;
		}

		this._validateResponsiveLayout();
	};

	/**
	 * Checks whether the carousel wrap size has changed and triggers re-layout if so.
	 *
	 * @method _validateResponsiveLayout
	 * @param {boolean} force Force the validation even if busy
	 * @return {boolean} Was re-layout scheduled
	 * @private
	 */
	FlowCarousel.prototype._validateResponsiveLayout = function(force) {
		// don't perform the validation while animating
		if (this._isAnimating && force !== true) {
			return false;
		}

		var $element = $(this._mainWrap),
			lastSize = $element.data(this._config.cssPrefix + 'last-size') || null,
			currentSize = this._getMainWrapSize(true);

		$element.data(this._config.cssPrefix + 'last-size', currentSize);

		// perform the layout routine if the wrap size has changed and it did not change to zero
		if (lastSize === null || (currentSize !== lastSize && currentSize !== 0)) {
			// perform the re-layout routine only when the wrap size has not changed for some time
			this._performDelayed('re-layout', function() {
				// the carousel may have gotten destroyed in the meanwhile
				if (!this.isInitiated() || this.isDestroyed()) {
					return;
				}

				this._reLayout();
			}.bind(this), this._config.responsiveLayoutDelay);

			return true;
		}

		return false;
	};

	/**
	 * Visually notifies the user that carousel limit has been reached.
	 *
	 * @method _showLimit
	 * @param {number} itemIndex Current item index
	 * @private
	 */
	FlowCarousel.prototype._showLimit = function(itemIndex) {
		var deferred = new Deferred(),
			enabled = this._config.limitAnimation.enabled,
			limitPixels = this._config.limitAnimation.movePixels,
			limitAnimationDuration = this._config.limitAnimation.moveDuration,
			limitItemPosition,
			limitDir,
			limitMovePosition;

		// do nothing if already animating or the limit animation has been disabled
		if (this._isAnimating || !enabled) {
			deferred.resolve();
		} else {
			if (itemIndex === 0) {
				limitDir = -1;
			} else {
				limitDir = 1;
			}

			limitItemPosition = this.getItemPositionByIndex(itemIndex);
			limitMovePosition = limitDir === -1
				? limitItemPosition + limitPixels
				: limitItemPosition - limitPixels;

			this._isAnimating = true;

			this._animator.animateToPosition(
				limitMovePosition,
				false,
				false,
				0,
				limitAnimationDuration
			).done(function () {
				this._animator.animateToPosition(
					limitItemPosition,
					false,
					false,
					0,
					limitAnimationDuration
				).done(function () {
					this._isAnimating = false;

					deferred.resolve();
				}.bind(this));
			}.bind(this));
		}

		return deferred.promise();
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
	 * Returns the main wrap size in the main orientation.
	 *
	 * Uses cached value if available.
	 *
	 * @method _getMainWrapSize
	 * @param {boolean} [ignoreCache=false] Should cache be ignored
	 * @return {number}
	 */
	FlowCarousel.prototype._getMainWrapSize = function(ignoreCache) {
		if (this._useCache && this._cache.wrapSize !== null && ignoreCache !== true) {
			return this._cache.wrapSize;
		}

		var orientation = this._config.orientation;

		this._cache.wrapSize = this._getElementSize(this._mainWrap, orientation);

		$(this._mainWrap).data(this._config.cssPrefix + 'last-size', this._cache.wrapSize);

		return this._cache.wrapSize;
	};

	/**
	 * Returns the main wrap size in the opposite orientation.
	 *
	 * Uses cached value if available.
	 *
	 * @method _getMainWrapOppositeSize
	 * @param {boolean} [ignoreCache=false] Should cache be ignored
	 * @return {number}
	 */
	FlowCarousel.prototype._getMainWrapOppositeSize = function(ignoreCache) {
		if (this._useCache && this._cache.wrapOppositeSize !== null && ignoreCache !== true) {
			return this._cache.wrapOppositeSize;
		}

		var orientation = this._config.orientation,
			oppositeOrientation = this._getOppositeOrientation(orientation);

		this._cache.wrapOppositeSize = this._getElementSize(this._mainWrap, oppositeOrientation);

		return this._cache.wrapOppositeSize;
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
	 * Returns whether items out of the render range should be destroyed.
	 *
	 * @method _shouldDestroyInvalidItems
	 * @return {boolean}
	 * @private
	 */
	FlowCarousel.prototype._shouldDestroyInvalidItems = function() {
		// return the config option if this has been chosen explicitly
		if (typeof this._config.removeOutOfRangeItems === 'boolean') {
			return this._config.removeOutOfRangeItems;
		}

		if (this.getItemCount() > this._config.removeOutOfRangeItemsThreshold) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * This is called by drag-based navigators on drag begin event.
	 *
	 * @method _onDragBegin
	 * @param {number} startPosition The start dragging position in the main orientation
	 * @param {number} dragOppositePosition The start dragging position in the opposite orientation
	 * @param {number} carouselPosition The start carousel position
	 * @private
	 */
	FlowCarousel.prototype._onDragBegin = function(startPosition, dragOppositePosition, carouselPosition) {
		this._dragging = true;

		this.emit(FlowCarousel.Event.DRAG_BEGIN, startPosition, dragOppositePosition, carouselPosition);
	};

	/**
	 * This is called by drag-based navigators on drag end event.
	 *
	 * @method _onDragEnd
	 * @param {string} navigationMode Navigation mode, usually 'navigate-page' or 'navigate-item'
	 * @param {number} startPosition Drag start position
	 * @param {number} endPosition Drag end position
	 * @param {number} deltaDragPosition Relative drag amount
	 * @param {number} closestIndex Closest matching page or item index depending on navigation mode
	 * @param {number} direction Drag direction, either -1 or 1
	 * @param {DOMElement} targetElement The element that the drag ended on
	 * @private
	 */
	FlowCarousel.prototype._onDragEnd = function(
		navigationMode,
		startPosition,
		endPosition,
		deltaDragPosition,
		closestIndex,
		direction,
		targetElement
	) {
		this._dragging = false;

		this.emit(
			FlowCarousel.Event.DRAG_END,
			navigationMode,
			startPosition,
			endPosition,
			closestIndex,
			deltaDragPosition,
			direction,
			targetElement
		);
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

	// use the Exporter to export it to AMD, Angular etc
	Exporter.export(FlowCarousel);

	return FlowCarousel;
});