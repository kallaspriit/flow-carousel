define([
	'jquery',
	'Deferred',
	'KeyboardNavigator',
	'DragNavigator',
	'SlideshowNavigator',
	'InterfaceNavigator',
], function($, Deferred, KeyboardNavigator, DragNavigator, SlideshowNavigator, InterfaceNavigator) {
	'use strict';

	/**
	 * Carousel configuration.
	 *
	 * Provides the default values for various configurable parameters that can be overriden.
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
		 * @default Config.Orientation.HORIZONTAL
		 */
		this.orientation = Config.Orientation.HORIZONTAL;

		/**
		 * The size mode to use, defaults to matching item sizes to wrap size.
		 *
		 * @property sizeMode
		 * @type {Config/SizeMode:property}
		 * @default Config.SizeMode.MATCH_WRAP
		 */
		this.sizeMode = Config.SizeMode.MATCH_WRAP;

		/**
		 * Margin in pixels to apply between items, default to none.
		 *
		 * @property margin
		 * @type {number}
		 * @default 0
		 */
		this.margin = 0;

		/**
		 * Should placeholders be generated while loading actual items.
		 *
		 * @property usePlaceholders
		 * @type boolean
		 * @default true
		 */
		this.usePlaceholders = true;

		/**
		 * Should responsive layout be used by default.
		 *
		 * The {{#crossLink "Config/responsiveBreakpoints:property"}}{{/crossLink}} breakpoints are used to calculate
		 * how many items to render on a single page.
		 *
		 * @property useResponsiveLayout
		 * @type boolean
		 * @default true
		 */
		this.useResponsiveLayout = true;

		/**
		 * List of default responsive layout breakpoints.
		 *
		 * The breakpoints apply to the actual carousel wrap size not the window size.
		 *
		 * The list should be ordered from the smallest size to the largest and each array element should be an object
		 * with keys "size" and "itemsPerPage".
		 *
		 * @property responsiveBreakpoints
		 * @type array
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
		 * How long to wait for the wrap size to stay the same before starting the responsive layout routine.
		 *
		 * This is useful so when the user is resizing the browser window then the carousel won't try to re-layout
		 * itself on every frame but rather waits for the size to stabilize.
		 *
		 * Value is in milliseconds.
		 *
		 * @property responsiveLayoutDelay
		 * @type {number}
		 * @default 500
		 */
		this.responsiveLayoutDelay = 500;

		/**
		 * Number of items to render side-by-side when not using responsive layout.
		 *
		 * This parameter is ignored when using responsive layout strategy (
		 * {{#crossLink "Config/useResponsiveLayout:property"}}{{/crossLink}} is set to true).
		 *
		 * @property itemsPerPage
		 * @type number
		 * @default 5
		 */
		this.itemsPerPage = 5;

		/**
		 * The index of the element to scroll to at startup.
		 *
		 * Set to a number value in valid range to enable, null to disable.
		 *
		 * Defaults to showing the first element.
		 *
		 * Set either this or the {{#crossLink "Config/startPageIndex:property"}}{{/crossLink}} property, setting both
		 * throws error.
		 *
		 * @property startItemIndex
		 * @type {number|null}
		 * @default null
		 */
		this.startItemIndex = null;

		/**
		 * The index of the page to scroll to at startup.
		 *
		 * Set to a number value of valid range to enable, null to disable.
		 *
		 * Defaults to showing the first element on the first page.
		 *
		 * Set either this or the {{#crossLink "Config/startItemIndex:property"}}{{/crossLink}} property, setting both
		 * throws error.
		 *
		 * @property startPageIndex
		 * @type {number|null}
		 * @default null
		 */
		this.startPageIndex = null;

		/**
		 * If item or page start index is set then should it animate to it or should the position be set immediately.
		 *
		 * Applies to both {{#crossLink "Config/startIndex:property"}}{{/crossLink}} and
		 * {{#crossLink "Config/startPageIndex:property"}}{{/crossLink}}.
		 *
		 * By default the position is set without animation.
		 *
		 * @property animateToStartIndex
		 * @type {boolean}
		 * @default false
		 */
		this.animateToStartIndex = false;

		/**
		 * When using the {{#crossLink "Config/startItemIndex:property"}}{{/crossLink}} property, should the carousel
		 * try to center on this item index rather than making it the first one. This is not done by default.
		 *
		 * @property centerStartItemIndex
		 * @type {boolean}
		 * @default false
		 */
		this.centerStartItemIndex = false;

		/**
		 * Should items that are navigated out of the rendering range given by
		 * {{#crossLink "Config/getRenderRange"}}{{/crossLink}} be removed.
		 *
		 * This ensures that there are never too many elements in the DOM but when navigating back to these items, they
		 * have to be re-generated.
		 *
		 * Set this to true to always remove out of range items, false to never remove them and null to let the
		 * carousel decide based on the number of items.
		 *
		 * @default removeOutOfRangeItems
		 * @type {boolean|null}
		 * @default null
		 */
		this.removeOutOfRangeItems = null;

		/**
		 * If {{#crossLink "Config/removeOutOfRangeItems:property"}}{{/crossLink}} is not set to a boolean value then
		 * this value is used to decide whether to remove out of range items or not so if the number of items in the
		 * dataset is smaller then this, out of range items are not destroyed.
		 *
		 * @property removeOutOfRangeItemsThreshold
		 * @type {number}
		 * @default 30
		 */
		this.removeOutOfRangeItemsThreshold = 30;

		/**
		 * List of navigators to use with their configuration and factory methods.
		 *
		 * The "createInstance(carousel)" factory method gets the carousel instance as its only parameter and should
		 * either return a navigator instance directly or a deferred promise that will be resolved with a navigator
		 * instance.
		 *
		 * @property navigators
		 * @type {object}
		 */
		this.navigators = {
			keyboard: {
				enabled: true,
				mode: 'navigate-page',
				keys: {
					horizontal: {
						previous: 37, // arrow left
						next: 39 // arrow right
					},
					vertical: {
						previous: 38, // arrow up
						next: 40 // arrow down
					}
				},

				createInstance: function(carousel) {
					return new KeyboardNavigator(carousel.getConfig().navigators.keyboard);
				}
			},
			drag: {
				enabled: true,
				mode: 'navigate-page',
				overEdgeDragPositionMultiplier: 0.2,
				ignoreClickThreshold: 10,

				createInstance: function(carousel) {
					return new DragNavigator(carousel.getConfig().navigators.drag);
				}
			},
			slideshow: {
				enabled: false,
				mode: 'navigate-page',
				interval: 3000,
				instantRollover: true,

				createInstance: function(carousel) {
					return new SlideshowNavigator(carousel.getConfig().navigators.slideshow);
				}
			},
			interface: {
				enabled: false,
				mode: 'navigate-page',

				createInstance: function(carousel) {
					return new InterfaceNavigator(carousel.getConfig().navigators.slideshow);
				}
			}
		};

		/**
		 * Transform animator configuration.
		 *
		 * @property transformAnimator
		 * @param {number} transformAnimator.defaultAnimationSpeed=4 Default animation speed in pixels per millisecond
		 * @param {number} transformAnimator.minAnimationSpeed=1 Minimum animation speed in pixels per millisecond
		 * @param {number} transformAnimator.maxAnimationSpeed=10 Maximum animation speed in pixels per millisecond
		 */
		this.transformAnimator = {
			defaultAnimationSpeed: 4,
			minAnimationSpeed: 1,
			maxAnimationSpeed: 10
		};

		/**
		 * Scroll animator configuration.
		 *
		 * @property scrollAnimator
		 * @param {number} scrollAnimator.defaultAnimationSpeed=4 Default animation speed in pixels per millisecond
		 * @param {number} scrollAnimator.minAnimationSpeed=1 Minimum animation speed in pixels per millisecond
		 * @param {number} scrollAnimator.maxAnimationSpeed=10 Maximum animation speed in pixels per millisecond
		 */
		this.scrollAnimator = {
			defaultAnimationSpeed: 4,
			minAnimationSpeed: 1,
			maxAnimationSpeed: 10
		};

		/**
		 * Configuration for the animation shown when user tries to navigate past the first or last item.
		 *
		 * @property limitAnimation
		 * @type {object}
		 * @param {boolean} limitAnimation.enabled Should the limit animation be shown
		 * @param {number} limitAnimation.movePixels How many pixels to animate past the end
		 * @param {number} limitAnimation.moveDuration Duration of the animation
		 */
		this.limitAnimation = {
			enabled: true,
			movePixels: 30,
			moveDuration: 150
		};

		/**
		 * The css classes prefix to use.
		 *
		 * The same prefix is also used when assigning custom carousel-specific data to the element.
		 *
		 * @property cssPrefix
		 * @type {string}
		 * @default 'flow-carousel-'
		 */
		this.cssPrefix = 'flow-carousel-';

		/**
		 * CSS class names to use.
		 *
		 * The class name is combined with the {{#crossLink "Config/cssPrefix:property"}}{{/crossLink}} property
		 * so if the prefix is "flow-carousel-" and the wrap class is "wrap" then the main wrap will get the
		 * "flow-carousel-wrap" class.
		 *
		 * @property cssClasses
		 * @param {string} cssClasses.wrap='wrap' Assigned to the main wrap element
		 * @param {string} cssClasses.items='items' Assigned to the items wrap element in the main wrap
		 * @param {string} cssClasses.scroller='scroller' Assigned to the animated scroller wrap in the items wrap
		 * @param {string} cssClasses.item='item' Assigned to each item wrapper containing the actual item
		 * @param {string} cssClasses.itemHover='item-hover' Assigned to item wrapper on hover and removed on mouse out
		 * @param {string} cssClasses.placeholder='placeholder' Assigned to each item wrapper that is a placeholder
		 * @param {string} cssClasses.matchWrap='match-wrap' Assigned to main wrap when using the wrap size match mode
		 * @param {string} cssClasses.matchLargestItem='match-largest-item' Assigned to main wrap when matching the wrap
		 * 				   size to the largest item size
		 * @param {string} cssClasses.horizontal='horizontal' Assigned to main wrap for horizontal orientation
		 * @param {string} cssClasses.vertical='vertical' Assigned to main wrap for vertical orientation
		 * @param {string} cssClasses.animateTransform='animate-transform' With this class added the transforms get
		 * 				   animated as well
		 * @param {string} cssClasses.initiating='initiating' Assigned to main wrap during initialization procedure
		 * @param {string} cssClasses.loading='loading' Assigned to main wrap during loading of items
		 * @param {string} cssClasses.rendering='rendering' Assigned to main wrap during rendering of items
		 * @type {object}
		 */
		this.cssClasses = {
			wrap: 'wrap',
			items: 'items',
			scroller: 'scroller',
			item: 'item',
			itemHover: 'item-hover',
			placeholder: 'placeholder',
			matchWrap: 'match-wrap',
			matchLargestItem: 'match-largest-item',
			horizontal: 'horizontal',
			vertical: 'vertical',
			animateTransform: 'animate-transform',
			initiating: 'initiating',
			loading: 'loading',
			rendering: 'rendering'
		};

		/**
		 * The carousel instance is registered as the main wrap dom data with the dataTarget name.
		 *
		 * This means that you can access the carousel instance using $('#my-carousel').data('flow-carousel') etc.
		 *
		 * @property dataTarget
		 * @type {string}
		 * @default 'flow-carousel'
		 */
		this.dataTarget = 'flow-carousel';

		/**
		 * Optional custom data source to use.
		 *
		 * As a special case, a simple array can be provided as data source which is converted to use
		 * {{#crossLink "ArrayDataSource"}}{{/crossLink}} implementation.
		 *
		 * If none is provided then the {{#crossLink "HtmlDataSource"}}{{/crossLink}} is used.
		 *
		 * @property renderer
		 * @type {AbstractRenderer|array|null}
		 * @default null
		 */
		this.dataSource = null;

		/**
		 * Optional custom renderer to use.
		 *
		 * If none is provided then the {{#crossLink "HtmlRenderer"}}{{/crossLink}} is used.
		 *
		 * @property renderer
		 * @type {AbstractRenderer|null}
		 * @default null
		 */
		this.renderer = null;

		/**
		 * Optional custom animator to use.
		 *
		 * Should be an instance of {{#crossLink "AbstractAnimator"}}{{/crossLink}}.
		 *
		 * If none is provided then the {{#crossLink "TransformAnimator"}}{{/crossLink}} is used.
		 *
		 * @property animator
		 * @type {AbstractAnimator|null}
		 * @default null
		 */
		this.animator = null;

		/**
		 * Returns the range of items that should be rendered given current item index and items per page.
		 *
		 * By default returns one page before the current page and one after but one may choose to override it. On the
		 * first render, returns three pages before/after so that the user can navigate a few pages without triggering
		 * rendering new items.
		 *
		 * One can use the firstRender parameter to for example render more items during the first render so no new
		 * rendering is triggered if the user only moves for a few pages.
		 *
		 * @method getRenderRange
		 * @param {number} currentItemIndex Currently scrolled position index
		 * @param {number} itemsPerPage How many items are shown on a page
		 * @param {number} itemCount How many items there are in total
		 * @param {boolean} firstRender This parameter is true for the very first render
		 * @return {object} Render range with keys "start" and "end"
		 * @private
		 */
		this.getRenderRange = function(currentItemIndex, itemsPerPage, itemCount, firstRender) {
			var pagesBefore = 1,
				pagesAfter = 1;

			// render more pages on the first render
			if (firstRender && this.removeOutOfRangeItems !== true) {
				pagesBefore = pagesAfter = 3;
			}

			return {
				start: Math.max(currentItemIndex - itemsPerPage * pagesBefore, 0),
				end: Math.min(currentItemIndex + itemsPerPage * (pagesAfter + 1) - 1, itemCount - 1)
			};
		};

		/**
		 * Returns the number of items to render side-by-side based on the wrap size and
		 * {{#crossLink "Config/responsiveBreakpoints:property"}}{{/crossLink}} setting.
		 *
		 * Uses the {{#crossLink "Config/useResponsiveLayout:property"}}{{/crossLink}} setting and
		 * {{#crossLink "Config/responsiveBreakpoints:property"}}{{/crossLink}} breakpoints by default, but one may
		 * choose to redefine this and use some custom logic.
		 *
		 * @method getItemsPerPage
		 * @param {number} wrapSize Wrap size to base the calculation on
		 */
		this.getItemsPerPage = function(wrapSize) {
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
	}

	/**
	 * Enumeration of possible carousel orientations.
	 *
	 * @property Orientation
	 * @type {object}
	 * @param {string} Orientation.HORIZONTAL='horizontal' Horizontal orientation
	 * @param {string} Orientation.VERTIAL='vertical' Vertical orientation
	 * @static
	 */
	Config.Orientation = {
		HORIZONTAL: 'horizontal',
		VERTICAL: 'vertical'
	};

	/**
	 * There are two different strategies for setting the size of the wrap and the items:
	 * > MATCH_WRAP - the size of the items is set to match the wrap size
	 * > MATCH_LARGEST_ITEM - the size of the wrap is set to match the largest item
	 *
	 * @property SizeMode
	 * @type {object}
	 * @param {string} Orientation.MATCH_WRAP='match-wrap' Items size is based on wrap size
	 * @param {string} Orientation.MATCH_LARGEST_ITEM='match-largest-item' Wrap size is based on items size
	 * @static
	 */
	Config.SizeMode = {
		MATCH_WRAP: 'match-wrap',
		MATCH_LARGEST_ITEM: 'match-largest-item'
	};

	/**
	 * Extends the base default configuration properties with user-defined values.
	 *
	 * Performs deep-extend.
	 *
	 * @method extend
	 * @param {object} userConfig
	 */
	Config.prototype.extend = function(userConfig) {
		$.extend(true, this, userConfig);
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