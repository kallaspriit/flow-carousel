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
	DefaultAnimator.prototype.getCurrentPosition = function() {
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
		var position = this._carousel.getItemPositionByIndex(itemIndex);

		return this.animateToPosition(-position, instant);
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
	DefaultAnimator.prototype.animateToPosition = function(position, instant, noDeferred) {
		var orientation = this._carousel.getOrientation(),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			animateTransformClass = this._carousel.getConfig().getClassName('animateTransform'),
			currentPosition,
			translateCommand,
			deferred;

		// the translate command is different for horizontal and vertical carousels
		if (orientation === Config.Orientation.HORIZONTAL) {
			translateCommand = 'translate3d(' + position + 'px,0,0)';
		} else {
			translateCommand = 'translate3d(0,' + position + 'px,0)';
		}

		// add a class that enables transitioning transforms if instant is not required
		if (instant === true) {
			$scrollerWrap.removeClass(animateTransformClass);
		} else {
			$scrollerWrap.addClass(animateTransformClass);
		}

		// apply the translate
		$scrollerWrap.css('transform', translateCommand);

		// remove the deferred overhead where not required
		if (noDeferred) {
			return;
		}

		deferred = new Deferred();
		currentPosition = this.getCurrentPosition();

		// if the position is same as current then resolve immediately
		if (instant || position === currentPosition) {
			deferred.resolve();
		} else {
			// wait for the transition to end and then resolve the deferred
			$scrollerWrap.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function () {
				deferred.resolve();
			});
		}

		return deferred.promise();
	};

	return DefaultAnimator;
});