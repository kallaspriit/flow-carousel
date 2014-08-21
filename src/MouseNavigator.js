define([
	'AbstractNavigator',
	'Config',
	'Util'
], function(AbstractNavigator, Config, Util) {
	'use strict';

	/**
	 * Mouse navigator.
	 *
	 * @class MouseNavigator
	 * @extends AbstractNavigator
	 * @param {MouseNavigator/Mode:property} [mode=MouseNavigator.Mode.NAVIGATE_PAGE] Navigation mode to use
	 * @constructor
	 */
	function MouseNavigator(mode) {
		AbstractNavigator.call(this);

		this._active = false;
		this._startPointerPosition = null;
		this._startCarouselPosition = null;
		this._lastPosition = null;

		this.setMode(mode || MouseNavigator.Mode.NAVIGATE_PAGE);
	}

	MouseNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' The navigation keys navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' The navigation keys navigate one item at a time
	 */
	MouseNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current mouse navigator mode.
	 *
	 * The mode is either {{#crossLink "MouseNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "MouseNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {MouseNavigator/Mode:property} mode Mode to use
	 */
	MouseNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(MouseNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current mouse navigator mode.
	 *
	 * The mode is either {{#crossLink "MouseNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "MouseNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {MouseNavigator/Mode:property}
	 */
	MouseNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	MouseNavigator.prototype._setup = function() {
		var $scroller = $(this._carousel.getScrollerWrap()),
			$window = $(window),
			orientation = this._carousel.getOrientation(),
			horizontal = orientation === Config.Orientation.HORIZONTAL;

		// listen for mouse down, move and up/leave events
		$scroller.on('mousedown', function(e) {
			if (e.which !== 1) {
				return;
			}

			this._begin(horizontal ? e.pageX : e.pageY);
		}.bind(this));

		$window.on('mousemove', function(e) {
			// only move the carousel when the left mouse button is pressed
			if (e.which === 1) {
				this._move(horizontal ? e.pageX : e.pageY);
			} else {
				this._end();
			}
		}.bind(this));

		$window.on('mouseup', function(e) {
			if (e.which !== 1) {
				return;
			}

			this._end();
		}.bind(this));
	};

	/**
	 * Begins the navigation.
	 *
	 * @method _begin
	 * @param {number} position Mouse/finger position
	 * @private
	 */
	MouseNavigator.prototype._begin = function(position) {
		this._active = true;
		this._startPointerPosition = position;
		this._startCarouselPosition = this._carousel.getAnimator().getCurrentPosition();
	};

	/**
	 * Called on mouse/finger move.
	 *
	 * @method _move
	 * @param {number} position Mouse/finger position
	 * @private
	 */
	MouseNavigator.prototype._move = function(position) {
		if (!this._active) {
			return;
		}

		var deltaPointerPosition = position - this._startPointerPosition,
			newPosition = this._startCarouselPosition + deltaPointerPosition,
			pageSize = this._carousel.getPageSize(),
			totalSize = this._carousel.getTotalSize(),
			edgeMultiplier = this._carousel.getConfig().mouseNavigatorOverEdgeDragPositionMultiplier;

		if (newPosition > 0 || newPosition < -(totalSize - pageSize)) {
			newPosition = this._startCarouselPosition + deltaPointerPosition * edgeMultiplier;
		}

		// use the animator to move to calculated position instantly
		this._carousel.getAnimator().animateToPosition(newPosition, true);

		this._lastPosition = position;
	};

	/**
	 * Called on gesture end.
	 *
	 * @method _end
	 * @private
	 */
	MouseNavigator.prototype._end = function() {
		if (!this._active) {
			return;
		}

		var deltaPointerPosition = this._lastPosition - this._startPointerPosition,
			direction = deltaPointerPosition < 0 ? -1 : 1,
			currentPosition = this._carousel.getAnimator().getCurrentPosition(),
			closestPageIndex,
			closestItemIndex;

		// navigate to closest item or page depending on selected mode
		switch (this._mode) {
			case MouseNavigator.Mode.NAVIGATE_PAGE:
				closestPageIndex = this._carousel.getClosestPageIndexAtPosition(currentPosition, direction);

				this._carousel.navigateToPage(closestPageIndex, false ,true);
			break;

			case MouseNavigator.Mode.NAVIGATE_ITEM:
				closestItemIndex = this._carousel.getClosestItemIndexAtPosition(currentPosition, direction);

				this._carousel.navigateToItem(closestItemIndex, false ,true);
			break;
		}

		// reset
		this._active = false;
		this._startPointerPosition = null;
		this._startCarouselPosition = null;
		this._lastPosition = null;
	};

	return MouseNavigator;
});