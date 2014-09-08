define([
	'jquery',
	'AbstractAnimator',
	'Config',
	'Deferred'
], function($, AbstractAnimator, Config, Deferred) {
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
	 * @class ScrollAnimator
	 * @extends AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function ScrollAnimator(carousel) {
		AbstractAnimator.call(this, carousel);

		this._animationSpeed = 200;
		this._carousel = carousel;
	}

	ScrollAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselInitiated
	 */
	ScrollAnimator.prototype.onCarouselElementReady = function() {
		//add css class to indicate the type of this animator
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
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 */
	ScrollAnimator.prototype.animateToItem = function(itemIndex, instant) {
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
	ScrollAnimator.prototype.animateToPosition = function(position, instant, noDeferred) {
		instant = typeof instant === 'boolean' ? instant : false;
		noDeferred = typeof noDeferred === 'boolean' ? noDeferred : false;

		var deferred = noDeferred ? null : new Deferred(),
			orientation = this._carousel.getOrientation();

		// make sure the position is a full integer
		position = Math.floor(position) * -1;

		// decide to use scrollLeft or scrollTop based on carousel orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			this._animateToLeftPosition(position, instant).done(function(){
				if (noDeferred !== true) {
					deferred.resolve();
				}
			});
		} else {
			this._animateToTopPosition(position, instant).done(function(){
				if (noDeferred !== true) {
					deferred.resolve();
				}
			});
		}

		if (noDeferred !== true) {
			return deferred.promise();
		}
	};

	/**
	 * Animates the carousel to given absolute position from left.
	 *
	 * @method _animateToLeftPosition
	 * @param {number} position Requested position
	 * @param {boolean} instant Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 * @private
	 */
	ScrollAnimator.prototype._animateToLeftPosition = function(position, instant) {
		var $scrollerWrap = $(this._carousel.getItemsWrap()),
			deferred = new Deferred();

		if (instant === true) {
			// apply the scroll, use requestAnimationFrame for smoother results
			window.requestAnimationFrame(function () {
				//debugger
				$scrollerWrap.scrollLeft(position);
				deferred.resolve();
			});
		} else {
			//animate with jquery
			$scrollerWrap.animate({
				scrollLeft: position
			}, this._animationSpeed, function() {
				deferred.resolve();
			}.bind(this));
		}

		return deferred.promise();
	};

	/**
	 * Animates the carousel to given absolute position from top.
	 *
	 * @method _animateToTopPosition
	 * @param {number} position Requested position
	 * @param {boolean} instant Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 * @private
	 */
	ScrollAnimator.prototype._animateToTopPosition = function(position, instant) {
		var $scrollerWrap = $(this._carousel.getItemsWrap()),
			deferred = new Deferred();

		if (instant === true) {
			// apply the scroll, use requestAnimationFrame for smoother results
			window.requestAnimationFrame(function () {
				$scrollerWrap.scrollTop(position);
				deferred.resolve();
			});
		} else {
			//animate with jquery
			$scrollerWrap.animate({
				scrollTop: position
			}, this._animationSpeed, function() {
				deferred.resolve();
			}.bind(this));
		}

		return deferred.promise();
	};

	return ScrollAnimator;
});