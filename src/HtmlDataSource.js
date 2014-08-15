define([
	'jquery',
	'AbstractDataSource',
	'Deferred'
], function($, AbstractDataSource, Deferred) {
	'use strict';

	/**
	 * Data source interface.
	 *
	 * @class HtmlDataSource
	 * @extends AbstractDataSource
	 * @constructor
	 */
	function HtmlDataSource(wrap) {
		AbstractDataSource.call(this);

		this._wrap = wrap;
		this._data = this._setupData(this._wrap);
	}

	HtmlDataSource.prototype = Object.create(AbstractDataSource.prototype);

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	HtmlDataSource.prototype.getItemCount = function() {
		return this._data.length;
	};

	/**
	 * Fetches given range of items from the dataset.
	 *
	 * This operation can be asynchronous and thus returns a promise that will be resolved once the data becomes
	 * available or rejected when an error occurs.
	 *
	 * By default the range is the entire dataset.
	 *
	 * Throws error if invalid range is requested.
	 *
	 * @method getItems
	 * @param {number} [startIndex=0] Range start index to fetch
	 * @param {number} [endIndex=length] Range end index to fetch
	 * @return {Deferred.Promise}
	 */
	HtmlDataSource.prototype.getItems = function(startIndex, endIndex) {
		var deferred = new Deferred();

		startIndex = startIndex || 0;
		endIndex = endIndex || this._data.length;

		// validate index range
		if (startIndex < 0) {
			throw new Error('Invalid negative start index "' + startIndex + '" requested');
		} else if (endIndex > this._data.length) {
			throw new Error(
				'Too large end index "' + endIndex + '" requested, there are only ' + this._data.length + ' items'
			);
		}

		// resolve the deferred immediately as array data source is syncronous
		deferred.resolve(this._data.slice(startIndex, endIndex));

		return deferred.promise();
	};

	/**
	 * Extracts the HTML item elements from the given wrap and uses them as data.
	 *
	 * @method _setupData
	 * @param {DOMElement} wrap Wrap to get items from
	 * @return {array}
	 */
	HtmlDataSource.prototype._setupData = function(wrap) {
		var elements = [];

		$(wrap).children().each(function(index, element) {
			elements.push(element);

			// detach the original element from the dom
			$(element).detach();
		});

		return elements;
	};

	return HtmlDataSource;
});