define([
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	'use strict';

	/**
	 * Automatic slideshow navigator.
	 *
	 * @class SlideshowNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function SlideshowNavigator(config) {
		AbstractNavigator.call(this);

		/**
		 * Navigator configuration.
		 *
		 * @property _config
		 * @type {object}
		 * @private
		 */
		this._config = config;

		/**
		 * Navigation mode.
		 *
		 * @property _mode
		 * @type {SlideshowNavigator.Mode}
		 * @private
		 */
		this._mode = null;

		/**
		 * The timeout for the next change.
		 *
		 * @property _delayTimeout
		 * @type {number|null}
		 * @private
		 */
		this._delayTimeout = null;

		/**
		 * Is the slideshow playing.
		 *
		 * @property _playing
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._playing = false;

		/**
		 * Is the mouse over given carousel.
		 *
		 * @property _mouseEntered
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._mouseEntered = false;

		/**
		 * List of used event listeners.
		 *
		 * @type {object}
		 * @private
		 */
		this._eventListeners = {
			mouseenter: this._onRawMouseEnter.bind(this),
			mouseleave: this._onRawMouseLeave.bind(this)
		};

		// set the mode to use
		this.setMode(config.mode || SlideshowNavigator.Mode.NAVIGATE_PAGE);
	}

	SlideshowNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' Navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' Navigate one item at a time
	 */
	SlideshowNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current slideshow navigator mode.
	 *
	 * The mode is either {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that slideshow changes
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {SlideshowNavigator/Mode:property} mode Mode to use
	 */
	SlideshowNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(SlideshowNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current slideshow navigator mode.
	 *
	 * The mode is either {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that slideshow changes
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {SlideshowNavigator/Mode:property}
	 */
	SlideshowNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	SlideshowNavigator.prototype._setup = function() {
		var $mainWrap = $(this._carousel.getMainWrap());

		// make sure that the mouse if over the main wrap element
		$mainWrap
			.on('mouseenter', this._eventListeners.mouseenter)
			.on('mouseleave', this._eventListeners.mouseleave);

		// listen for navigation end event to schedule the next slideshow move
		this._carousel.on(this._carousel.Event.NAVIGATED_TO_ITEM, this._onNavigatedToItem.bind(this));

		// begin the slideshow
		this.start();
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	SlideshowNavigator.prototype.destroy = function() {
		var $mainWrap = $(this._carousel.getMainWrap());

		this.stop();

		// remove the event listeners
		$mainWrap
			.off('mouseenter', this._eventListeners.mouseenter)
			.off('mouseleave', this._eventListeners.mouseleave);
	};

	/**
	 * Returns whether the slideshow is currently playing.
	 *
	 * @method isActive
	 */
	SlideshowNavigator.prototype.isPlaying = function() {
		return this._playing;
	};

	/**
	 * Starts the automatic slideshow.
	 *
	 * @method start
	 */
	SlideshowNavigator.prototype.start = function() {
		// stop existing slideshow if already playing
		if (this.isPlaying()) {
			this.stop();
		}

		this._playing = true;

		this._scheduleNextChange();
	};

	/**
	 * Starts the automatic slideshow.
	 *
	 * @method start
	 */
	SlideshowNavigator.prototype.stop = function() {
		if (this._delayTimeout !== null) {
			window.clearTimeout(this._delayTimeout);

			this._delayTimeout = null;
		}

		this._playing = false;
	};

	/**
	 * Schedules the next change event.
	 *
	 * @method _scheduleNextChange
	 * @private
	 */
	SlideshowNavigator.prototype._scheduleNextChange = function() {
		if (!this.isPlaying()) {
			return;
		}

		var interval = this._config.interval;

		// clear existing
		if (this._delayTimeout !== null) {
			window.clearTimeout(this._delayTimeout);

			this._delayTimeout = null;
		}

		// perform action after timeout and schedule another one
		this._delayTimeout = window.setTimeout(function() {
			if (this._carousel === null || !this._carousel.isInitiated()) {
				return;
			}

			// perform navigation and schedule next change
			this._performChange();
			this._scheduleNextChange();
		}.bind(this), interval);
	};

	/**
	 * Performs the change event.
	 *
	 * @method _performChange
	 * @private
	 */
	SlideshowNavigator.prototype._performChange = function() {
		// don't control the carousel when user is hovering it
		if (this._mouseEntered) {
			return;
		}

		var instantRollover = this._config.instantRollover;

		// either change the page or item as set by mode, taking rollover into account
		if (this._mode === SlideshowNavigator.Mode.NAVIGATE_PAGE) {
			if (this._carousel.getPageCount() > 0) {
				if (this._carousel.isLastPage()) {
					this._carousel.navigateToPage(0, instantRollover);
				} else {
					this._carousel.navigateToNextPage();
				}
			}
		} else if (this._mode === SlideshowNavigator.Mode.NAVIGATE_ITEM) {
			if (this._carousel.getItemCount() > 0) {
				if (this._carousel.isLastItem()) {
					this._carousel.navigateToItem(0, instantRollover);
				} else {
					this._carousel.navigateToNextItem();
				}
			}
		}
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseEnter
	 * @param {Event} e Mouse event
	 * @private
	 */
	SlideshowNavigator.prototype._onRawMouseEnter = function(/*e*/) {
		this._mouseEntered = true;
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseLeave
	 * @param {Event} e Mouse event
	 * @private
	 */
	SlideshowNavigator.prototype._onRawMouseLeave = function(/*e*/) {
		this._mouseEntered = false;

		// re-schedule the change event for consistent timing
		this._scheduleNextChange();
	};

	/**
	 * Called when user navigated to a new item.
	 *
	 * @method _onNavigatedToItem
	 * @private
	 */
	SlideshowNavigator.prototype._onNavigatedToItem = function() {
		// re-schedule the change event for consistent timing
		this._scheduleNextChange();
	};

	return SlideshowNavigator;
});