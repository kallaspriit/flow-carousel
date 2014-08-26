define([
	'Jquery',
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
		this._activeDeferred = null;
		this._transitionEndListenerCreated = false;
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
		if (!this._transitionEndListenerCreated) {
			throw new Error('Requested to animate before transition end listener was created');
		}

		var deferred = new Deferred(),
			orientation = this._carousel.getOrientation(),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			animateTransformClass = this._carousel.getConfig().getClassName('animateTransform'),
			currentPosition,
			translateCommand,
			promise;

		// make sure the position is a full integer
		position = Math.floor(position);

		// resolve existing deferred if exists
		if (this._activeDeferred !== null) {
			this._activeDeferred.resolve();
			this._activeDeferred = null;

			console.log('resolve existing animation');

			//throw new Error('An animation is already in progress, this should not happen');
		}

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

		console.log('start animation', position, instant);

		// apply the translate
		$scrollerWrap.css('transform', translateCommand, instant);

		// remove the deferred overhead where not required
		if (noDeferred) {
			return;
		}

		currentPosition = this.getCurrentPosition();

		// if the position is same as current then resolve immediately
		if (instant || position === currentPosition) {
			console.log('resolve instant animation');

			deferred.resolve();
		} else {
			this._activeDeferred = new Deferred();

			this._activeDeferred.done(function() {
				this._activeDeferred = null;

				deferred.resolve();
			}.bind(this));
		}

		return deferred.promise();
	};

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselInitiated
	 */
	AbstractAnimator.prototype.onCarouselElementReady = function() {
		this._setupTransitionEndListener();
	};

	/**
	 * Starts listening for transition end event on the scroller wrap.
	 *
	 * @method _setupTransitionEndListener
	 * @private
	 */
	DefaultAnimator.prototype._setupTransitionEndListener = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap());

		$scrollerWrap.on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function () {
			this._resolveDeferred();
		}.bind(this));

		this._transitionEndListenerCreated = true;
	};

	/**
	 * Resolves currently active deferred if available and sets it to null.
	 *
	 * @method _resolveDeferred
	 * @private
	 */
	DefaultAnimator.prototype._resolveDeferred = function() {
		if (this._activeDeferred === null) {
			return;
		}

		console.log('animation complete');

		this._activeDeferred.resolve();
	};

	return DefaultAnimator;
});