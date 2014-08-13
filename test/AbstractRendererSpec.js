define([
	'AbstractRenderer'
], function(AbstractRenderer) {
	'use strict';

	var abstractRenderer = new AbstractRenderer();

	describe('AbstractRenderer', function () {

		it('has method "renderItem"', function () {
			expect(abstractRenderer.renderItem).toEqual(jasmine.any(Function));
		});

		it('has method "destroyItem"', function () {
			expect(abstractRenderer.destroyItem).toEqual(jasmine.any(Function));
		});

		it('calling "renderItem" on abstract instance throws an error', function () {
			var call = function() {
				abstractRenderer.renderItem();
			};

			expect(call).toThrow();
		});

		it('calling "destroyItem" on abstract instance throws an error', function () {
			var call = function() {
				abstractRenderer.destroyItem();
			};

			expect(call).toThrow();
		});
	});
});