define([
	'AbstractRenderer',
	'Deferred'
], function(AbstractRenderer, Deferred) {
	'use strict';

	/**
	 * The default renderer for already existing HTML elements.
	 *
	 * @class HtmlRenderer
	 * @extends AbstractRenderer
	 * @constructor
	 */
	function HtmlRenderer() {
		AbstractRenderer.call(this);
	}

	HtmlRenderer.prototype = Object.create(AbstractRenderer.prototype);

	/**
	 * Renders a carousel item.
	 *
	 * The data can be either a object of key-value pairs or an existing dom element to modify.
	 *
	 * Rendering an item can be asynchronous so a promise is returned.
	 *
	 * The data is an already existing DOMElement for HtmlRenderer.
	 *
	 * @method renderItem
	 * @param {Config} config Carousel configuration
	 * @param {number} index Item position index
	 * @param {object|DOMElement} element Item data object or existing dom element
	 * @return {Deferred.Promise}
	 */
	HtmlRenderer.prototype.renderItem = function(config, index, element) {
		var deferred = new Deferred();

		// html renderer is synchronous so resolve the promise immediately
		deferred.resolve(element);

		return deferred.promise();
	};

	/**
	 * Destroys a carousel item.
	 *
	 * @method destroyItem
	 * @param {number} index Item position index
	 */
	HtmlRenderer.prototype.destroyItem = function(index) {
		void(index);

		throw new Error('Not implemented');
	};

	return HtmlRenderer;
});