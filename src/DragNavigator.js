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
		this._startPosition = null;
		this._startOppositePosition = null;
		this._startCarouselPosition = null;
		this._startHoverItemIndex = null;
		this._startTargetElement = null;
		this._lastPosition = null;
		this._lastOppositePosition = null;
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};

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
				targetElement = e.target,
				result;

			result = this._begin(horizontal ? x : y, horizontal ? y : x, targetElement);

			// never disable the mousedown/touchstart events
			return true;

			/*if (result === false) {
				e.preventDefault();

				return false;
			} else {
				return true;
			}*/
		}.bind(this));

		$window.on('mousemove touchmove', function(e) {
			var result,
				isTouchEvent,
				x,
				y;

			// stop if not active
			if (!this._active) {
				return true;
			}

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
			var result,
				targetElement;

			// quit if invalid event
			if (e.which !== 1 && e.type !== 'touchend' && e.type !== 'touchcancel') {
				return true;
			}

			// stop if not active
			if (!this._active) {
				return true;
			}

			targetElement = e.target;

			result = this._end(targetElement);

			/* istanbul ignore else */
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
	 * @param {DOMElement} targetElement The element that was under the cursor when drag started
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._begin = function(position, oppositePosition, targetElement) {
		targetElement = targetElement || null;

		// don't allow dragging when already animating
		if (this._carousel.isAnimating()) {
			return true;
		}

		this._active = true;
		this._startPosition = position;
		this._startOppositePosition = oppositePosition;
		this._lastPosition = position; // it's possible that the move event never occurs so set it here alrady
		this._lastOppositePosition = oppositePosition; // same for this
		this._startCarouselPosition = this._carousel.getAnimator().getCurrentPosition();
		this._startHoverItemIndex = this._carousel.getHoverItemIndex();
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};

		// disable all children click events for the duration of the dragging
		if (targetElement !== null) {
			this._startTargetElement = targetElement;

			this._disableClickHandler(targetElement);
		}

		// notify the carousel that dragging has begun
		this._carousel._onDragBegin(
			this._startPosition,
			this._startOppositePosition,
			this._startCarouselPosition
		);

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
		/* istanbul ignore if */
		if (!this._active) {
			return true;
		}

		// compare motion in the carousel and the opposite direction
		var deltaDragPosition = position - this._startPosition,
			noActionThreshold = 15;

		this._accumulatedMagnitude.main += Math.abs(this._lastPosition - position);
		this._accumulatedMagnitude.opposite += Math.abs(this._lastOppositePosition - oppositePosition);

		// we need last move position in the _end() handler
		this._lastPosition = position;
		this._lastOppositePosition = oppositePosition;

		// if the drag delta is very small then do nothing not to quit or start moving too soon
		if (this._accumulatedMagnitude.main < noActionThreshold) {
			return true;
		}

		// if the carousel is dragged more in the opposite direction then cancel and propagate
		// this allows drag-navigating the page from carousel elements even if dead-band is exceeded
		if (this._accumulatedMagnitude.main < this._accumulatedMagnitude.opposite) {
			this._end();

			return true;
		}

		// calculate the position
		var newPosition = this._startCarouselPosition + deltaDragPosition,
			itemSize = this._carousel.getItemSize(),
			totalSize = this._carousel.getTotalSize(),
			itemCountOnLastPage = this._carousel.getItemCountOnLastPage(),
			edgeMultiplier = this._carousel.getConfig().dragNavigatorOverEdgeDragPositionMultiplier,
			minLimit = 0,
			maxLimit = -totalSize + itemCountOnLastPage * itemSize;

		// create smooth limit at the edges applying the drag motion partially
		if (newPosition > minLimit || newPosition < maxLimit) {
			newPosition = this._startCarouselPosition + deltaDragPosition * edgeMultiplier;
		}

		// use the animator to move to calculated position instantly
		this._carousel.getAnimator().animateToPosition(newPosition, true, true);

		return false;
	};

	/**
	 * Called on gesture end.
	 *
	 * @method _end
	 * @param {DOMElement} targetElement The element that the drag ended on
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._end = function(targetElement) {
		/* istanbul ignore if */
		if (!this._active) {
			return true;
		}

		var deltaDragPosition = this._lastPosition - this._startPosition,
			deltaDragOppositePosition = this._lastOppositePosition - this._startOppositePosition,
			dragMagnitude = Math.sqrt(Math.pow(deltaDragPosition, 2) + Math.pow(deltaDragOppositePosition, 2)),
			direction = deltaDragPosition < 0 ? -1 : 1,
			currentPosition = this._carousel.getAnimator().getCurrentPosition(),
			ignoreClickThreshold = this._carousel.getConfig().dragNavigatorIgnoreClickThreshold,
			closestIndex,
			endHoverItemIndex,
			isSameItemAsStarted;

		// navigate to closest item or page depending on selected mode
		switch (this._mode) {
			case DragNavigator.Mode.NAVIGATE_PAGE:
				closestIndex = this._carousel.getClosestPageIndexAtPosition(currentPosition, direction);

				this._carousel.navigateToPage(closestIndex, false, true);
			break;

			case DragNavigator.Mode.NAVIGATE_ITEM:
				closestIndex = this._carousel.getClosestItemIndexAtPosition(currentPosition, direction);

				this._carousel.navigateToItem(closestIndex, false, true);
			break;
		}

		// restore the element click handler if drag stopped on the same element and was dragged very little
		if (
			this._startHoverItemIndex !== null
			&& targetElement !== null
			&& targetElement === this._startTargetElement
		) {
			endHoverItemIndex = this._carousel.getHoverItemIndex();

			if (endHoverItemIndex !== null) {
				isSameItemAsStarted = endHoverItemIndex === this._startHoverItemIndex;

				// make sure we finished on the same element and dragged by a small amount at most
				if (isSameItemAsStarted && dragMagnitude < ignoreClickThreshold) {
					this._restoreClickHandler(targetElement);
				}
			}

			this._dragStartHoverItemIndex = null;
		}

		// notify the carousel that dragging has begun
		this._carousel._onDragEnd(
			this._mode,
			this._startPosition,
			this._lastPosition,
			deltaDragPosition,
			closestIndex,
			direction,
			targetElement
		);

		// reset
		this._active = false;
		this._startPosition = null;
		this._startOppositePosition = null;
		this._startCarouselPosition = null;
		this._lastPosition = null;
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};

		return false;
	};

	/**
	 * Disables click handler for given element.
	 *
	 * @method _disableClickHandler
	 * @param {DOMElement} element Element to disable click events on
	 * @private
	 */
	DragNavigator.prototype._disableClickHandler = function(element) {
		var $element = $(element),
			itemWrapperClass = this._carousel.getConfig().getClassName('item'),
			$itemWrapper = $element.closest('.' + itemWrapperClass),
			$subElements = $itemWrapper.find('A'),
			disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			isAlreadyDisabled = $itemWrapper.data(disabledDataName);

		if (isAlreadyDisabled !== true) {
			$subElements.on('click', this._ignoreEvent);

			$itemWrapper.data(disabledDataName, true);
		}
	};

	/**
	 * Restores click handler for given element.
	 *
	 * @method _restoreClickHandler
	 * @param {DOMElement} element Element to disable click events on
	 * @private
	 */
	DragNavigator.prototype._restoreClickHandler = function(element) {
		var $element = $(element),
			itemWrapperClass = this._carousel.getConfig().getClassName('item'),
			disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			$itemWrapper = $element.closest('.' + itemWrapperClass),
			$subElements = $itemWrapper.find('A'),
			isDisabled = $itemWrapper.data(disabledDataName);

		if (isDisabled === true) {
			$subElements.off('click', this._ignoreEvent);

			$itemWrapper.data(disabledDataName, false);
		}
	};

	/**
	 * Ignores given jQuery event.
	 *
	 * TODO don't know how to unit-test this yet
	 *
	 * @method _ignoreEvent
	 * @param {jQuery.Event} e jQuery event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	/* istanbul ignore next */
	DragNavigator.prototype._ignoreEvent = function(e) {
		e.preventDefault();
		e.stopPropagation();

		return false;
	};

	return DragNavigator;
});