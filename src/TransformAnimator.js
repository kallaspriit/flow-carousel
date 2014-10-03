define([
	'jquery',
	'AbstractAnimator',
	'Config',
	'Util',
	'Deferred'
], function($, AbstractAnimator, Config, Util, Deferred) {
	'use strict';

	// requestAnimationFrame polyfill
	(function () {
		var lastTime = 0,
			vendors = ['webkit', 'moz'],
			x;

		for (x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback/*, element*/) {
				var currTime = new Date().getTime(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = window.setTimeout(function () {
						callback(currTime + timeToCall);
					},
					timeToCall);

				lastTime = currTime + timeToCall;

				return id;
			};
		}

		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}());

	/**
	 * Transforms based animator implementation.
	 *
	 * @class TransformAnimator
	 * @extends AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function TransformAnimator(carousel) {
		AbstractAnimator.call(this, carousel);

		/**
		 * Reference to the parent carousel component.
		 *
		 * @property _carousel
		 * @type {FlowCarousel}
		 * @private
		 */
		this._carousel = carousel;

		/**
		 * Currently active animation deferred.
		 *
		 * @property _activeDeferred
		 * @type {Deferred}
		 * @default null
		 * @private
		 */
		this._activeDeferred = null;

		/**
		 * Has the transition end listener been created.
		 *
		 * @property _transitionEndListenerCreated
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._transitionEndListenerCreated = false;

		/**
		 * Does the animated element have the class used for animated transforms.
		 *
		 * @property _isUsingAnimatedTransform
		 * @type {boolean}
		 * @default true
		 * @private
		 */
		this._isUsingAnimatedTransform = true;

		/**
		 * List of used event listeners.
		 *
		 * Used to keep track of added event listeners so they would properly get destroyed in the destructor.
		 *
		 * @property _eventListeners
		 * @type {object}
		 * @private
		 */
		this._eventListeners = {
			transitionEnd: this._onRawTransitionEnd.bind(this)
		};
	}

	TransformAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Called by the carousel when it is destroyed, releases all listeners etc.
	 *
	 * @method destroy
	 */
	TransformAnimator.prototype.destroy = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap());

		// remove the transition end listener
		$scrollerWrap.off(
			'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
			this._eventListeners.transitionEnd
		);
	};

	/**
	 * Returns current slider absolute position in configured orientation in pixels.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	TransformAnimator.prototype.getCurrentPosition = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap()),
			transformMatrix = $scrollerWrap.css('transform'),
			transformOffset = Util.parseTransformMatrix(transformMatrix),
			orientation = this._carousel.getOrientation();

		if (orientation === Config.Orientation.HORIZONTAL) {
			return transformOffset.x;
		} else {
			return transformOffset.y;
		}
	};

	/**
	 * Animates the carousel to given item index position.
	 *
	 * Animation speed from {{#crossLink "Config/transformAnimator/defaultAnimationSpeed:property"}}{{/crossLink}} is
	 * used by default.
	 *
	 * Returns deferred promise that is resolved when the animation completes.
	 *
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [noDeferred=false] Does not create a deferred if set to true, returns undefined
	 * @param {number} [animationSpeed] Optional custom animation speed to use
	 * @param {number} [animationDuration] Optional animation duration in milliseconds
	 * @return {Deferred.Promise}
	 */
	TransformAnimator.prototype.animateToItem = function(
		itemIndex,
		instant,
		noDeferred,
		animationSpeed,
		animationDuration
	) {
		var position = this._carousel.getItemPositionByIndex(itemIndex);

		return this.animateToPosition(position, instant, noDeferred, animationSpeed, animationDuration);
	};

	/**
	 * Animates the carousel to given absolute position in pixels.
	 *
	 * One can set either a custom animation speed in pixels per millisecond or custom animation duration in
	 * milliseconds. If animation duration is set then animation speed is ignored.
	 *
	 * Animation speed from {{#crossLink "Config/transformAnimator/defaultAnimationSpeed:property"}}{{/crossLink}} is
	 * used by default.
	 *
	 * Returns deferred promise that is resolved when the animation completes.
	 *
	 * @method animateToPosition
	 * @param {number} position Requested position in pixels
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [noDeferred=false] Does not create a deferred if set to true, returns undefined
	 * @param {number} [animationSpeed] Animation speed in pixels per millisecond
	 * @param {number} [animationDuration] Optional animation duration in milliseconds
	 * @return {Deferred.Promise}
	 */
	TransformAnimator.prototype.animateToPosition = function(
		position,
		instant,
		noDeferred,
		animationSpeed,
		animationDuration
	) {
		var config = this._carousel.getConfig().transformAnimator;

		instant = typeof instant === 'boolean' ? instant : false;
		noDeferred = typeof noDeferred === 'boolean' ? noDeferred : false;
		animationSpeed = typeof animationSpeed === 'number' ? animationSpeed : config.defaultAnimationSpeed;

		// limit the animation speed to configured range
		animationSpeed = Math.min(Math.max(animationSpeed, config.minAnimationSpeed), config.maxAnimationSpeed);

		/* istanbul ignore if */
		if (!this._transitionEndListenerCreated && instant !== true) {
			throw new Error('Requested non-instant animation before transition end listener was created');
		}

		var deferred = noDeferred ? null : new Deferred(),
			orientation = this._carousel.getOrientation(),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			currentPosition,
			deltaPosition,
			translateCommand;

		// make sure the position is a round integer
		position = Math.floor(position);

		// resolve existing animation deferred if exists
		/* istanbul ignore if */
		if (this._activeDeferred !== null) {
			this._activeDeferred.resolve();
			this._activeDeferred = null;
		}

		// don't waste resources on calculating current position if not using deferred
		if (noDeferred !== true) {
			currentPosition = this.getCurrentPosition();
			deltaPosition = position - currentPosition;
		}

		// the translate command is different for horizontal and vertical carousels
		if (orientation === Config.Orientation.HORIZONTAL) {
			translateCommand = 'translate3d(' + position + 'px,0,0)';
		} else {
			translateCommand = 'translate3d(0,' + position + 'px,0)';
		}

		// add a class that enables transitioning transforms if instant is not required
		if (instant === true && this._isUsingAnimatedTransform) {
			$scrollerWrap.css('transition-duration', '0ms');

			this._isUsingAnimatedTransform = false;
		} else if (instant === false) {
			// calculate animation duration from speed and delta position if not set manually
			if (typeof animationDuration !== 'number') {
				animationDuration = Math.round(Math.abs(deltaPosition) / animationSpeed);
			}

			// set the calculated transition duration to use to get requested speed
			$scrollerWrap.css('transition-duration', animationDuration + 'ms');

			this._isUsingAnimatedTransform = true;
		}

		// for instant animations, set the transform at once, otherwise use animation frame
		if (instant) {
			$scrollerWrap.css('transform', translateCommand);
		} else {
			// apply the transform using requestAnimationFrame for smoother results
			window.requestAnimationFrame(function () {
				$scrollerWrap.css('transform', translateCommand);
			});
		}

		// remove the deferred overhead where not required
		if (noDeferred) {
			return;
		}

		// if requested instant or the position is same as current then resolve immediately
		if (instant || position === currentPosition) {
			deferred.resolve();
		} else {
			// create active animation deferred
			this._activeDeferred = new Deferred();

			this._activeDeferred.done(function() {
				this._activeDeferred = null;

				deferred.resolve();
			}.bind(this));
		}

		return deferred.promise();
	};

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselInitiated
	 */
	TransformAnimator.prototype.onCarouselElementReady = function() {
		this._setupTransitionEndListener();
	};

	/**
	 * Starts listening for transition end event on the scroller wrap.
	 *
	 * @method _setupTransitionEndListener
	 * @private
	 */
	TransformAnimator.prototype._setupTransitionEndListener = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap());

		$scrollerWrap.on(
			'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
			this._eventListeners.transitionEnd
		);

		this._transitionEndListenerCreated = true;
	};

	/**
	 * Called on transition end event.
	 *
	 * @method _onRawTransitionEnd
	 * @private
	 */
	TransformAnimator.prototype._onRawTransitionEnd = function() {
		// resolve the active deferred if exists
		this._resolveDeferred();
	};

	/**
	 * Resolves currently active deferred if available and sets it to null.
	 *
	 * @method _resolveDeferred
	 * @private
	 */
	TransformAnimator.prototype._resolveDeferred = function() {
		if (this._activeDeferred === null) {
			return;
		}

		this._activeDeferred.resolve();
	};

	return TransformAnimator;
});