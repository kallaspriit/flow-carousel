define([
	'AbstractDataSource',
	'Deferred'
], function(AbstractDataSource, Deferred) {
	'use strict';

	/**
	 * Array based data source.
	 *
	 * @class ArrayDataSource
	 * @extends AbstractDataSource
	 * @constructor
	 */
	function ArrayDataSource(data) {
		AbstractDataSource.call(this);

		/**
		 * Data array.
		 *
		 * @property _data
		 * @type {array}
		 * @default []
		 * @private
		 */
		this._data = data || [];
	}

	ArrayDataSource.prototype = Object.create(AbstractDataSource.prototype);

	/**
	 * Sets new data to use.
	 *
	 * @method setData
	 * @param {array} data New data
	 */
	ArrayDataSource.prototype.setData = function(data) {
		this._data = data;
	};

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

		startIndex = typeof startIndex === 'number' ? startIndex : 0;
		endIndex = typeof endIndex === 'number' ? endIndex : this._data.length - 1;

		// validate index range
		if (startIndex < 0) {
			throw new Error('Invalid negative start index "' + startIndex + '" requested');
		} else if (endIndex > this._data.length - 1) {
			throw new Error(
				'Too large end index "' + endIndex + '" requested, there are only ' + this._data.length + ' items'
			);
		}

		// resolve the deferred immediately as array data source is syncronous
		deferred.resolve(this._data.slice(startIndex, endIndex + 1));

		return deferred.promise();
	};

	return ArrayDataSource;
});