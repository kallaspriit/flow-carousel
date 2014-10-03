define([
	'jquery',
	'AbstractAnimator',
	'Config',
	'Deferred',
	'polyfills/requestAnimationFrame'
], function($, AbstractAnimator, Config, Deferred) {
	'use strict';

	/**
	 * Native scroll based animator implementation.
	 *
	 * @class ScrollAnimator
	 * @extends AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function ScrollAnimator(carousel) {
		AbstractAnimator.call(this, carousel);

		this._carousel = carousel;
		this._activeDeferred = null;
	}

	ScrollAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselInitiated
	 */
	ScrollAnimator.prototype.onCarouselElementReady = function() {
		// add css class to indicate the type of this animator
		$(this._carousel.getMainWrap()).addClass(this._carousel.getConfig().cssPrefix + 'scroll-animator');
	};

	/**
	 * Returns current absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	ScrollAnimator.prototype.getCurrentPosition = function() {
		var $scrollerWrap = $(this._carousel.getItemsWrap()),
			orientation = this._carousel.getOrientation();

		if (orientation === Config.Orientation.HORIZONTAL) {
			return $scrollerWrap.scrollLeft() * -1;
		} else {
			return $scrollerWrap.scrollTop() * -1;
		}
	};

	/**
	 * Animates the carousel to given item index position.
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
	ScrollAnimator.prototype.animateToItem = function(
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
	ScrollAnimator.prototype.animateToPosition = function(
		position,
		instant,
		noDeferred,
		animationSpeed,
		animationDuration
	) {
		var config = this._carousel.getConfig().scrollAnimator;

		instant = typeof instant === 'boolean' ? instant : false;
		noDeferred = typeof noDeferred === 'boolean' ? noDeferred : false;
		animationSpeed = typeof animationSpeed === 'number' ? animationSpeed : config.defaultAnimationSpeed;

		// limit the animation speed to configured range
		animationSpeed = Math.min(Math.max(animationSpeed, config.minAnimationSpeed), config.maxAnimationSpeed);

		// resolve existing animation deferred if exists
		if (this._activeDeferred !== null) {
			this._activeDeferred.resolve();
			this._activeDeferred = null;
		}

		var deferred = noDeferred ? null : new Deferred(),
			orientation = this._carousel.getOrientation(),
			$itemsWrap = $(this._carousel.getItemsWrap()),
			scrollMethod = orientation === Config.Orientation.HORIZONTAL ? 'scrollLeft' : 'scrollTop',
			animationProps = {},
			currentPosition,
			deltaPosition;

		// make sure the position is a full integer
		position = Math.floor(position);

		// don't waste resources on calculating current position if not using deferred
		if (noDeferred !== true) {
			currentPosition = this.getCurrentPosition();
			deltaPosition = position - currentPosition;
		}

		if (instant === true) {
			// apply the scroll, use requestAnimationFrame for smoother results
			window.requestAnimationFrame(function () {
				$itemsWrap[scrollMethod](-position);

				if (noDeferred !== true) {
					deferred.resolve();
				}
			});
		} else {
			// calculate animation duration from speed and delta position if not set manually
			if (typeof animationDuration !== 'number') {
				animationDuration = Math.round(Math.abs(deltaPosition) / animationSpeed);
			}

			animationProps[scrollMethod] = -position;

			// animate with jquery
			$itemsWrap.animate(animationProps, animationDuration, function() {
				if (noDeferred !== true) {
					deferred.resolve();
				}
			}.bind(this));
		}

		if (noDeferred !== true) {
			this._activeDeferred = deferred;

			// clear the active deferred once this completes
			deferred.done(function() {
				this._activeDeferred = null;
			}.bind(this));

			return deferred.promise();
		}
	};

	return ScrollAnimator;
});