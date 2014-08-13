define([
	'AbstractDataSource'
], function(AbstractDataSource) {
	'use strict';

	// using deferred implementation from jQuery
	var $ = window.jQuery,
		Deferred = $.Deferred;

	/**
	 * Data source interface.
	 *
	 * @class ArrayDataSource
	 * @extends AbstractDataSource
	 * @constructor
	 */
	function ArrayDataSource(data) {
		AbstractDataSource.call(this);

		this._data = data || [];
	}

	ArrayDataSource.prototype = Object.create(AbstractDataSource.prototype);

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	ArrayDataSource.prototype.getItemCount = function() {
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
	ArrayDataSource.prototype.getItems = function(startIndex, endIndex) {
		var deferred = new Deferred();

		startIndex = startIndex || 0;
		endIndex = endIndex || this._data.length;

		if (startIndex < 0) {
			throw new Error('Invalid negative start index "' + startIndex + '" requested');
		}

		if (endIndex > this._data.length) {
			throw new Error(
				'Too large end index "' + endIndex + '" requested, there are only ' + this._data.length + ' items'
			);
		}

		// resolve the deferred immediately as array data source is syncronous
		deferred.resolve(this._data.slice(startIndex, endIndex));

		return deferred.promise();
	};

	return ArrayDataSource;
});