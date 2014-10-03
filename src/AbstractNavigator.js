define([
], function() {
	'use strict';

	/**
	 * Abstract navigator base class.
	 *
	 * Use navigators to navigate the carousel using mouse, touch, keyboard, ui, urls etc.
	 *
	 * @class AbstractNavigator
	 * @constructor
	 */
	function AbstractNavigator() {

		/**
		 * Carousel component.
		 *
		 * @property _carousel
		 * @type {FlowCarousel|null}
		 * @default null
		 * @private
		 */
		this._carousel = null;
	}

	/**
	 * Initiated the navigator.
	 *
	 * This is called automatically by the carousel and calls _setup() in turn that the subclasses should implement.
	 *
	 * @method init
	 * @param {FlowCarousel} carousel The carousel component
	 */
	AbstractNavigator.prototype.init = function(carousel) {
		this._carousel = carousel;

		this._setup();
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	AbstractNavigator.prototype.destroy = function() {
		// do nothing by default
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	AbstractNavigator.prototype._setup = function() {
		throw new Error('Not implemented');
	};

	return AbstractNavigator;
});