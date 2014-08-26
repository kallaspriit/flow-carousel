define([
	'KeyboardNavigator',
	'FlowCarousel'
], function(KeyboardNavigator, FlowCarousel) {
	'use strict';

	var carousel;

	describe('KeyboardNavigator', function () {

		// create the fixture and carousel instance
		beforeEach(function() {
			window.loadFixture('test.html');

			// create the carousel instance and initiate it
			carousel = new FlowCarousel();
		});

		// release the carousel after testing
		afterEach(function() {
			// kill the carousel if it's still alive
			if (carousel !== null && carousel.isInitiated() && !carousel.isDestroyed()) {
				carousel.destroy();
			}

			carousel = null;

			$('#fixture-wrap').html('<em>test completed</em>');
		});

		it('is loaded by default', function () {
			carousel.init('.carousel');

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.KEYBOARD);

			expect(navigator).toEqual(jasmine.any(KeyboardNavigator));
		});

		it('default mode is navigating pages', function () {
			carousel.init('.carousel');

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.KEYBOARD);

			expect(navigator.getMode()).toEqual(KeyboardNavigator.Mode.NAVIGATE_PAGE);
		});

		it('mode can be changed', function () {
			carousel.init('.carousel');

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.KEYBOARD);

			navigator.setMode(KeyboardNavigator.Mode.NAVIGATE_ITEM);

			expect(navigator.getMode()).toEqual(KeyboardNavigator.Mode.NAVIGATE_ITEM);
		});

		it('requesting invalid mode throws error', function () {
			carousel.init('.carousel');

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.KEYBOARD),
				setInvalidMode = function() {
					navigator.setMode('foobar');
				};

			expect(setInvalidMode).toThrow();
		});

		it('navigates to next page on right arrow', function (done) {
			carousel.init('.carousel');

			var $mainWrap = $(carousel.getMainWrap()),
				$window = $(window),
				keyDownEvent = jQuery.Event('keydown');

			keyDownEvent.keyCode = 39; // right arrow

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			$mainWrap.trigger('mouseenter');
			$window.trigger(keyDownEvent);

			window.setTimeout(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(1);

				$mainWrap.trigger('mouseleave');

				done();
			}, 500);
		});

		it('navigates to previous page on left arrow', function (done) {
			carousel.init('.carousel');

			var $mainWrap = $(carousel.getMainWrap()),
				$window = $(window),
				keyDownEvent = jQuery.Event('keydown');

			keyDownEvent.keyCode = 37; // left arrow

			carousel.navigateToPage(1).done(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(1);

				$mainWrap.trigger('mouseenter');
				$window.trigger(keyDownEvent);

				window.setTimeout(function () {
					expect(carousel.getCurrentPageIndex()).toEqual(0);

					$mainWrap.trigger('mouseleave');

					done();
				}, 500);
			});
		});

		it('navigates to next page on down arrow for vertical carousel', function (done) {
			$('.carousel').removeClass('carousel-horizontal').addClass('carousel-vertical');

			carousel.init('.carousel', {
				orientation: FlowCarousel.Config.Orientation.VERTICAL
			});

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.KEYBOARD),
				$mainWrap = $(carousel.getMainWrap()),
				$window = $(window),
				keyDownEvent = jQuery.Event('keydown');

			navigator.setMode(KeyboardNavigator.Mode.NAVIGATE_ITEM);

			keyDownEvent.keyCode = 40; // down arrow

			expect(carousel.getCurrentItemIndex()).toEqual(0);

			$mainWrap.trigger('mouseenter');
			$window.trigger(keyDownEvent);

			window.setTimeout(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(1);

				$mainWrap.trigger('mouseleave');

				done();
			}, 500);
		});

		it('navigates to previous page on up arrow for vertical carousel', function (done) {
			$('.carousel').removeClass('carousel-horizontal').addClass('carousel-vertical');

			carousel.init('.carousel', {
				orientation: FlowCarousel.Config.Orientation.VERTICAL
			});

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.KEYBOARD),
				$mainWrap = $(carousel.getMainWrap()),
				$window = $(window),
				keyDownEvent = jQuery.Event('keydown');

			navigator.setMode(KeyboardNavigator.Mode.NAVIGATE_ITEM);

			keyDownEvent.keyCode = 38; // up arrow

			carousel.navigateToItem(1).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(1);

				$mainWrap.trigger('mouseenter');
				$window.trigger(keyDownEvent);

				window.setTimeout(function () {
					expect(carousel.getCurrentItemIndex()).toEqual(0);

					$mainWrap.trigger('mouseleave');

					done();
				}, 500);
			});
		});

		it('navigation only works when the mouse is over main wrap', function (done) {
			carousel.init('.carousel');

			var $window = $(window),
				keyDownEvent = jQuery.Event('keydown');

			keyDownEvent.keyCode = 39; // right arrow

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			//$mainWrap.trigger('mouseenter');
			$window.trigger(keyDownEvent);

			window.setTimeout(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(0);

				//$mainWrap.trigger('mouseleave');

				done();
			}, 500);
		});

		it('non-arrow keys are not handled', function (done) {
			carousel.init('.carousel');

			var $mainWrap = $(carousel.getMainWrap()),
				$window = $(window),
				keyDownEvent = jQuery.Event('keydown');

			keyDownEvent.keyCode = 13; // non-arrow key

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			$mainWrap.trigger('mouseenter');
			$window.trigger(keyDownEvent);

			window.setTimeout(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(0);

				$mainWrap.trigger('mouseleave');

				done();
			}, 500);
		});
	});
});