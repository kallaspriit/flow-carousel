define([
	'AbstractNavigator',
	'Config',
	'Util'
], function(AbstractNavigator, Config, Util) {
	'use strict';

	/**
	 * Keyboard navigator.
	 *
	 * @class KeyboardNavigator
	 * @extends AbstractNavigator
	 * @param {KeyboardNavigator/Mode:property} [mode=KeyboardNavigator.Mode.NAVIGATE_PAGE] Navigation mode to use
	 * @constructor
	 */
	function KeyboardNavigator(mode) {
		AbstractNavigator.call(this);

		this._mouseEntered = false;
		this.setMode(mode || KeyboardNavigator.Mode.NAVIGATE_PAGE);
	}

	KeyboardNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' The navigation keys navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' The navigation keys navigate one item at a time
	 */
	KeyboardNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current keyboard navigator mode.
	 *
	 * The mode is either {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {KeyboardNavigator/Mode:property} mode Mode to use
	 */
	KeyboardNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(KeyboardNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current keyboard navigator mode.
	 *
	 * The mode is either {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {KeyboardNavigator/Mode:property}
	 */
	KeyboardNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	KeyboardNavigator.prototype._setup = function() {
		var mainWrap = this._carousel.getMainWrap();

		$(mainWrap)
			.on('mouseenter', function() {
				this._mouseEntered = true;
			}.bind(this))
			.on('mouseleave', function() {
				this._mouseEntered = false;
			}.bind(this));

		$(window).on('keydown', function(e) {
			var result = this._onKeyDown(e.keyCode);

			if (result === false) {
				e.preventDefault();
			}

			return result;
		}.bind(this));
	};

	/**
	 * Called on key down even for anywhere in the document.
	 *
	 * @method _onKeyDown
	 * @param {number} keyCode Key press key-code.
	 * @return {boolean} Should the key event be propagated further
	 * @private
	 */
	KeyboardNavigator.prototype._onKeyDown = function(keyCode) {
		var keyCodes;

		// don't do anything if the mouse is not over given component
		if (!this._mouseEntered) {
			return;
		}

		// the keycodes are based on carousel orientation (left-right arrows for horizontal and up-down for vertical)
		switch (this._carousel.getOrientation()) {
			case Config.Orientation.HORIZONTAL:
				keyCodes = {
					previous: 37, // arrow left
					next: 39 // arrow right
				};
			break;

			case Config.Orientation.VERTICAL:
				keyCodes = {
					previous: 38, // arrow up
					next: 40 // arrow down
				};
			break;
		}

		// navigate using the key-codes defined above
		switch (keyCode) {
			case keyCodes.next:
				if (this._mode === KeyboardNavigator.Mode.NAVIGATE_PAGE) {
					this._carousel.navigateToNextPage();
				} else if (this._mode === KeyboardNavigator.Mode.NAVIGATE_ITEM) {
					this._carousel.navigateToNextItem();
				}

				return false;

			case keyCodes.previous:
				if (this._mode === KeyboardNavigator.Mode.NAVIGATE_PAGE) {
					this._carousel.navigateToPreviousPage();
				} else if (this._mode === KeyboardNavigator.Mode.NAVIGATE_ITEM) {
					this._carousel.navigateToPreviousItem();
				}

				return false;
		}

		return true;
	};

	return KeyboardNavigator;
});