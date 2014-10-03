define([
], function() {
	'use strict';

	/**
	 * Data source interface.
	 *
	 * Datasources are used as source of items to render.
	 *
	 * @class AbstractDataSource
	 * @constructor
	 */
	function AbstractDataSource() {}

	/**
	 * Returns whether given data source is asynchronous or not.
	 *
	 * If the data source is asynchronous then placeholders are generated by default while the real data is loading.
	 *
	 * Defaults to false so make sure to override this in your async data sources.
	 *
	 * @method isAsynchronous
	 * @return {boolean}
	 */
	AbstractDataSource.prototype.isAsynchronous = function() {
		return false;
	};

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
	 * @return {Deferred.Promise}
	 */
	AbstractDataSource.prototype.getItems = function(startIndex, endIndex) {
		void(startIndex, endIndex);

		throw new Error('Not implemented');
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	AbstractDataSource.prototype.destroy = function() {
		// do nothing by default
	};

	return AbstractDataSource;
});