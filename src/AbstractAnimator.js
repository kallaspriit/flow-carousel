define([
], function() {
	'use strict';

	/**
	 * Animator interface.
	 *
	 * Extend this class to implement your own animators.
	 *
	 * At minimal you need to implement the following methods:
	 * - getCurrentPosition
	 * - animateToItem
	 * - animateToPosition
	 *
	 * @class AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function AbstractAnimator(carousel) {
		void(carousel); // don't use the argument but keep jshint happy
	}

	/**
	 * Called by the carousel when it is destroyed, releases all listeners etc.
	 *
	 * @method destroy
	 */
	AbstractAnimator.prototype.destroy = function() {
		// do nothing by default
	};

	/**
	 * Returns current slider absolute position in configured orientation in pixels.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	AbstractAnimator.prototype.getCurrentPosition = function() {
		throw new Error('Not implemented');
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
	AbstractAnimator.prototype.animateToItem = function(
		itemIndex,
		instant,
		noDeferred,
		animationSpeed,
		animationDuration
	) {
		void(itemIndex, instant, noDeferred, animationSpeed, animationDuration);

		throw new Error('Not implemented');
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
	AbstractAnimator.prototype.animateToPosition = function(
		position,
		instant,
		noDeferred,
		animationSpeed,
		animationDuration
	) {
		void(position, instant, noDeferred, animationSpeed, animationDuration);

		throw new Error('Not implemented');
	};

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselElementReady
	 */
	AbstractAnimator.prototype.onCarouselElementReady = function() {
		// do nothing by default
	};

	return AbstractAnimator;
});