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
		 * @default Config.Orientation.VERTICAL
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
		 * Should placeholders be generated while loading actual items.
		 *
		 * @property usePlaceholders
		 * @type boolean
		 * @default true
		 */
		this.usePlaceholders = true;

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
		 * The index of the element to scroll to at startup.
		 *
		 * Set to a number value of valid range to enable.
		 *
		 * Defaults to showing the first element.
		 *
		 * Set either this or the {{#crossLink "Config/startPageIndex:property"}}{{/crossLink}} property, setting both
		 * throws error.
		 *
		 * @property startItemIndex
		 * @type {number}
		 * @default null
		 */
		this.startItemIndex = null;

		/**
		 * The index of the page to scroll to at startup.
		 *
		 * Set to a number value of valid range to enable.
		 *
		 * Defaults to showing the first element.
		 *
		 * Set either this or the {{#crossLink "Config/startItemIndex:property"}}{{/crossLink}} property, setting both
		 * throws error.
		 *
		 * @property startPageIndex
		 * @type {number}
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
			//size: 768,
			size: 560, // TODO remove
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
		 * How long to wait for the wrap size to stay the same before starting the responsive layout routine.
		 *
		 * This is useful so when the user is resizing the browser window then the carousel won't try to re-layout
		 * itself on every frame but rather waits for the size to normalize.
		 *
		 * Value is in milliseconds.
		 *
		 * @property responsiveLayoutDelay
		 * @type {number}
		 * @default 300
		 */
		this.responsiveLayoutDelay = 300;

		/**
		 * Default built-in navigators to use.
		 *
		 * @property navigators
		 * @type {Config/Navigator:property[]}
		 */
		this.navigators = [
			Config.Navigator.KEYBOARD,
			Config.Navigator.DRAG
		];

		/**
		 * Keyboard navigator mode to use.
		 *
		 * @property keyboardNavigatorMode
		 * @type {KeyboardNavigator/Mode:property}
		 * @default KeyboardNavigator.Mode.NAVIGATE_PAGE
		 */
		this.keyboardNavigatorMode = 'navigate-page';

		/**
		 * Drag navigator mode to use.
		 *
		 * @property dragNavigatorMode
		 * @type {DragNavigator/Mode:property}
		 * @default DragNavigator.Mode.NAVIGATE_PAGE
		 */
		this.dragNavigatorMode = 'navigate-page';
		//this.dragNavigatorMode = 'navigate-item';

		/**
		 * If the user attempts to drag the items over the edge (before first or after last) then we can apply the
		 * effect of only applying the change partially. Set to zero to disable this feature.
		 *
		 *
		 * @property dragNavigatorOverEdgeDragPositionMultiplier
		 * @type {number}
		 * @default 0.2
		 */
		this.dragNavigatorOverEdgeDragPositionMultiplier = 0.2;

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
		 * The class name is combined with the {{#crossLink "Config/cssPrefix:property"}}{{/crossLink}} property
		 * so if the prefix is "flow-carousel-" and the wrap class is "wrap" then the main wrap will get the
		 * "flow-carousel-wrap" class.
		 *
		 * @property cssClasses
		 * @param {string} cssClasses.wrap='wrap' Assigned to the main wrap element
		 * @param {string} cssClasses.items='items' Assigned to the items wrap element in the main wrap
		 * @param {string} cssClasses.scroller='scroller' Assigned to the animated scroller wrap in the items wrap
		 * @param {string} cssClasses.item='item' Assigned to each item wrapper containing the actual item
		 * @param {string} cssClasses.placeholder='placeholder' Assigned to each item wrapper that is a placeholder
		 * @param {string} cssClasses.matchWrap='match-wrap' Assigned to main wrap when using the wrap size match mode
		 * @param {string} cssClasses.matchLargestItem='match-largest-item' Assigned to main wrap when matching the wrap
		 * 				   size to the largest item size
		 * @param {string} cssClasses.horizontal='horizontal' Assigned to main wrap for horizontal orientation
		 * @param {string} cssClasses.vertical='vertical' Assigned to main wrap for vertical orientation
		 * @param {string} cssClasses.instantAnimation='instant-animation' Assigned to main wrap if the animation is
		 * 				   requested to be instantaneous
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
			placeholder: 'placeholder',
			matchWrap: 'match-wrap',
			matchLargestItem: 'match-largest-item',
			horizontal: 'horizontal',
			vertical: 'vertical',
			instantAnimation: 'instant-animation',
			initiating: 'initiating',
			loading: 'loading',
			rendering: 'rendering'
		};

		/**
		 * The carousel instance is registered as the main wrap data with the dataTarget name.
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
		 * @type {AbstractRenderer|array}
		 * @default null
		 */
		this.dataSource = null;

		/**
		 * Optional custom renderer to use.
		 *
		 * If none is provided then the {{#crossLink "HtmlRenderer"}}{{/crossLink}} is used.
		 *
		 * @property renderer
		 * @type {AbstractRenderer}
		 * @default null
		 */
		this.renderer = null;

		/**
		 * Optional custom animator to use.
		 *
		 * Should be an instance of {{#crossLink "AbstractAnimator"}}{{/crossLink}}.
		 *
		 * If none is provided then the {{#crossLink "DefaultAnimator"}}{{/crossLink}} is used.
		 *
		 * @property animator
		 * @type {AbstractAnimator}
		 * @default null
		 */
		this.animator = null;

		/**
		 * Returns the range of items that should be rendered given current item index and items per page.
		 *
		 * By default returns one page before the current page and one after but one may choose to override it.
		 *
		 * @method getRenderRange
		 * @param {number} currentItemIndex Currently scrolled position index
		 * @param {number} itemsPerPage How many items are shown on a page
		 * @param {number} itemCount How many items there are in total
		 * @return {object} Render range with start and end keys
		 * @private
		 */
		this.getRenderRange = function(currentItemIndex, itemsPerPage, itemCount) {
			return {
				start: Math.max(currentItemIndex - itemsPerPage, 0),
				end: Math.min(currentItemIndex + itemsPerPage * 2, itemCount)
			};
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
	 * List of built-in navigators that the carousel can use.
	 *
	 * Set using {{#crossLink "Config/navigators:property"}}{{/crossLink}} option.
	 *
	 * @property Navigator
	 * @type {object}
	 * @param {string} Navigator.KEYBOARD='keyboard' Keyboard navigator
	 * @static
	 */
	Config.Navigator = {
		KEYBOARD: 'keyboard',
		DRAG: 'drag'
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