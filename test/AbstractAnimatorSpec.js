define([
	'AbstractAnimator'
], function(AbstractAnimator) {
	'use strict';

	var abstractAnimator = new AbstractAnimator(null);

	describe('AbstractAnimator', function () {

		it('has method "animateToIndex"', function () {
			expect(abstractAnimator.animateToIndex).toEqual(jasmine.any(Function));
		});

		it('calling "animateToIndex" on abstract instance throws an error', function () {
			var call = function() {
				abstractAnimator.animateToIndex();
			};

			expect(call).toThrow();
		});
	});
});