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

	return AbstractAnimator;
});