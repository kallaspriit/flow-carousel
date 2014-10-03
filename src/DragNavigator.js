define([
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	'use strict';

	/**
	 * Uses mouse and touch events to navigate the carousel.
	 *
	 * @class DragNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function DragNavigator(config) {
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
		 * @type {DragNavigator.Mode}
		 * @private
		 */
		this._mode = null;

		/**
		 * Is the drag navigator currently active and dragging.
		 *
		 * @property _active
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._active = false;

		/**
		 * Was an existing animation stopped.
		 *
		 * @property _stoppedExistingAnimation
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._stoppedExistingAnimation = false;

		/**
		 * Has the dragging procedure started.
		 *
		 * @property _startedDragging
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._startedDragging = false;

		/**
		 * Drag cursor position at the start of the drag process.
		 *
		 * @property _startDragPosition
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._startDragPosition = null;

		/**
		 * Drag cursor opposite position at the start of the drag process.
		 *
		 * @property _startOppositePosition
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._startOppositePosition = null;

		/**
		 * Carousel wrap position at the start of the drag process.
		 *
		 * @property _startCarouselPosition
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._startCarouselPosition = null;

		/**
		 * Item index that was hovered when starting to drag.
		 *
		 * @property _startHoverItemIndex
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._startHoverItemIndex = null;

		/**
		 * The DOM node that the user started to drag.
		 *
		 * @property _startTargetElement
		 * @type {DOMElement|null}
		 * @default null
		 * @private
		 */
		this._startTargetElement = null;

		/**
		 * Last observed drag cursor position.
		 *
		 * @property _lastDragPosition
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastDragPosition = null;

		/**
		 * Last observed opposite drag cursor position.
		 *
		 * @property _lastDragPosition
		 * @type _lastOppositePosition
		 * @default null
		 * @private
		 */
		this._lastOppositePosition = null;

		/**
		 * Timestamp of the last move event.
		 *
		 * @property _lastMoveTime
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastMoveTime = null;

		/**
		 * Time difference between the last move events.
		 *
		 * @property _lastMoveDeltaTime
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastMoveDeltaTime = null;

		/**
		 * Pixels position difference between the last move events.
		 *
		 * @property _lastDeltaDragPosition
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastDeltaDragPosition = null;

		/**
		 * Accumulated move events positions in main and opposite directions.
		 *
		 * @property _accumulatedMagnitude
		 * @type {object}
		 * @private
		 */
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};

		/**
		 * Is the move event the first one during current drag procedure.
		 *
		 * @property _firstMoveEvent
		 * @type {boolean}
		 * @default true
		 * @private
		 */
		this._firstMoveEvent = true;

		/**
		 * The last direction that the carousel was dragged at (1 for positive and -1 for negative).
		 *
		 * @property _lastDragDirection
		 * @type {number}
		 * @default 1
		 * @private
		 */
		this._lastDragDirection = 1;

		/**
		 * List of elements that have been disabled during dragging.
		 *
		 * @property _disabledElements
		 * @type {Array}
		 * @private
		 */
		this._disabledElements = [];

		/**
		 * List of used event listeners.
		 *
		 * @type {object}
		 * @private
		 */
		this._eventListeners = {
			start: this._onRawStart.bind(this),
			move: this._onRawMove.bind(this),
			end: this._onRawEnd.bind(this),
			dragStart: this._onRawDragStart.bind(this)
		};

		// set the mode to use
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
			eventPosition = this._extractDragPosition(e),
			dragPosition = horizontal ? eventPosition.x : eventPosition.y,
			oppositePosition = horizontal ? eventPosition.y : eventPosition.x,
			targetElement = e.target,
			result;

		result = this._begin(dragPosition, oppositePosition, targetElement);

		// prevent the default browser behaviour if started dragging
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
			eventPosition,
			dragPosition,
			oppositePosition;

		// stop if not active
		if (!this._active) {
			return true;
		}

		// only move the carousel when the left mouse button is pressed
		if (e.which !== 1 && e.type !== 'touchmove') {
			result = this._end(e.target, isTouchEvent);
		} else {
			eventPosition = this._extractDragPosition(e);
			dragPosition = horizontal ? eventPosition.x : eventPosition.y;
			oppositePosition = horizontal ? eventPosition.y : eventPosition.x;

			result = this._move(dragPosition, oppositePosition);
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
			targetElement = e.target,
			result;

		// stop if not active
		if (!this._active) {
			return true;
		}

		// quit if invalid event
		if (e.which !== 1 && e.type !== 'touchend' && e.type !== 'touchcancel') {
			return true;
		}

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
	 * @param {number} dragPosition Drag position
	 * @param {number} oppositePosition Drag opposite position (y for horizontal, x for vertical)
	 * @param {DOMElement} targetElement The element that was under the cursor when drag started
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._begin = function(dragPosition, oppositePosition, targetElement) {
		targetElement = targetElement || null;

		// store drag start information
		this._active = true;
		this._startDragPosition = dragPosition;
		this._startOppositePosition = oppositePosition;
		this._lastDragPosition = dragPosition; // it's possible that the move event never occurs so set it here alrady
		this._lastOppositePosition = oppositePosition; // same for this
		this._lastMoveTime = (new Date()).getTime();
		this._startCarouselPosition = this._carousel.getAnimator().getCurrentPosition();
		this._startHoverItemIndex = this._carousel.getHoverItemIndex();
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

		// if already animating then stop the animation at current position
		if (this._carousel.isAnimating()) {
			this._carousel.getAnimator().animateToPosition(this._startCarouselPosition, true, true);

			this._stoppedExistingAnimation = true;
			this._startedDragging = true;
		}

		// notify the carousel that dragging has begun
		this._carousel._onDragBegin(
			this._startDragPosition,
			this._startOppositePosition,
			this._startCarouselPosition
		);

		// do not let the event propagate if we stopped an existing animation
		if (this._stoppedExistingAnimation) {
			return false;
		} else {
			return true;
		}
	};

	/**
	 * Called on mouse/finger move.
	 *
	 * @method _move
	 * @param {number} dragPosition Drag position
	 * @param {number} oppositePosition Drag opposite position (y for horizontal, x for vertical)
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._move = function(dragPosition, oppositePosition) {
		/* istanbul ignore if */
		if (!this._active) {
			return true;
		}

		// compare motion in the carousel and the opposite direction
		var deltaDragPosition = dragPosition - this._startDragPosition,
			moveDelta = this._lastDragPosition - dragPosition,
			currentTime = (new Date()).getTime();

		// increment the accumulated move amount
		this._accumulatedMagnitude.main += Math.abs(moveDelta);
		this._accumulatedMagnitude.opposite += Math.abs(this._lastOppositePosition - oppositePosition);

		// the delta time and position are used to calculate drag speed
		if (this._lastMoveTime !== null) {
			this._lastMoveDeltaTime = currentTime - this._lastMoveTime;
		}

		if (this._lastDragPosition !== null) {
			this._lastDeltaDragPosition = dragPosition - this._lastDragPosition;
		}

		// store the last drag direction, don't change if if no move delta detected
		if (moveDelta > 0) {
			this._lastDragDirection = -1;
		} else if (moveDelta < 0) {
			this._lastDragDirection = 1;
		}

		// we need last move position in the _end() handler
		this._lastDragPosition = dragPosition;
		this._lastOppositePosition = oppositePosition;
		this._lastMoveTime = currentTime;

		// if the carousel is dragged more in the opposite direction then cancel and propagate
		// this allows drag-navigating the page from carousel elements even if dead-band is exceeded
		if (
			this._accumulatedMagnitude.main > 0
			&& this._accumulatedMagnitude.main < this._accumulatedMagnitude.opposite
			&& !this._startedDragging
		) {
			this._end();

			return true;
		}

		// we have started dragging, do not give up the control any more
		this._startedDragging = true;

		// if the first move event takes more than 200ms then Android Chrome cancels the scroll, avoid this by returning
		// quickly on the first event
		if (this._firstMoveEvent) {
			this._firstMoveEvent = false;

			return false;
		}

		// calculate the position
		var newPosition = this._startCarouselPosition + deltaDragPosition,
			applyPosition = newPosition,
			itemSize = this._carousel.getItemSize(),
			totalSize = this._carousel.getTotalSize(),
			itemCountOnLastPage = this._carousel.getItemCountOnLastPage(),
			edgeMultiplier = this._config.overEdgeDragPositionMultiplier,
			minLimit = 0,
			maxLimit = -totalSize + itemCountOnLastPage * itemSize;

		// create smooth limit at the edges applying the drag motion partially
		if (newPosition > minLimit) {
			applyPosition = (this._startCarouselPosition + deltaDragPosition) * edgeMultiplier;
		} else if (newPosition < maxLimit) {
			applyPosition = this._startCarouselPosition + (deltaDragPosition * edgeMultiplier);
		}

		// use the animator to move to calculated position instantly
		this._carousel.getAnimator().animateToPosition(applyPosition, true, true);

		// stop event propagation so browser won't perform its default actions
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

		var currentPosition = this._carousel.getAnimator().getCurrentPosition(),
			totalDeltaDragPosition = this._lastDragPosition - this._startDragPosition,
			deltaDragOppositePosition = this._lastOppositePosition - this._startOppositePosition,
			dragMagnitude = Math.sqrt(Math.pow(totalDeltaDragPosition, 2) + Math.pow(deltaDragOppositePosition, 2)),
			ignoreClickThreshold = this._config.ignoreClickThreshold,
			performNavigation = Math.abs(totalDeltaDragPosition) > 0 || this._stoppedExistingAnimation,
			deltaDragPositionMagnitude = Math.abs(this._lastDeltaDragPosition),
			dragSpeedPixelsPerMillisecond = deltaDragPositionMagnitude / this._lastMoveDeltaTime,
			propagate = false,
			performClick,
			closestIndex,
			endHoverItemIndex;

		// we have to perform the navigation if the carousel was dragged in the main direction
		if (performNavigation) {
			// navigate to closest item or page depending on selected mode
			switch (this._mode) {
				case DragNavigator.Mode.NAVIGATE_PAGE:
					closestIndex = this._carousel.getClosestPageIndexAtPosition(
						currentPosition,
						this._lastDragDirection
					);

					this._carousel.navigateToPage(closestIndex, false, true, dragSpeedPixelsPerMillisecond);
				break;

				case DragNavigator.Mode.NAVIGATE_ITEM:
					closestIndex = this._carousel.getClosestItemIndexAtPosition(
						currentPosition,
						this._lastDragDirection
					);

					this._carousel.navigateToItem(closestIndex, false, true, dragSpeedPixelsPerMillisecond);
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

			// there is a number of requirements for handling the click event
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
			this._startDragPosition,
			this._lastDragPosition,
			totalDeltaDragPosition,
			closestIndex,
			this._lastDragDirection,
			targetElement
		);

		// reset
		this._active = false;
		this._stoppedExistingAnimation = false;
		this._startedDragging = false;
		this._startDragPosition = null;
		this._startOppositePosition = null;
		this._startCarouselPosition = null;
		this._startWindowScrollTop = null;
		this._lastDragPosition = null;
		this._lastMoveTime = null;
		this._lastMoveDeltaTime = null;
		this._lastDeltaDragPosition = null;
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};
		this._firstMoveEvent = true;

		// restore all disabled elements in next frame
		window.setTimeout(function() {
			// the carousel may get destroyed before this
			if (this._carousel === null || !this._carousel.isInitiated()) {
				return;
			}

			while (this._disabledElements.length > 0) {
				this._restoreClickHandlers(this._disabledElements.pop());
			}
		}.bind(this), 0);

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

			this._disabledElements.push(clickedElement);
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
		// the carousel may get destroyed before this
		if (this._carousel === null || !this._carousel.isInitiated()) {
			return;
		}

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
	};

	/**
	 * Ignores given jQuery event.
	 *
	 * @method _ignoreEvent
	 * @param {jQuery.Event} e jQuery event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	/* istanbul ignore next */
	DragNavigator.prototype._ignoreEvent = function(event) {
		event.preventDefault();
		event.stopPropagation();

		return false;
	};

	/**
	 * Extracts drag position x, y from mouse or touch event.
	 *
	 * @method _extractDragPosition
	 * @param {Event} event Mouse or drag event
	 * @return {object}
	 * @private
	 */
	DragNavigator.prototype._extractDragPosition = function(event) {
		var isTouchEvent = event.type === 'touchstart';

		return {
			x: isTouchEvent ? event.originalEvent.changedTouches[0].pageX : event.pageX,
			y: isTouchEvent ? event.originalEvent.changedTouches[0].pageY : event.pageY
		};
	};

	return DragNavigator;
});