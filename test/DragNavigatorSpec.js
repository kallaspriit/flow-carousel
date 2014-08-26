define([
	'DragNavigator',
	'FlowCarousel'
], function(DragNavigator, FlowCarousel) {
	'use strict';

	var carousel;

	describe('DragNavigator', function () {

		// create the fixture and carousel instance
		beforeEach(function() {
			window.loadFixture('test.html');

			// create the carousel instance and initiate it
			carousel = new FlowCarousel();
		});

		// release it after
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

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.DRAG);

			expect(navigator).toEqual(jasmine.any(DragNavigator));
		});

		it('default mode is navigating pages', function () {
			carousel.init('.carousel');

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.DRAG);

			expect(navigator.getMode()).toEqual(DragNavigator.Mode.NAVIGATE_PAGE);
		});

		it('mode can be changed', function () {
			carousel.init('.carousel');

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.DRAG);

			navigator.setMode(DragNavigator.Mode.NAVIGATE_ITEM);

			expect(navigator.getMode()).toEqual(DragNavigator.Mode.NAVIGATE_ITEM);
		});

		it('requesting invalid mode throws error', function () {
			carousel.init('.carousel');

			var navigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.DRAG),
				setInvalidMode = function() {
					navigator.setMode('foobar');
				};

			expect(setInvalidMode).toThrow();
		});

		/*it('navigates to next page when dragged right', function (done) {
			carousel.init('.carousel').done(function() {
				var $window = $(window),
					$scroller = $(carousel.getScrollerWrap()),
					mouseDown = jQuery.Event('mousedown'),
					mouseMove = jQuery.Event('mousemove'),
					mouseUp = jQuery.Event('mouseup'),
					startPos = 100, // initial position
					moveBy = -100; // move right

				// set mouse down properties
				mouseDown.which = 1; // left mouse button
				mouseDown.pageX = startPos;
				mouseDown.pageY = 0;

				// set mouse move properties
				mouseMove.which = 1; // left mouse button
				mouseMove.pageX = startPos + moveBy;
				mouseMove.pageY = 0;

				// set mouse up properties
				mouseUp.which = 1; // left mouse button

				expect(carousel.getCurrentPageIndex()).toEqual(0);

				// trigger the events
				window.setTimeout(function () {
					$scroller.trigger(mouseDown);

					// give it some time to change
					window.setTimeout(function () {
						$window.trigger(mouseMove);

						window.setTimeout(function () {
							expect(carousel.isAnimating()).toEqual(false);

							$window.trigger(mouseUp);

							// give it some time to change
							window.setTimeout(function () {
								expect(carousel.getCurrentPageIndex()).toEqual(1);

								done();
							}, 2000);
						}, 2000);
					}, 10);
				}, 10);
			});
		});

		it('navigates to next item when dragged right', function (done) {
			carousel.init('.carousel', {
				dragNavigatorMode: FlowCarousel.DragNavigator.Mode.NAVIGATE_ITEM
			}).done(function() {
				var $window = $(window),
					$scroller = $(carousel.getScrollerWrap()),
					mouseDown = jQuery.Event('mousedown'),
					mouseMove = jQuery.Event('mousemove'),
					mouseUp = jQuery.Event('mouseup'),
					startPos = 100, // initial position
					moveBy = -200; // move right

				// set mouse down properties
				mouseDown.which = 1; // left mouse button
				mouseDown.pageX = startPos;
				mouseDown.pageY = 0;

				// set mouse move properties
				mouseMove.which = 1; // left mouse button
				mouseMove.pageX = startPos + moveBy;
				mouseMove.pageY = 0;

				// set mouse up properties
				mouseUp.which = 1; // left mouse button

				expect(carousel.getCurrentItemIndex()).toEqual(0);

				// trigger the events
				window.setTimeout(function () {
					$scroller.trigger(mouseDown);

					// give it some time to change
					window.setTimeout(function () {
						$window.trigger(mouseMove);

						window.setTimeout(function () {
							expect(carousel.isAnimating()).toEqual(false);

							$window.trigger(mouseUp);

							// give it some time to change
							window.setTimeout(function () {
								expect(carousel.getCurrentItemIndex()).toEqual(1);

								done();
							}, 2000);
						}, 2000);
					}, 10);
				}, 10);
			});
		});*/

		it('dragging by less then the dead threshold has no effect', function (done) {
			carousel.init('.carousel', {
				dragNavigatorMode: FlowCarousel.DragNavigator.Mode.NAVIGATE_ITEM
			});

			var $window = $(window),
				$scroller = $(carousel.getScrollerWrap()),
				mouseDown = jQuery.Event('mousedown'),
				mouseMove = jQuery.Event('mousemove'),
				mouseUp = jQuery.Event('mouseup'),
				startPos = 100, // initial position
				moveBy = -5; // move right very little

			// set mouse down properties
			mouseDown.which = 1; // left mouse button
			mouseDown.pageX = startPos;
			mouseDown.pageY = 0;

			// set mouse move properties
			mouseMove.which = 1; // left mouse button
			mouseMove.pageX = startPos + moveBy;
			mouseMove.pageY = 0;

			// set mouse up properties
			mouseUp.which = 1; // left mouse button

			expect(carousel.getCurrentItemIndex()).toEqual(0);

			// trigger the events
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					expect(carousel.isAnimating()).toEqual(false);

					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentItemIndex()).toEqual(0);

						done();
					}, 500);
				}, 50);
			}, 50);
		});

		it('dragging left from first page navigates back to first page', function (done) {
			carousel.init('.carousel');

			var $window = $(window),
				$scroller = $(carousel.getScrollerWrap()),
				mouseDown = jQuery.Event('mousedown'),
				mouseMove = jQuery.Event('mousemove'),
				mouseUp = jQuery.Event('mouseup'),
				mouseButton = 1, // left mouse button
				startPos = 100, // initial position
				moveBy = 100; // move left

			// set mouse down properties
			mouseDown.which = mouseButton; // left mouse button
			mouseDown.pageX = startPos;
			mouseDown.pageY = 0;

			// set mouse move properties
			mouseMove.which = mouseButton; // left mouse button
			mouseMove.pageX = startPos + moveBy;
			mouseMove.pageY = 0;

			// set mouse up properties
			mouseUp.which = mouseButton; // left mouse button

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			// trigger the events
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentPageIndex()).toEqual(0);

						done();
					}, 500);
				}, 50);
			}, 50);
		});

		it('other than left mouse button does not have effect', function (done) {
			carousel.init('.carousel');

			var $window = $(window),
				$scroller = $(carousel.getScrollerWrap()),
				mouseDown = jQuery.Event('mousedown'),
				mouseMove = jQuery.Event('mousemove'),
				mouseUp = jQuery.Event('mouseup'),
				mouseButton = 2, // not left mouse button
				startPos = 100, // initial position
				moveBy = -200; // move right

			// set mouse down properties
			mouseDown.which = mouseButton; // left mouse button
			mouseDown.pageX = startPos;
			mouseDown.pageY = 0;

			// set mouse move properties
			mouseMove.which = mouseButton; // left mouse button
			mouseMove.pageX = startPos + moveBy;
			mouseMove.pageY = 0;

			// set mouse up properties
			mouseUp.which = mouseButton; // left mouse button

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			// trigger the events
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentPageIndex()).toEqual(0);

						done();
					}, 500);
				}, 50);
			}, 50);
		});

		it('invalid mouse buttons have no effect', function (done) {
			carousel.init('.carousel');

			var $window = $(window),
				$scroller = $(carousel.getScrollerWrap()),
				mouseDown = jQuery.Event('mousedown'),
				mouseMove = jQuery.Event('mousemove'),
				mouseUp = jQuery.Event('mouseup'),
				startPos = 100, // initial position
				moveBy = -200; // move right

			// set mouse down properties
			mouseDown.which = 1; // left mouse button
			mouseDown.pageX = startPos;
			mouseDown.pageY = 0;

			// set mouse move properties
			mouseMove.which = 2; // right mouse button
			mouseMove.pageX = startPos + moveBy;
			mouseMove.pageY = 0;

			// set mouse up properties
			mouseUp.which = 3; // center mouse button

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			// trigger the events
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentPageIndex()).toEqual(0);

						done();
					}, 500);
				}, 50);
			}, 50);
		});

		it('navigation is ignored if the carousel is already animating', function (done) {
			carousel.init('.carousel');

			var $window = $(window),
				$scroller = $(carousel.getScrollerWrap()),
				mouseDown = jQuery.Event('mousedown'),
				mouseMove = jQuery.Event('mousemove'),
				mouseUp = jQuery.Event('mouseup'),
				mouseButton = 1, // left mouse button
				startPos = 100, // initial position
				moveBy = -200; // move right

			// set mouse down properties
			mouseDown.which = mouseButton; // left mouse button
			mouseDown.pageX = startPos;
			mouseDown.pageY = 0;

			// set mouse move properties
			mouseMove.which = mouseButton; // left mouse button
			mouseMove.pageX = startPos + moveBy;
			mouseMove.pageY = 0;

			// set mouse up properties
			mouseUp.which = mouseButton; // left mouse button

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			// already start a animation
			carousel.navigateToPage(2);

			// trigger the events
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentPageIndex()).toEqual(2);

						done();
					}, 500);
				}, 50);
			}, 50);
		});

		it('dragging more in the opposite direction cancels the drag', function (done) {
			carousel.init('.carousel');

			var $window = $(window),
				$scroller = $(carousel.getScrollerWrap()),
				mouseDown = jQuery.Event('mousedown'),
				mouseMove = jQuery.Event('mousemove'),
				mouseUp = jQuery.Event('mouseup'),
				startPosX = 100, // initial position
				startPosY = 100, // initial position
				moveByX = -200, // move right
				moveByY = -400; // move up more

			// set mouse down properties
			mouseDown.which = 1; // left mouse button
			mouseDown.pageX = startPosX;
			mouseDown.pageY = startPosY;

			// set mouse move properties
			mouseMove.which = 1; // left mouse button
			mouseMove.pageX = startPosX + moveByX;
			mouseMove.pageY = startPosY + moveByY;

			// set mouse up properties
			mouseUp.which = 1; // left mouse button
			mouseUp.pageX = startPosX + moveByX;
			mouseUp.pageY = startPosY + moveByY;

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			// trigger the events
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentPageIndex()).toEqual(0);

						done();
					}, 500);
				}, 50);
			}, 50);
		});
	});
});