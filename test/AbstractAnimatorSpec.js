define([
	'AbstractAnimator'
], function(AbstractAnimator) {
	'use strict';

	var abstractAnimator = new AbstractAnimator(null);

	describe('AbstractAnimator', function () {

		it('has method "getCurrentPosition"', function () {
			expect(abstractAnimator.getCurrentPosition).toEqual(jasmine.any(Function));
		});

		it('has method "animateToItem"', function () {
			expect(abstractAnimator.animateToItem).toEqual(jasmine.any(Function));
		});

		it('has method "animateToPosition"', function () {
			expect(abstractAnimator.animateToPosition).toEqual(jasmine.any(Function));
		});

		it('calling "getCurrentPosition" on abstract instance throws an error', function () {
			var call = function() {
				abstractAnimator.getCurrentPosition();
			};

			expect(call).toThrow();
		});

		it('calling "animateToItem" on abstract instance throws an error', function () {
			var call = function() {
				abstractAnimator.animateToItem();
			};

			expect(call).toThrow();
		});

		it('calling "animateToPosition" on abstract instance throws an error', function () {
			var call = function() {
				abstractAnimator.animateToPosition();
			};

			expect(call).toThrow();
		});
	});
});