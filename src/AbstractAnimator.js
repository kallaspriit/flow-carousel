define([
], function() {
	'use strict';

	/**
	 * Animator interface.
	 *
	 * @class AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function AbstractAnimator(carousel) {
		void(carousel);
	}

	/**
	 * Returns current absolute position.
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
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 */
	AbstractAnimator.prototype.animateToItem = function(itemIndex, instant) {
		void(itemIndex, instant);

		throw new Error('Not implemented');
	};

	/**
	 * Animates the carousel to given absolute position.
	 *
	 * @method animateToPosition
	 * @param {number} position Requested position
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 */
	AbstractAnimator.prototype.animateToPosition = function(position, instant) {
		void(position, instant);

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