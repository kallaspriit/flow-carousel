define([
	'AbstractNavigator',
	'FlowCarousel'
], function(AbstractNavigator, FlowCarousel) {
	'use strict';

	var abstractNavigator = new AbstractNavigator();

	describe('AbstractAnimator', function () {

		it('has method "init"', function () {
			expect(abstractNavigator.init).toEqual(jasmine.any(Function));
		});

		it('calling "init" calls "_setup"', function () {
			var carousel = new FlowCarousel();

			spyOn(abstractNavigator, '_setup').and.callFake(function() {
				expect(abstractNavigator._setup).toHaveBeenCalled();
			});

			abstractNavigator.init(carousel);
		});

		it('calling "init" on abstract class will throw error', function () {
			var carousel = new FlowCarousel(),
				callInit = function() {
					abstractNavigator.init(carousel);
				};

			expect(callInit).toThrow();
		});
	});
});