define([
	'ArrayDataSource'
], function(ArrayDataSource) {
	'use strict';

	var emptyDataSource = new ArrayDataSource(),
		dataSource;

	// these tests don't create the data source before each run
	describe('ArrayDataSource', function () {

		it('accepts items in constructor', function () {
			var sourceData = [1,2,3,4];

			dataSource = new ArrayDataSource(sourceData);

			expect(dataSource.getItemCount()).toEqual(sourceData.length);
		});

		it('method "getItems" returns all items without parameters', function () {
			var sourceData = [1,2,3,4];

			dataSource = new ArrayDataSource(sourceData);

			expect(dataSource.getItems()).toEqual(sourceData);
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

		it('getItems return an empty array by default', function () {
			expect(emptyDataSource.getItems()).toEqual([]);
		});
	});
});