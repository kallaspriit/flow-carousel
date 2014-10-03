define([
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	'use strict';

	/**
	 * Builds a user interface for navigating the carousel.
	 *
	 * @class InterfaceNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function InterfaceNavigator(config) {
		AbstractNavigator.call(this);

		/**
		 * Navigator configuration.
		 *
		 * @property _config
		 * @type {object}
		 * @private
		 */
		this._config = config;

		/**
		 * Navigation mode.
		 *
		 * @property _mode
		 * @type {KeyboardNavigator.Mode}
		 * @private
		 */
		this._mode = null;

		/**
		 * Is the mouse over given carousel.
		 *
		 * @property _mouseEntered
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._mouseEntered = false;

		/**
		 * List of used event listeners.
		 *
		 * @type {object}
		 * @private
		 */
		this._eventListeners = {
			mouseenter: this._onRawMouseEnter.bind(this),
			mouseleave: this._onRawMouseLeave.bind(this)
		};

		// set the mode to use
		this.setMode(config.mode || InterfaceNavigator.Mode.NAVIGATE_PAGE);
	}

	InterfaceNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' Navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' Navigate one item at a time
	 */
	InterfaceNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current interface navigator mode.
	 *
	 * The mode is either {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that slideshow changes
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {InterfaceNavigator/Mode:property} mode Mode to use
	 */
	InterfaceNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(InterfaceNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current interface navigator mode.
	 *
	 * The mode is either {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that buttons change
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {InterfaceNavigator/Mode:property}
	 */
	InterfaceNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	InterfaceNavigator.prototype._setup = function() {
		var $mainWrap = $(this._carousel.getMainWrap());

		// make sure that the mouse if over the main wrap element
		$mainWrap
			.on('mouseenter', this._eventListeners.mouseenter)
			.on('mouseleave', this._eventListeners.mouseleave);

		// listen to some carousel events
		this._carousel.on(this._carousel.Event.NAVIGATING_TO_ITEM, this._onNavigatingToItem.bind(this));
		this._carousel.on(this._carousel.Event.LAYOUT_CHANGED, this._onLayoutChanged.bind(this));

		// trigger UI draw
		this._redraw();
	};

	/**
	 * Build the user interface.
	 *
	 * @method _redraw
	 * @protected
	 */
	InterfaceNavigator.prototype._redraw = function() {
		var cssPrefix = this._carousel.getConfig().cssPrefix,
			className = {
				wrap: cssPrefix + 'interface',
				itemChoice: cssPrefix + 'item-choice'
			},
			itemCount = this._config.mode === 'navigate-page'
				? this._carousel.getPageCount()
				: this._carousel.getItemCount(),
			$mainWrap = $(this._carousel.getMainWrap()),
			$interfaceWrap = $('<div/>', {
				'class': className.wrap
			}),
			$itemChoiceWrap = $('<ul/>', {
				'class': className.itemChoice
			}).appendTo($interfaceWrap),
			$itemChoiceElement,
			i;

		// remove existing interface if exists
		$mainWrap.find('.' + className.wrap).remove();

		if (itemCount > 1) {
			// create the item choice items
			for (i = 0; i < itemCount; i++) {
				$itemChoiceElement = $('<li/>').text(i + 1).appendTo($itemChoiceWrap);

				$itemChoiceElement.click(function (index, e) {
					this._onItemChoiceClick(e.target, index);
				}.bind(this, i));
			}

			// add the new one
			$mainWrap.append($interfaceWrap);

			// set the initially active element
			this._updateActiveItemChoice();
		}
	};

	/**
	 * Called when any of the item choice elements are clicked.
	 *
	 * @method _onItemChoiceClick
	 * @param {DOMElement} element Clicked element
	 * @param {number} index Item index
	 * @protected
	 */
	InterfaceNavigator.prototype._onItemChoiceClick = function(element, index) {
		if (this._mode === InterfaceNavigator.Mode.NAVIGATE_PAGE) {
			this._carousel.navigateToPage(index);
		} else if (this._mode === InterfaceNavigator.Mode.NAVIGATE_ITEM) {
			this._carousel.navigateToItem(index);
		}
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	InterfaceNavigator.prototype.destroy = function() {
		var cssPrefix = this._carousel.getConfig().cssPrefix,
			className = {
				wrap: cssPrefix + 'interface',
			},
			$mainWrap = $(this._carousel.getMainWrap()),
			$interfaceWrap = $mainWrap.find('.' + className.wrap);

		// remove the interface element
		$interfaceWrap.remove();

		// remove the event listeners
		$mainWrap
			.off('mouseenter', this._eventListeners.mouseenter)
			.off('mouseleave', this._eventListeners.mouseleave);
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseEnter
	 * @param {Event} e Mouse event
	 * @private
	 */
	InterfaceNavigator.prototype._onRawMouseEnter = function(/*e*/) {
		this._mouseEntered = true;
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseLeave
	 * @param {Event} e Mouse event
	 * @private
	 */
	InterfaceNavigator.prototype._onRawMouseLeave = function(/*e*/) {
		this._mouseEntered = false;
	};

	/**
	 * Called when user navigated to a new item.
	 *
	 * @method _onNavigatingToItem
	 * @private
	 */
	InterfaceNavigator.prototype._onNavigatingToItem = function() {
		this._updateActiveItemChoice();
	};

	/**
	 * Gives the right element the active item class.
	 *
	 * @method _updateActiveItemChoice
	 * @private
	 */
	InterfaceNavigator.prototype._updateActiveItemChoice = function() {
		var cssPrefix = this._carousel.getConfig().cssPrefix,
			className = {
				wrap: cssPrefix + 'interface',
				itemChoice: cssPrefix + 'item-choice',
				isActive: cssPrefix + 'active-item-choice'
			},
			$mainWrap = $(this._carousel.getMainWrap()),
			$interfaceWrap = $mainWrap.find('.' + className.wrap),
			$itemChoiceWrap = $interfaceWrap.find('.' + className.itemChoice),
			targetItemIndex = this._carousel.getTargetItemIndex(),
			$itemChoiceElement,
			itemIndex;

		if (this._mode === InterfaceNavigator.Mode.NAVIGATE_PAGE) {
			itemIndex = this._carousel.getItemPageIndex(targetItemIndex);
		} else if (this._mode === InterfaceNavigator.Mode.NAVIGATE_ITEM) {
			itemIndex = targetItemIndex;
		}

		$itemChoiceElement = $itemChoiceWrap.find('LI:eq(' + itemIndex + ')');

		$itemChoiceWrap.find('LI.' + className.isActive).removeClass(className.isActive);
		$itemChoiceElement.addClass(className.isActive);
	};

	/**
	 * Called when the carousel layout changes.
	 *
	 * @method _onLayoutChanged
	 * @private
	 */
	InterfaceNavigator.prototype._onLayoutChanged = function() {
		this._redraw();
	};

	return InterfaceNavigator;
});