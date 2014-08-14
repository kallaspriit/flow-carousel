define([
	'AbstractAnimator'
], function(AbstractAnimator) {
	'use strict';

	var abstractAnimator = new AbstractAnimator(null);

	describe('AbstractAnimator', function () {

		it('has method "animateToItem"', function () {
			expect(abstractAnimator.animateToItem).toEqual(jasmine.any(Function));
		});

		it('calling "animateToItem" on abstract instance throws an error', function () {
			var call = function() {
				abstractAnimator.animateToItem();
			};

			expect(call).toThrow();
		});
	});
});