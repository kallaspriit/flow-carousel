define([
	'AbstractNavigator',
	'Config',
	'Util'
], function(AbstractNavigator, Config, Util) {
	'use strict';

	/**
	 * Drag navigator.
	 *
	 * @class DragNavigator
	 * @extends AbstractNavigator
	 * @param {DragNavigator/Mode:property} [mode=DragNavigator.Mode.NAVIGATE_PAGE] Navigation mode to use
	 * @constructor
	 */
	function DragNavigator(mode) {
		AbstractNavigator.call(this);

		this._active = false;
		this._startDragPosition = null;
		this._startDragOppositePosition = null;
		this._startCarouselPosition = null;
		this._lastPosition = null;

		this.setMode(mode || DragNavigator.Mode.NAVIGATE_PAGE);
	}

	DragNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' The navigation keys navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' The navigation keys navigate one item at a time
	 */
	DragNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current drag navigator mode.
	 *
	 * The mode is either {{#crossLink "DragNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "DragNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {DragNavigator/Mode:property} mode Mode to use
	 */
	DragNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(DragNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current drag navigator mode.
	 *
	 * The mode is either {{#crossLink "DragNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "DragNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {DragNavigator/Mode:property}
	 */
	DragNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	DragNavigator.prototype._setup = function() {
		var $scroller = $(this._carousel.getScrollerWrap()),
			$window = $(window),
			orientation = this._carousel.getOrientation(),
			horizontal = orientation === Config.Orientation.HORIZONTAL;

		// listen for mouse down, move and up/leave events
		$scroller.on('mousedown touchstart', function(e) {
			if (e.which !== 1 && e.type !== 'touchstart') {
				return true;
			}

			var isTouchEvent = e.type === 'touchstart',
				x = isTouchEvent ? e.originalEvent.changedTouches[0].pageX : e.pageX,
				y = isTouchEvent ? e.originalEvent.changedTouches[0].pageY : e.pageY,
				result;

			result = this._begin(horizontal ? x : y, horizontal ? y : x);

			if (result === false) {
				e.preventDefault();

				return false;
			} else {
				return true;
			}
		}.bind(this));

		$window.on('mousemove touchmove', function(e) {
			var result,
				isTouchEvent,
				x,
				y;

			// only move the carousel when the left mouse button is pressed
			if (e.which !== 1 && e.type !== 'touchmove') {
				result = this._end();
			} else {
				isTouchEvent = e.type === 'touchmove';
				x = isTouchEvent ? e.originalEvent.changedTouches[0].pageX : e.pageX;
				y = isTouchEvent ? e.originalEvent.changedTouches[0].pageY : e.pageY;

				result = this._move(horizontal ? x : y, horizontal ? y : x);
			}

			if (result === false) {
				e.preventDefault();

				return false;
			} else {
				return true;
			}
		}.bind(this));

		$window.on('mouseup touchend touchcancel', function(e) {
			var result;

			if (e.which !== 1 && e.type !== 'touchend' && e.type !== 'touchcancel') {
				return true;
			}

			result = this._end();

			if (result === false) {
				e.preventDefault();

				return false;
			} else {
				return true;
			}
		}.bind(this));
	};

	/**
	 * Begins the navigation.
	 *
	 * @method _begin
	 * @param {number} position Drag position
	 * @param {number} oppositePosition Drag opposite position (y for horizontal, x for vertical)
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._begin = function(position, oppositePosition) {
		// don't allow dragging when already animating
		if (this._carousel.isAnimating()) {
			return true;
		}

		this._active = true;
		this._startDragPosition = position;
		this._startDragOppositePosition = oppositePosition;
		this._startCarouselPosition = this._carousel.getAnimator().getCurrentPosition();

		// do not disable scrolling the page from the carousel component
		return true;
	};

	/**
	 * Called on mouse/finger move.
	 *
	 * @method _move
	 * @param {number} position Drag position
	 * @param {number} oppositePosition Drag opposite position (y for horizontal, x for vertical)
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._move = function(position, oppositePosition) {
		if (!this._active) {
			return true;
		}

		var deltaDragPosition = position - this._startDragPosition,
			deltaDragOppositePosition = oppositePosition - this._startDragOppositePosition;

		// if the carousel is dragged more in the opposite direction then cancel and propagate
		// this allows drag-navigating the page from carousel elements
		if (Math.abs(deltaDragPosition) < Math.abs(deltaDragOppositePosition)) {
			this._end();

			return true;
		}

		var newPosition = this._startCarouselPosition + deltaDragPosition,
			pageSize = this._carousel.getPageSize(),
			totalSize = this._carousel.getTotalSize(),
			edgeMultiplier = this._carousel.getConfig().dragNavigatorOverEdgeDragPositionMultiplier;

		if (newPosition > 0 || newPosition < -(totalSize - pageSize)) {
			newPosition = this._startCarouselPosition + deltaDragPosition * edgeMultiplier;
		}

		// use the animator to move to calculated position instantly
		this._carousel.getAnimator().animateToPosition(newPosition, true, true);

		this._lastPosition = position;

		return false;
	};

	/**
	 * Called on gesture end.
	 *
	 * @method _end
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._end = function() {
		if (!this._active) {
			return true;
		}

		var deltaDragPosition = this._lastPosition - this._startDragPosition,
			direction = deltaDragPosition < 0 ? -1 : 1,
			currentPosition = this._carousel.getAnimator().getCurrentPosition(),
			closestPageIndex,
			closestItemIndex;

		// navigate to closest item or page depending on selected mode
		switch (this._mode) {
			case DragNavigator.Mode.NAVIGATE_PAGE:
				closestPageIndex = this._carousel.getClosestPageIndexAtPosition(currentPosition, direction);

				this._carousel.navigateToPage(closestPageIndex, false, true);
			break;

			case DragNavigator.Mode.NAVIGATE_ITEM:
				closestItemIndex = this._carousel.getClosestItemIndexAtPosition(currentPosition, direction);

				this._carousel.navigateToItem(closestItemIndex, false, true);
			break;
		}

		// reset
		this._active = false;
		this._startDragPosition = null;
		this._startDragOppositePosition = null;
		this._startCarouselPosition = null;
		this._lastPosition = null;

		return false;
	};

	return DragNavigator;
});