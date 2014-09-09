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
	 * Data source interface.
	 *
	 * @class DefaultAnimator
	 * @extends AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function DefaultAnimator(carousel) {
		AbstractAnimator.call(this, carousel);

		this._carousel = carousel;
		this._activeDeferred = null;
		this._transitionEndListenerCreated = false;
		this._eventListeners = {
			transitionEnd: this._onRawTransitionEnd.bind(this)
		};
	}

	DefaultAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	DefaultAnimator.prototype.destroy = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap());

		// remove the transition end listener
		$scrollerWrap.off(
			'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
			this._eventListeners.transitionEnd
		);
	};

	/**
	 * Returns current absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	DefaultAnimator.prototype.getCurrentPosition = function() {
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
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 */
	DefaultAnimator.prototype.animateToItem = function(itemIndex, instant) {
		var position = this._carousel.getItemPositionByIndex(itemIndex);

		return this.animateToPosition(position, instant);
	};

	/**
	 * Animates the carousel to given absolute position.
	 *
	 * @method animateToPosition
	 * @param {number} position Requested position
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [noDeferred=false] Does not create a deferred if set to true
	 * @return {Deferred.Promise}
	 */
	DefaultAnimator.prototype.animateToPosition = function(position, instant, noDeferred) {
		instant = typeof instant === 'boolean' ? instant : false;
		noDeferred = typeof noDeferred === 'boolean' ? noDeferred : false;

		/* istanbul ignore if */
		if (!this._transitionEndListenerCreated && instant !== true) {
			throw new Error('Requested non-instant animation before transition end listener was created');
		}

		var deferred = noDeferred ? null : new Deferred(),
			orientation = this._carousel.getOrientation(),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			animateTransformClass = this._carousel.getConfig().getClassName('animateTransform'),
			currentPosition,
			translateCommand;

		// make sure the position is a full integer
		position = Math.floor(position);

		// resolve existing deferred if exists
		/* istanbul ignore if */
		if (this._activeDeferred !== null) {
			this._activeDeferred.resolve();
			this._activeDeferred = null;
		}

		// don't waste power on current position if not using deferred
		if (noDeferred !== true) {
			currentPosition = this.getCurrentPosition();
		}

		// the translate command is different for horizontal and vertical carousels
		if (orientation === Config.Orientation.HORIZONTAL) {
			translateCommand = 'translate3d(' + position + 'px,0,0)';
		} else {
			translateCommand = 'translate3d(0,' + position + 'px,0)';
		}

		// add a class that enables transitioning transforms if instant is not required
		if (instant === true && $scrollerWrap.hasClass(animateTransformClass)) {
			$scrollerWrap.removeClass(animateTransformClass);
		} else if (instant === false && !$scrollerWrap.hasClass(animateTransformClass)) {
			$scrollerWrap.addClass(animateTransformClass);
		}

		// apply the translate, use requestAnimationFrame for smoother results
		window.requestAnimationFrame(function () {
			$scrollerWrap.css('transform', translateCommand);
		});

		//$scrollerWrap.css('transform', translateCommand);

		// remove the deferred overhead where not required
		if (noDeferred) {
			return;
		}

		// if the position is same as current then resolve immediately
		if (instant || (noDeferred !== true && position === currentPosition)) {
			deferred.resolve();
		} else {
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
	DefaultAnimator.prototype.onCarouselElementReady = function() {
		this._setupTransitionEndListener();
	};

	/**
	 * Starts listening for transition end event on the scroller wrap.
	 *
	 * @method _setupTransitionEndListener
	 * @private
	 */
	DefaultAnimator.prototype._setupTransitionEndListener = function() {
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
	 * @param {Event} e Raw event
	 * @private
	 */
	DefaultAnimator.prototype._onRawTransitionEnd = function(/*e*/) {
		// resolve the active deferred if exists
		this._resolveDeferred();
	};

	/**
	 * Resolves currently active deferred if available and sets it to null.
	 *
	 * @method _resolveDeferred
	 * @private
	 */
	DefaultAnimator.prototype._resolveDeferred = function() {
		if (this._activeDeferred === null) {
			return;
		}

		this._activeDeferred.resolve();
	};

	return DefaultAnimator;
});