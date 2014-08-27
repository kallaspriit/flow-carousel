define([
	'ArrayDataSource'
], function(ArrayDataSource) {
	'use strict';

	var emptyDataSource = new ArrayDataSource(),
		dataSource;

	// these tests don't create the data source before each run
	describe('ArrayDataSource', function () {

		it('accepts items in constructor', function () {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			expect(dataSource.getItemCount()).toEqual(sourceData.length);
		});

		it('method "getItems" returns all items without parameters', function (done) {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			dataSource.getItems().done(function(items) {
				expect(items).toEqual(sourceData);

				done();
			});
		});

		it('method "getItems" returns requested range of items', function (done) {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			dataSource.getItems(1, 1).done(function(items) {
				expect(items).toEqual([2]);

				done();
			});
		});

		it('method "getItems" returns requested range of items', function (done) {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			dataSource.getItems(0, 0).done(function(items) {
				expect(items).toEqual([1]);

				done();
			});
		});

		it('method "getItems" returns requested range of items', function (done) {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			dataSource.getItems(0, 2).done(function(items) {
				expect(items).toEqual([1, 2, 3]);

				done();
			});
		});

		it('method "getItems" returns requested range of items', function (done) {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			dataSource.getItems(1, 3).done(function(items) {
				expect(items).toEqual([2, 3, 4]);

				done();
			});
		});

		it('method "getItems" throws error if requesting negative range', function () {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			var requestInvalidRange = function() {
				dataSource.getItems(-2, 2);
			};

			expect(requestInvalidRange).toThrow();
		});

		it('method "getItems" throws error if requesting range past data length', function () {
			var sourceData = [1, 2, 3, 4];

			dataSource = new ArrayDataSource(sourceData);

			var requestInvalidRange = function() {
				dataSource.getItems(0, 10);
			};

			expect(requestInvalidRange).toThrow();
		});
	});

	// these tests create the data source before each run
	describe('ArrayDataSource', function () {

		// create the data source before each run
		beforeEach(function() {
			dataSource = new ArrayDataSource();
		});

		// release it after
		afterEach(function() {
			dataSource = null;
		});

		/*it('is an instance of AbstractDataSource', function () {
			expect(ArrayDataSource).toEqual(jasmine.any(AbstractDataSource));
		});*/

		it('has method "getItemCount"', function () {
			expect(emptyDataSource.getItemCount).toEqual(jasmine.any(Function));
		});

		it('has method "getItems"', function () {
			expect(emptyDataSource.getItems).toEqual(jasmine.any(Function));
		});

		it('has default item count of zero', function () {
			expect(emptyDataSource.getItemCount()).toEqual(0);
		});

		it('"getItems()" return an empty array by default', function (done) {
			dataSource.getItems().done(function(items) {
				expect(items).toEqual([]);

				done();
			});
		});

		it('items can be set using "setData()"', function (done) {
			var newData = [1, 2, 3, 4];

			expect(dataSource.getItemCount()).toEqual(0);

			dataSource.setData(newData);

			dataSource.getItems().done(function(items) {
				expect(items).toEqual(newData);

				done();
			});
		});
	});
});