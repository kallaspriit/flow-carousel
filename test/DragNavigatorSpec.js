define([
	'DragNavigator',
	'FlowCarousel'
], function(DragNavigator, FlowCarousel) {
	'use strict';

	var carousel;

	describe('AbstractAnimator', function () {

		beforeEach(function() {
			// load test fixture
			var fixtureWrap = $('#fixture-wrap');

			if (fixtureWrap.length === 0) {
				fixtureWrap = $('<div></div>', {
					id: 'fixture-wrap',
					style: 'width: 1200px; height: 800px; background-color: #F8F8F8;'
				}).appendTo(document.body);
			}

			fixtureWrap.html(window.__html__['test/fixtures/test.html']);

			// create the carousel instance and initiate it
			carousel = new FlowCarousel();
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

		it('navigates to next page when dragged right', function (done) {
			carousel.init('.carousel');

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
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentPageIndex()).toEqual(1);

						done();
					}, 300);
				}, 300);
			}, 300);
		});

		it('navigates to next item when dragged right', function (done) {
			carousel.init('.carousel', {
				dragNavigatorMode: FlowCarousel.DragNavigator.Mode.NAVIGATE_ITEM
			});

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

			expect(carousel.getCurrentItemIndex()).toEqual(0);

			// trigger the events
			$scroller.trigger(mouseDown);

			// give it some time to change
			window.setTimeout(function() {
				$window.trigger(mouseMove);

				window.setTimeout(function () {
					$window.trigger(mouseUp);

					// give it some time to change
					window.setTimeout(function () {
						expect(carousel.getCurrentItemIndex()).toEqual(1);

						done();
					}, 300);
				}, 300);
			}, 300);
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
			$window.trigger(mouseMove);
			$window.trigger(mouseUp);

			// give it some time to change
			window.setTimeout(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(0);

				done();
			}, 300);
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
				moveBy = -100; // move right

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
			$window.trigger(mouseMove);
			$window.trigger(mouseUp);

			// give it some time to change
			window.setTimeout(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(0);

				done();
			}, 300);
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
				moveBy = -100; // move right

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

			// alrady start a animation
			carousel.navigateToPage(2);

			// trigger the events, should be ignored because it's already animating
			$scroller.trigger(mouseDown);
			$window.trigger(mouseMove);
			$window.trigger(mouseUp);

			// give it some time to change
			window.setTimeout(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(2);

				done();
			}, 300);
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
				moveByX = -100, // move right
				moveByY = -200; // move up more

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
			$window.trigger(mouseMove);
			$window.trigger(mouseUp);

			// give it some time to change
			window.setTimeout(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(0);

				done();
			}, 300);
		});
	});
});