define([
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	'use strict';

	/**
	 * Drag navigator.
	 *
	 * @class DragNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function DragNavigator(config) {
		AbstractNavigator.call(this);

		this._config = config;
		this._mode = null;
		this._active = false;
		this._startPosition = null;
		this._startOppositePosition = null;
		this._startCarouselPosition = null;
		this._startHoverItemIndex = null;
		this._startTargetElement = null;
		this._startWindowScrollTop = null;
		this._lastPosition = null;
		this._lastOppositePosition = null;
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};
		this._eventListeners = {
			start: this._onRawStart.bind(this),
			move: this._onRawMove.bind(this),
			end: this._onRawEnd.bind(this),
			dragStart: this._onRawDragStart.bind(this)
		};
		this._noActionThreshold = 15;
		this._firstMoveEvent = true;

		this.setMode(config.mode || DragNavigator.Mode.NAVIGATE_PAGE);
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
		var $mainWrap = $(this._carousel.getMainWrap()),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			$window = $(window);

		// listen for mouse/touch down, move and up/leave events
		$scrollerWrap.on('mousedown touchstart', this._eventListeners.start);
		$window.on('mousemove touchmove', this._eventListeners.move);
		$window.on('mouseup touchend touchcancel', this._eventListeners.end);

		// intercept drag start event
		$mainWrap.on('dragstart', this._eventListeners.dragStart);
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	DragNavigator.prototype.destroy = function() {
		var $mainWrap = $(this._carousel.getMainWrap()),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			$window = $(window);

		// listen for mouse/touch down, move and up/leave events
		$scrollerWrap.off('mousedown touchstart', this._eventListeners.start);
		$window.off('mousemove touchmove', this._eventListeners.move);
		$window.off('mouseup touchend touchcancel', this._eventListeners.end);
		$mainWrap.off('dragstart', this._eventListeners.dragStart);
	};

	/**
	 * Called on drag start event.
	 *
	 * @method _onRawStart
	 * @param {Event} e Raw event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._onRawStart = function(e) {
		if (e.which !== 1 && e.type !== 'touchstart') {
			return true;
		}

		var orientation = this._carousel.getOrientation(),
			horizontal = orientation === this._carousel.Config.Orientation.HORIZONTAL,
			isTouchEvent = e.type === 'touchstart',
			x = isTouchEvent ? e.originalEvent.changedTouches[0].pageX : e.pageX,
			y = isTouchEvent ? e.originalEvent.changedTouches[0].pageY : e.pageY,
			targetElement = e.target,
			result;

		result = this._begin(horizontal ? x : y, horizontal ? y : x, targetElement);

		if (result === false) {
			e.preventDefault();

			return false;
		} else {
			return true;
		}
	};

	/**
	 * Called on drag move event.
	 *
	 * @method _onRawMove
	 * @param {Event} e Raw event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._onRawMove = function(e) {
		var orientation = this._carousel.getOrientation(),
			horizontal = orientation === this._carousel.Config.Orientation.HORIZONTAL,
			isTouchEvent = e.type === 'touchmove',
			result,
			x,
			y;

		// stop if not active
		if (!this._active) {
			return true;
		}

		// only move the carousel when the left mouse button is pressed
		if (e.which !== 1 && e.type !== 'touchmove') {
			result = this._end(e.target, isTouchEvent);
		} else {
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
	};

	/**
	 * Called on drag end event.
	 *
	 * @method _onRawEnd
	 * @param {Event} e Raw event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._onRawEnd = function(e) {
		var isTouchEvent = e.type === 'touchend' || e.type === 'touchcancel',
			result,
			targetElement;

		// stop if not active
		if (!this._active) {
			return true;
		}

		// quit if invalid event
		if (e.which !== 1 && e.type !== 'touchend' && e.type !== 'touchcancel') {
			return true;
		}

		targetElement = e.target;

		result = this._end(targetElement, isTouchEvent);

		/* istanbul ignore else */
		if (result === false) {
			e.preventDefault();

			return false;
		} else {
			return true;
		}
	};

	/**
	 * Called on main wrap drag start event.
	 *
	 * @method _onRawDragStart
	 * @param {Event} e Drag start event
	 * @private
	 */
	DragNavigator.prototype._onRawDragStart = function(/*e*/) {
		// cancel start drag event so images, links etc couldn't be dragged
        return false;
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
		this._startWindowScrollTop = $(window).scrollTop();
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};
		this._firstMoveEvent = true;

		// disable all children click events for the duration of the dragging
		if (targetElement !== null) {
			this._startTargetElement = targetElement;

			this._disableClickHandlers(targetElement);
		}

		// notify the carousel that dragging has begun
		this._carousel._onDragBegin(
			this._startPosition,
			this._startOppositePosition,
			this._startCarouselPosition,
			this._startWindowScrollTop
		);

		// disable default functionality
		//return false;

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
		var deltaDragPosition = position - this._startPosition;
			//deltaDragOppositePosition = oppositePosition - this._startOppositePosition,
			//currentWindowScrollTop = $(window).scrollTop(),
			//windowScrollTopDifference = this._startWindowScrollTop - currentWindowScrollTop;

		this._accumulatedMagnitude.main += Math.abs(this._lastPosition - position);
		this._accumulatedMagnitude.opposite += Math.abs(this._lastOppositePosition - oppositePosition);

		// we need last move position in the _end() handler
		this._lastPosition = position;
		this._lastOppositePosition = oppositePosition;

		// if the drag delta is very small then do nothing not to quit or start moving too soon
		// TODO this deadband can not be done on android: https://code.google.com/p/chromium/issues/detail?id=240735
		/*if (this._accumulatedMagnitude.main < this._noActionThreshold) {
			// emulate manual scrolling
			//$(window).scrollTop(this._startWindowScrollTop - windowScrollTopDifference - deltaDragOppositePosition);

			return false;
		}*/

		// if the carousel is dragged more in the opposite direction then cancel and propagate
		// this allows drag-navigating the page from carousel elements even if dead-band is exceeded
		if (
			this._accumulatedMagnitude.main > 0
			&& this._accumulatedMagnitude.main < this._accumulatedMagnitude.opposite
		) {
			this._end();

			return true;
		}

		// if the first move event takes more than 200ms then Android Chrome cancels the scroll, avoid this by returning
		// quikcly on the first event
		if (this._firstMoveEvent) {
			this._firstMoveEvent = false;

			return false;
		}

		// calculate the position
		var newPosition = this._startCarouselPosition + deltaDragPosition,
			itemSize = this._carousel.getItemSize(),
			totalSize = this._carousel.getTotalSize(),
			itemCountOnLastPage = this._carousel.getItemCountOnLastPage(),
			edgeMultiplier = this._config.overEdgeDragPositionMultiplier,
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
	 * @param {boolean} [isTouchEvent=false] Is this a touch event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._end = function(targetElement, isTouchEvent) {
		/* istanbul ignore if */
		if (!this._active) {
			return true;
		}

		isTouchEvent = typeof isTouchEvent === 'boolean' ? isTouchEvent : false;

		var deltaDragPosition = this._lastPosition - this._startPosition,
			deltaDragOppositePosition = this._lastOppositePosition - this._startOppositePosition,
			dragMagnitude = Math.sqrt(Math.pow(deltaDragPosition, 2) + Math.pow(deltaDragOppositePosition, 2)),
			direction = deltaDragPosition < 0 ? -1 : 1,
			currentPosition = this._carousel.getAnimator().getCurrentPosition(),
			ignoreClickThreshold = this._config.ignoreClickThreshold,
			performNavigation = Math.abs(deltaDragPosition) > 0,
			propagate = false,
			performClick,
			closestIndex,
			endHoverItemIndex;

		// we have to perform the navigation if the carousel was dragged in the main direction
		if (performNavigation) {
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
		}

		// for touch events we don't have the hover indexes
		if (isTouchEvent) {
			performClick = targetElement !== null
				&& targetElement === this._startTargetElement
				&& dragMagnitude < ignoreClickThreshold;
		} else {
			endHoverItemIndex = this._carousel.getHoverItemIndex();

			performClick = this._startHoverItemIndex !== null
				&& targetElement !== null
				&& targetElement === this._startTargetElement
				&& endHoverItemIndex === this._startHoverItemIndex
				&& dragMagnitude < ignoreClickThreshold;
		}

		// restore the element click handler if drag stopped on the same element and was dragged very little
		if (performClick) {
			this._restoreClickHandlers(targetElement);

			this._dragStartHoverItemIndex = null;

			// make sure the event propagates so the correct listeners get fired
			propagate = true;
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
		this._startWindowScrollTop = null;
		this._lastPosition = null;
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};
		this._firstMoveEvent = true;

		return propagate;
	};

	/**
	 * Disables normal click handler for given element.
	 *
	 * @method _disableClickHandlers
	 * @param {DOMElement} clickedElement Element to disable click events on
	 * @private
	 */
	DragNavigator.prototype._disableClickHandlers = function(clickedElement) {
		var disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			$clickedElement = $(clickedElement),
			$closestLink = $clickedElement.closest('A'),
			$disableElement = $clickedElement,
			isAlreadyDisabled,
			mainWrapClass,
			linkHasCarouselParent;

		// disable the closest A if possible
		if ($closestLink.length > 0) {
			mainWrapClass = '.' + this._carousel.getConfig().getClassName('wrap');
			linkHasCarouselParent = $closestLink.closest(mainWrapClass).length > 0;

			if (linkHasCarouselParent) {
				$disableElement = $closestLink;
			}
		}

		isAlreadyDisabled = $disableElement.data(disabledDataName);

		if (isAlreadyDisabled !== true) {
			var currentEventHandlers = $._data($disableElement[0], 'events'),
				clickHandlerFunctions = [],
				currentClickHandlers,
				i;

			// extract the existing click event handlers if got any
			if (
				Util.isObject(currentEventHandlers)
				&& Util.isArray(currentEventHandlers.click)
				&& currentEventHandlers.click.length > 0
			) {
				// extract the current clickhandler functions
				currentClickHandlers = currentEventHandlers.click;

				for (i = 0; i < currentClickHandlers.length; i++) {
					clickHandlerFunctions.push(currentClickHandlers[i].handler);
				}

				// store the original click handlers
				$disableElement.data('original-click-handlers', clickHandlerFunctions);

				// remove the current click handlers and add the ignore handler
				$disableElement.off('click');
			}

			// add an ignoring click handler
			$disableElement.on('click', this._ignoreEvent);

			$disableElement.data(disabledDataName, true);

			// mark it disabled to be easy to find for restoring
			$disableElement.attr('data-disabled', 'true');
		}
	};

	/**
	 * Calls the original click handlers for given element.
	 *
	 * @method _restoreClickHandlers
	 * @param {DOMElement} clickedElement Element to disable click events on
	 * @private
	 */
	DragNavigator.prototype._restoreClickHandlers = function(clickedElement) {
		var disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			$clickedElement = $(clickedElement),
			$restoreElement = null,
			$closestLink;

		// find the disabled element
		if ($clickedElement.attr('data-disabled') === 'true') {
			$restoreElement = $clickedElement;
		} else {
			$closestLink = $clickedElement.closest('A');

			if ($closestLink.length > 0 && $closestLink.attr('data-disabled') === 'true') {
				$restoreElement = $closestLink;
			}
		}

		// this should generally not happen
		if ($restoreElement === null) {
			return;
		}

		var originalClickHandlers = $restoreElement.data('original-click-handlers'),
			i;

		// remove the ignore handler
		$restoreElement.off('click');

		// restore the old click handlers if present
		if (Util.isArray(originalClickHandlers)) {
			// restore the original click handlers
			for (i = 0; i < originalClickHandlers.length; i++) {
				$restoreElement.on('click', originalClickHandlers[i].bind(clickedElement));
			}
		}

		// remove the disabled state
		$restoreElement.data(disabledDataName, false);
		$restoreElement.attr('data-disabled', null);

		/*var $clickedElement = $(clickedElement),
			disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			isDisabled = $clickedElement.data(disabledDataName);

		if (isDisabled === true) {
			// fetch the original click handlers
			var originalClickHandlers = $clickedElement.data('original-click-handlers'),
				i;

			// remove the ignore handler
			$clickedElement.off('click');

			// restore the old click handlers if present
			if (Util.isArray(originalClickHandlers)) {
				// restore the original click handlers
				for (i = 0; i < originalClickHandlers.length; i++) {
					$clickedElement.on('click', originalClickHandlers[i].bind(clickedElement));

					//originalClickHandlers[i].call(element);
				}
			}

			$clickedElement.data(disabledDataName, false);
		}*/
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