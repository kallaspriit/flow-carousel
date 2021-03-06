define([
	'jquery'
], function($) {
	'use strict';

	/**
	 * Abstract renderer base class.
	 *
	 * Renderers take information from data sources and generate DOM nodes to use.
	 *
	 * @class AbstractRenderer
	 * @constructor
	 */
	function AbstractRenderer() {}

	/**
	 * Renders a carousel item.
	 *
	 * The data can be either a object of key-value pairs or an existing dom element to modify.
	 *
	 * Rendering an item can be asynchronous so a promise is returned.
	 *
	 * @method renderItem
	 * @param {Config} config Carousel configuration
	 * @param {number} index Item position index
	 * @param {object|DOMElement} data Item data object or existing dom element
	 * @return {Deferred.Promise}
	 */
	AbstractRenderer.prototype.renderItem = function(config, index, data) {
		void(config, index, data);

		throw new Error('Not implemented');
	};

	/**
	 * Renders a loading item placeholder.
	 *
	 * By default returns a simple div with the
	 * {{#crossLink "Config/cssClasses/placeholder:property"}}{{/crossLink}} class.
	 *
	 * You may override this in your custom renderer.
	 *
	 * @method renderPlaceholder
	 * @param {Config} config Carousel configuration
	 * @param {number} index Item position index
	 * @return {DOMElement}
	 */
	AbstractRenderer.prototype.renderPlaceholder = function(config, index) {
		void(index);

		return $('<div></div>')[0];
	};

	/**
	 * Destroys a carousel item.
	 *
	 * By default just removes the element using jQuery, but inheriting classes may choose to do something fancier.
	 *
	 * @method destroyItem
	 * @param {DOMElement} element DOM element to destroy
	 */
	AbstractRenderer.prototype.destroyItem = function(element) {
		$(element).remove();
	};

	/**
	 * Restores the initial contents of the carousel if possible.
	 *
	 * @method restoreInitialContents
	 * @param {AbstractDataSource} dataSource Data source to use
	 * @param {DOMElement} wrap Wrap to populate
	 */
	AbstractRenderer.prototype.restoreInitialContents = function(dataSource, wrap) {
		// don't do anything by default
		void(dataSource, wrap);
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	AbstractRenderer.prototype.destroy = function() {
		// do nothing by default
	};

	return AbstractRenderer;
});