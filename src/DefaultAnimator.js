define([
	'jquery',
	'AbstractAnimator',
	'Config',
	'Util',
	'Deferred'
], function($, AbstractAnimator, Config, Util, Deferred) {
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
		AbstractAnimator.call(this, carousel);

		this._carousel = carousel;
	}

	DefaultAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Returns current absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	AbstractAnimator.prototype.getCurrentPosition = function() {
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
		var itemSize = this._carousel.getItemSize(),
			itemsPerPage = this._carousel.getItemsPerPage(),
			itemMargin = this._carousel.getConfig().margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			position = Math.floor(itemIndex * itemSize + itemIndex * (itemMargin - gapPerItem));

		return this.animateToPosition(-position, instant);
	};

	/**
	 * Animates the carousel to given absolute position.
	 *
	 * @method animateToPosition
	 * @param {number} position Requested position
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 */
	DefaultAnimator.prototype.animateToPosition = function(position, instant) {
		var deferred = new Deferred(),
			orientation = this._carousel.getOrientation(),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			instantAnimationClass = this._carousel.getConfig().getClassName('instantAnimation'),
			translateCommand;

		// the translate command is different for horizontal and vertical carousels
		if (orientation === Config.Orientation.HORIZONTAL) {
			translateCommand = 'translate3d(' + position + 'px,0,0)';
		} else {
			translateCommand = 'translate3d(0,' + position + 'px,0)';
		}

		if (instant === true) {
			$scrollerWrap.addClass(instantAnimationClass);
		} else {
			$scrollerWrap.removeClass(instantAnimationClass);
		}

		// apply the translate
		$scrollerWrap.css('transform', translateCommand);

		// wait for the transition to end and then resolve the deferred
		$scrollerWrap.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function () {
			if (instant === true) {
				$scrollerWrap.removeClass(instantAnimationClass);
			}

			deferred.resolve();
		});

		// the transition end event does not get automatically triggered when using 0ms transitions
		if (instant === true) {
			window.setTimeout(function() {
				$scrollerWrap.trigger('transitionend');
			}, 0);
		}

		return deferred.promise();
	};

	return DefaultAnimator;
});