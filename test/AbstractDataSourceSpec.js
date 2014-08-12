define([
	'AbstractDataSource'
], function(AbstractDataSource) {
	'use strict';

	var abstractDataSource = new AbstractDataSource();

	describe('AbstractDataSource', function () {

		it('has method "getItemCount"', function () {
			expect(abstractDataSource.getItemCount).toEqual(jasmine.any(Function));
		});

		it('has method "getItems"', function () {
			expect(abstractDataSource.getItems).toEqual(jasmine.any(Function));
		});

		it('calling "getItemCount" on abstract instance throws an error', function () {
			var call = function() {
				abstractDataSource.getItemCount();
			};

			expect(call).toThrow();
		});

		it('calling "getItems" on abstract instance throws an error', function () {
			var call = function() {
				abstractDataSource.getItems();
			};

			expect(call).toThrow();
		});
	});
});