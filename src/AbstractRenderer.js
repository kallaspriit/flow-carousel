define([
], function() {
	'use strict';

	/**
	 * Renderer interface.
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
	 * @method renderItem
	 * @param {Config} config Carousel configuration
	 * @param {number} index Item position index
	 * @param {object|DOMElement} data Item data object or existing dom element
	 */
	AbstractRenderer.prototype.renderItem = function(config, index, data) {
		void(config, index, data);

		throw new Error('Not implemented');
	};

	/**
	 * Destroys a carousel item.
	 *
	 * @method destroyItem
	 * @param {number} index Item position index
	 */
	AbstractRenderer.prototype.destroyItem = function(index) {
		void(index);

		throw new Error('Not implemented');
	};

	return AbstractRenderer;
});