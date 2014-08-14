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
	 * @method animateToIndex
	 * @param {number} itemIndex Index of the item
	 * @return {Deferred.Promise}
	 */
	AbstractAnimator.prototype.animateToIndex = function(itemIndex) {
		void(itemIndex);

		throw new Error('Not implemented');
	};

	return AbstractAnimator;
});