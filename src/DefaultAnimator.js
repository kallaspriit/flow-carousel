define([
	'AbstractAnimator'
], function(AbstractAnimator) {
	'use strict';

	// using deferred implementation from jQuery
	var $ = window.jQuery,
		Deferred = $.Deferred;

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
	 * @method animateToIndex
	 * @param {number} itemIndex Index of the item
	 * @return {Deferred.Promise}
	 */
	DefaultAnimator.prototype.animateToIndex = function(itemIndex) {
		var deferred = new Deferred();

		void(itemIndex);

		deferred.resolve();

		return deferred.promise();
	};

	return DefaultAnimator;
});