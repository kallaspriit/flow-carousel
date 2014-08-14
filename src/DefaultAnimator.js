define([
	'AbstractAnimator',
	'Deferred'
], function(AbstractAnimator, Deferred) {
	'use strict';

	/**
	 * Data source interface.
	 *
	 * @class DefaultAnimator
	 * @extends AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function DefaultAnimator(carousel) {
		AbstractAnimator.call(this);

		this._carousel = carousel;
	}

	DefaultAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Animates the carousel to given item index position.
	 *
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @return {Deferred.Promise}
	 */
	DefaultAnimator.prototype.animateToItem = function(itemIndex) {
		var deferred = new Deferred();

		void(itemIndex);

		deferred.resolve();

		console.log('navigating to', itemIndex);

		return deferred.promise();
	};

	return DefaultAnimator;
});