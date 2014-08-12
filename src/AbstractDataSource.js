define([
], function() {
	'use strict';

	/**
	 * Data source interface.
	 *
	 * @class AbstractDataSource
	 * @constructor
	 */
	function AbstractDataSource() {}

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	AbstractDataSource.prototype.getItemCount = function() {
		throw new Error('Not implemented');
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
	 * @return {number}
	 */
	AbstractDataSource.prototype.getItems = function(startIndex, endIndex) {
		throw new Error('Not implemented');
	};

	return AbstractDataSource;
});