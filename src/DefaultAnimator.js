define([
	'jquery',
	'AbstractAnimator',
	'Deferred'
], function($, AbstractAnimator, Deferred) {
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
		var deferred = new Deferred(),
			orientation = this._carousel.getOrientation(),
			itemSize = this._carousel.getItemSize(),
			itemsPerPage = this._carousel.getItemsPerPage(),
			itemMargin = this._carousel.getConfig().margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			translatePosition = itemIndex * itemSize + itemIndex * (itemMargin - gapPerItem),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			translateCommand;

		// the translate command is different for horizontal and vertical carousels
		if (orientation === this._carousel.Orientation.HORIZONTAL) {
			translateCommand = 'translate3d(' + -translatePosition + 'px,0,0)';
		} else {
			translateCommand = 'translate3d(0,' + -translatePosition + 'px,0)';
		}

		// apply the translate
		$scrollerWrap.css('transform', translateCommand);

		// wait for the transition to end and then resolve the deferred
		$scrollerWrap.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
			deferred.resolve();
		});

		// PhantomJS does not support 3d transforms, fake the transition end event
		/* istanbul ignore if */
		if (navigator.userAgent.toLowerCase().indexOf('phantomjs') !== -1) {
			window.setTimeout(function() {
				$scrollerWrap.trigger('transitionend');
			}, 200);
		}

		return deferred.promise();
	};

	return DefaultAnimator;
});