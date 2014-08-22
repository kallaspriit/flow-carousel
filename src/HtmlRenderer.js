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
	 * Restores the initial contents of the carousel if possible.
	 *
	 * @method restoreInitialContents
	 * @param {AbstractDataSource} dataSource Data source to use
	 * @param {DOMElement} wrap Wrap to populate
	 */
	HtmlRenderer.prototype.restoreInitialContents = function(dataSource, wrap) {
		// fetch all items and append them to the wrap
		dataSource.getItems().done(function(items) {
			$(items).each(function(index, element) {
				var existingStyle = $(element).attr('style');

				// remove the added display: block
				if (typeof(existingStyle) === 'string') {
					$(element).attr('style', existingStyle.replace('display: block;', ''));
				}

				$(wrap).append(element);
			});
		});
	};

	return HtmlRenderer;
});