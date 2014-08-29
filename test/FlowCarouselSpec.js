define([
	'FlowCarousel',
	'Config',
	'AbstractDataSource',
	'ArrayDataSource',
	'HtmlDataSource',
	'AbstractAnimator',
	'DefaultAnimator',
	'AbstractRenderer',
	'AbstractNavigator',
	'KeyboardNavigator',
	'Deferred'
], function(
	FlowCarousel,
	Config,
	AbstractDataSource,
	ArrayDataSource,
	HtmlDataSource,
	AbstractAnimator,
	DefaultAnimator,
	AbstractRenderer,
	AbstractNavigator,
	KeyboardNavigator,
	Deferred
) {
	'use strict';

	// dummy custom data source
	function CustomDataSource(items) {
		AbstractDataSource.call(this);

		var itemCount = typeof items === 'number' ? items : 1000,
			i;

		this._data = [];

		for (i = 0; i < itemCount; i++) {
			this._data.push(i);
		}
	}

	CustomDataSource.prototype = Object.create(AbstractDataSource.prototype);

	CustomDataSource.prototype.getItemCount = function() {
		return this._data.length;
	};

	CustomDataSource.prototype.isAsynchronous = function() {
		return true;
	};

	CustomDataSource.prototype.getItems = function(startIndex, endIndex) {
		var deferred = new Deferred(),
			requestDuration = 1000; // fixed duration for better stability

		// fake asyncronous request that takes some time to complete
		window.setTimeout(function() {
			deferred.resolve(this._data.slice(startIndex, endIndex + 1));
		}.bind(this), requestDuration);

		return deferred.promise();
	};

	// dummy custom renderer
	function CustomRenderer() {
		AbstractRenderer.call(this);
	}

	CustomRenderer.prototype = Object.create(AbstractRenderer.prototype);

	CustomRenderer.prototype.renderItem = function(config, index, data) {
		var deferred = new Deferred();

		deferred.resolve($('<div class="carousel-item">test #' + data + '</div>'));

		return deferred.promise();
	};

	/*CustomRenderer.prototype.renderPlaceholder = function(config, index) {
		return $('<div>loading #' + index + '...</div>')[0];
	};*/

	describe('FlowCarousel', function () {
		var defaultConfig = new Config(),
			carousel;

		// create the carousel before each run
		beforeEach(function() {
			window.loadFixture('test.html');

			// create the carousel instance
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

		it('exists', function () {
			expect(FlowCarousel).toEqual(jasmine.any(Function));
		});

		it('can be instantiated', function () {
			expect(carousel).toEqual(jasmine.any(FlowCarousel));
		});

		it('has version number', function () {
			expect(carousel.version).toEqual(jasmine.any(String));
		});

		it('data is null before initialization', function () {
			expect(carousel.getDataSource()).toEqual(null);
		});

		it('data is html data source after initialization with defaults', function () {
			carousel.init('.carousel');

			expect(carousel.getDataSource()).toEqual(jasmine.any(HtmlDataSource));
		});

		it('can be initiated at given start position', function (done) {
			var startIndex = 5;

			carousel.init('.carousel', {
				startItemIndex: startIndex
			}).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(startIndex);

				done();
			});
		});

		it('can be initiated at given start position with animation', function (done) {
			var startIndex = 5;

			carousel.init('.carousel', {
				startItemIndex: startIndex,
				animateToStartIndex: true
			}).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(startIndex);

				done();
			});
		});

		it('can be initiated at given start page', function (done) {
			var startPage = 2;

			carousel.init('.carousel', {
				startPageIndex: startPage
			}).done(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(startPage);

				done();
			});
		});

		it('setting both start item and page indexes throws error', function () {
			var setConflictingStartIndexes = function() {
				carousel.init('.carousel', {
					startItemIndex: 1,
					startPageIndex: 1
				});
			};

			expect(setConflictingStartIndexes).toThrow();
		});

		it('init works without providing user config', function () {
			var callInitWithoutConfig = function() {
				carousel.init('.carousel');
			};

			expect(callInitWithoutConfig).not.toThrow();
		});

		it('init throws error if a selector is used that does not match anything', function () {
			var callInitWithInvalidSelector = function() {
				carousel.init('.foobar');
			};

			expect(callInitWithInvalidSelector).toThrow();
		});

		it('init throws error requesting invalid size mode', function () {
			var callInitWithInvalidSizeMode = function() {
				carousel.init('.carousel', {
					sizeMode: 'foobar'
				});
			};

			expect(callInitWithInvalidSizeMode).toThrow();
		});

		it('init throws error if a selector is used that matches more than one element', function () {
			// create another carousel element
			var clone = $('.carousel').clone();

			$('.carousel').parent().append(clone);

			var callInitWithSelectorMatchingMultipleElements = function() {
				carousel.init('.carousel');
			};

			expect(callInitWithSelectorMatchingMultipleElements).toThrow();
		});

		it('calling init without selector throws error', function () {
			var callInitWithoutSelector = function() {
				carousel.init();
			};

			expect(callInitWithoutSelector).toThrow();
		});

		it('calling init with invalid selector type throws error', function () {
			var callInitWithoutSelector = function() {
				carousel.init(5);
			};

			expect(callInitWithoutSelector).toThrow();
		});

		it('uses default config by default', function () {
			expect(carousel.getConfig().itemsPerPage).toEqual(defaultConfig.itemsPerPage);
		});

		it('configuration can be changed directly', function () {
			var newItemsPerPage = 100;

			expect(carousel.getConfig().itemsPerPage).toEqual(defaultConfig.itemsPerPage);

			carousel.getConfig().itemsPerPage = newItemsPerPage;

			expect(carousel.getConfig().itemsPerPage).toEqual(newItemsPerPage);
		});

		it('can be initiated with user config', function () {
			var newItemsPerPage = 100;

			expect(carousel.getConfig().itemsPerPage).toEqual(defaultConfig.itemsPerPage);

			carousel.init('.carousel', {
				itemsPerPage: newItemsPerPage
			});

			expect(carousel.getConfig().itemsPerPage).toEqual(newItemsPerPage);
		});

		it('can be initiated with a custom animator', function () {
			var animator = new DefaultAnimator(carousel);

			carousel.init('.carousel', {
				animator: animator
			});

			expect(carousel.getAnimator()).toEqual(animator);
		});

		it('initiating with invalid animator throws error', function () {
			var animator = {},
				initiateWithInvalidAnimator = function() {
					carousel.init('.carousel', {
						animator: animator
					});
				};

			expect(initiateWithInvalidAnimator).toThrow();
		});

		it('initiating with invalid navigator throws error', function () {
			var initiateWithInvalidNavigator = function() {
					carousel.init('.carousel', {
						navigators: [FlowCarousel.Config.Navigator.KEYBOARD, 'foobar']
					});
				};

			expect(initiateWithInvalidNavigator).toThrow();
		});

		it('can be initiated with array data', function (done) {
			var data = [1, 2, 3, 4],
				customRenderer = new CustomRenderer();

			carousel.init('.carousel', {
				dataSource: data,
				renderer: customRenderer
			});

			expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));
			expect(carousel.getDataSource()).toEqual(jasmine.any(ArrayDataSource));

			carousel.getDataSource().getItems().done(function(items) {
				expect(items).toEqual(data);

				done();
			});
		});

		it('throws error if provided data is of wrong type', function () {
			var initiatedWithWrongData = function() {
				carousel.init('.carousel', {
					dataSource: 'foobar'
				});
			};

			expect(initiatedWithWrongData).toThrow();
		});

		it('throws error when setting invalid data source', function () {
			var setWrongDataSource = function() {
				carousel.setDataSource('foobar');
			};

			expect(setWrongDataSource).toThrow();
		});

		it('throws error when setting invalid renderer', function () {
			var setWrongRenderer = function() {
				carousel.setRenderer('foobar');
			};

			expect(setWrongRenderer).toThrow();
		});

		it('"init" accepts custom data sources and returns promise resolved once rendered', function (done) {
			var customDataSource = new CustomDataSource(),
				customRenderer = new CustomRenderer();

			carousel.init('.carousel', {
				dataSource: customDataSource,
				renderer: customRenderer
			}).done(function() {
				expect(carousel.getDataSource()).toEqual(jasmine.any(CustomDataSource));
				expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));

				done();
			});
		});

		it('navigating empty carousel resolves immediately', function (done) {
			var customDataSource = new CustomDataSource(0),
				customRenderer = new CustomRenderer();

			carousel.init('.carousel', {
				dataSource: customDataSource,
				renderer: customRenderer
			}).done(function() {
				expect(carousel.getCurrentPageVisibleItemElements()).toEqual([]);
				expect(carousel.getItemCount()).toEqual(0);
				expect(carousel.getItemElementByIndex(0)).toEqual(null);

				carousel.navigateToItem(0).done(function() {
					expect(carousel.getCurrentItemIndex()).toEqual(0);

					done();
				});
			});
		});

		// for some reason this blows up Karma..
		it('emits "INITIATING" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.INITIATING, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				expect(called).toEqual(true);

				done();
			});
		});

		it('emits "INITIATED" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.INITIATED, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				expect(called).toEqual(true);

				done();
			});
		});

		it('emits STARTUP_ITEMS_RENDERED event', function (done) {
			var customDataSource = new CustomDataSource(),
				customRenderer = new CustomRenderer(),
				called = false;

			carousel.on(FlowCarousel.Event.STARTUP_ITEMS_RENDERED, function() {
				called = true;
			});

			carousel.init('.carousel', {
				dataSource: customDataSource,
				renderer: customRenderer
			}).done(function() {
				expect(called).toEqual(true);

				done();
			});
		});

		it('emits "LOADING_ITEMS" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.LOADING_ITEMS, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				expect(called).toEqual(true);

				done();
			});
		});

		it('emits "LOADED_ITEMS" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.LOADED_ITEMS, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				expect(called).toEqual(true);

				done();
			});
		});

		it('emits "ABORTED_ITEMS" event', function (done) {
			var customDataSource = new CustomDataSource(),
				customRenderer = new CustomRenderer(),
				called = false;

			carousel.on(FlowCarousel.Event.ABORTED_ITEMS, function() {
				called = true;
			});

			carousel.init('.carousel', {
				dataSource: customDataSource,
				renderer: customRenderer
			}).done(function() {
				carousel.navigateToPage(1).done(function() {
					carousel.navigateToPage(3);
					carousel.navigateToPage(2).done(function() {
						carousel.navigateToPage(3).done(function() {
							carousel.navigateToPage(0).done(function() {
								window.setTimeout(function() {
									expect(called).toEqual(true);

									done();
								}, 1000);
							});
						});
					});
				});
			});
		});

		it('emits "NAVIGATING_TO_ITEM" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.NAVIGATING_TO_ITEM, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				carousel.navigateToItem(1).done(function() {
					expect(called).toEqual(true);

					done();
				});
			});
		});

		it('emits "NAVIGATED_TO_ITEM" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.NAVIGATED_TO_ITEM, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				carousel.navigateToItem(1).done(function() {
					expect(called).toEqual(true);

					done();
				});
			});
		});

		it('emits "NAVIGATING_TO_PAGE" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.NAVIGATING_TO_PAGE, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				carousel.navigateToPage(1).done(function() {
					expect(called).toEqual(true);

					done();
				});
			});
		});

		it('emits "NAVIGATED_TO_PAGE" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.NAVIGATED_TO_PAGE, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				carousel.navigateToPage(1).done(function() {
					expect(called).toEqual(true);

					done();
				});
			});
		});

		it('emits "LAYOUT_CHANGED" event', function (done) {
			var called = false;

			carousel.on(FlowCarousel.Event.LAYOUT_CHANGED, function() {
				called = true;
			});

			carousel.init('.carousel').done(function() {
				expect(called).toEqual(true);

				done();
			});
		});

		it('renders placeholders for async custom data source', function (done) {
			var customDataSource = new CustomDataSource(),
				customRenderer = new CustomRenderer();

			carousel.init('.carousel', {
				dataSource: customDataSource,
				renderer: customRenderer
			}).done(function() {

				// try to get the out of range condition
				carousel.navigateToNextPage().done(function() {
					expect(carousel.getCurrentPageIndex()).toEqual(1);
					expect($('.flow-carousel-placeholder').length > 0).toEqual(true);

					carousel.navigateToPreviousPage().done(function() {
						expect(carousel.getCurrentPageIndex()).toEqual(0);
						expect($('.flow-carousel-placeholder').length).toEqual(0);

						done();
					});
				});
			});
		});

		it('using custom data source without a custom renderer throws error', function () {
			var customDataSource = new CustomDataSource(),
				initWithoutRenderer = function() {
					carousel.init('.carousel', {
						dataSource: customDataSource
					});
				};

			expect(initWithoutRenderer).toThrow();
		});

		it('using array data source without a custom renderer throws error', function () {
			var initWithoutRenderer = function() {
					carousel.init('.carousel', {
						dataSource: [1, 2, 3]
					});
				};

			expect(initWithoutRenderer).toThrow();
		});

		it('accepts custom data source and renderer through setters', function (done) {
			var customDataSource = new CustomDataSource(),
				customRenderer = new CustomRenderer();

			carousel.setDataSource(customDataSource);
			carousel.setRenderer(customRenderer);

			carousel.init('.carousel').done(function() {
				expect(carousel.getDataSource()).toEqual(jasmine.any(CustomDataSource));
				expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));

				done();
			});
		});

		it('html data source throws error if requesting negative item range', function () {
			carousel.init('.carousel');

			var requestInvalidItemRange = function() {
				carousel.getDataSource().getItems(-1, 5);
			};

			expect(requestInvalidItemRange).toThrow();
		});

		it('html data source throws error if requesting too large item range', function () {
			carousel.init('.carousel');

			var requestInvalidItemRange = function() {
				carousel.getDataSource().getItems(0, 1000);
			};

			expect(requestInvalidItemRange).toThrow();
		});

		it('fixtures work', function() {
			expect(typeof window.__html__).toEqual('object');

			expect($('.carousel').length).toEqual(1);
		});

		it('renders carousel with default settings', function() {
			carousel.init('.carousel');

			expect($('.flow-carousel-wrap').length).toEqual(1);
		});

		it('renders carousel vertically', function() {
			$('.carousel').removeClass('carousel-horizontal').addClass('carousel-vertical');

			carousel.init('.carousel', {
				orientation: FlowCarousel.Config.Orientation.VERTICAL
			});

			expect($('.flow-carousel-wrap').length).toEqual(1);
			expect($('.flow-carousel-wrap').hasClass('flow-carousel-vertical')).toEqual(true);
		});

		it('requesting invalid orientation throws error', function() {
			var requestInvalidOrientation = function() {
				carousel.init('.carousel', {
					orientation: 'foobar'
				});
			};

			expect(requestInvalidOrientation).toThrow();
		});

		/*it('changing window size triggers responsive layout', function(done) {
			spyOn(carousel, '_reLayout').and.callFake(function() {
				expect(carousel._reLayout).toHaveBeenCalled();

				done();
			});

			carousel.init('.carousel');

			// first change
			window.setTimeout(function() {
				$('.carousel').css('width', '400px');
			}, 100);

			// give it some time to change
			window.setTimeout(function() {
				$(window).trigger('resize');
			}, 200);
		});*/

		it('calling redraw triggers re-layout', function(done) {
			spyOn(carousel, '_reLayout').and.callThrough();

			carousel.init('.carousel').done(function() {
				carousel.redraw().done(function() {
					expect(carousel._reLayout).toHaveBeenCalled();

					done();
				});
			});
		});

		// TODO improve the resize test
		it('window resize triggers re-layout', function(done) {
			var relayoutScheduled;
			//spyOn(carousel, '_reLayout').and.callThrough();

			carousel.init('.carousel').done(function() {
				$('.carousel').width('300px');

				//$(window).trigger('resize');
				relayoutScheduled = carousel._validateResponsiveLayout();

				window.setTimeout(function() {
					//expect(carousel._reLayout).toHaveBeenCalled();
					expect(relayoutScheduled).toEqual(true);

					done();
				}, 1000);
			});
		});

		it('several window resizes only apply once after a delay', function(done) {
			var relayoutScheduled,
				relayoutScheduled2;
			//spyOn(carousel, '_reLayout').and.callThrough();

			carousel.init('.carousel').done(function() {
				$('.carousel').width('300px');

				//$(window).trigger('resize');
				relayoutScheduled = carousel._validateResponsiveLayout();

				$('.carousel').width('200px');

				relayoutScheduled2 = carousel._validateResponsiveLayout();

				window.setTimeout(function() {
					//expect(carousel._reLayout).toHaveBeenCalled();
					expect(relayoutScheduled).toEqual(true);
					expect(relayoutScheduled2).toEqual(true);

					done();
				}, 1000);
			});
		});

		it('relayout is not triggered by responsive check if the size has not changed', function(done) {
			var relayoutScheduled;
			//spyOn(carousel, '_reLayout').and.callThrough();

			carousel.init('.carousel').done(function() {
				//$(window).trigger('resize');
				relayoutScheduled = carousel._validateResponsiveLayout();

				window.setTimeout(function() {
					//expect(carousel._reLayout).toHaveBeenCalled();
					expect(relayoutScheduled).toEqual(false);

					done();
				}, 1000);
			});
		});

		it('responsive layout validation is ignored if already animating', function(done) {
			var relayoutScheduled;
			//spyOn(carousel, '_reLayout').and.callThrough();

			carousel.init('.carousel').done(function() {
				carousel.navigateToPage(1);

				$('.carousel').width('300px');

				//$(window).trigger('resize');
				relayoutScheduled = carousel._validateResponsiveLayout();

				window.setTimeout(function() {
					//expect(carousel._reLayout).toHaveBeenCalled();
					expect(relayoutScheduled).toEqual(false);

					done();
				}, 1000);
			});
		});

		it('supports navigating to next item', function(done) {
			carousel.init('.carousel');

			var currentIndex = carousel.getCurrentItemIndex();

			carousel.navigateToNextItem().done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(currentIndex + 1);

				done();
			});
		});

		it('supports navigating to previous item', function(done) {
			carousel.init('.carousel');

			var startIndex = 5;

			carousel.navigateToItem(startIndex).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(startIndex);

				carousel.navigateToPreviousItem().done(function() {
					expect(carousel.getCurrentItemIndex()).toEqual(startIndex - 1);

					done();
				});
			});
		});

		it('navigating before first item shows limit', function(done) {
			carousel.init('.carousel');

			spyOn(carousel, '_showLimit').and.callThrough();

			carousel.navigateToItem(0).done(function() {
				expect(carousel._showLimit).toHaveBeenCalled();

				done();
			});
		});

		it('navigating before first page shows limit', function(done) {
			carousel.init('.carousel');

			spyOn(carousel, '_showLimit').and.callThrough();

			carousel.navigateToPreviousPage().done(function() {
				expect(carousel._showLimit).toHaveBeenCalled();

				done();
			});
		});

		it('hitting the limit before last animation has ended is ignored', function(done) {
			carousel.init('.carousel');

			spyOn(carousel, '_showLimit').and.callThrough();

			carousel.navigateToPreviousPage();
			carousel.navigateToPreviousPage().done(function() {
				expect(carousel._showLimit).toHaveBeenCalled();

				done();
			});
		});

		it('navigating past last item shows limit', function(done) {
			carousel.init('.carousel');

			spyOn(carousel, '_showLimit').and.callThrough();

			carousel.navigateToPage(carousel.getPageCount() - 1).done(function() {
				carousel.navigateToNextItem().done(function () {
					expect(carousel._showLimit).toHaveBeenCalled();

					done();
				});
			});
		});

		it('navigating to the same middle element is ignored', function(done) {
			carousel.init('.carousel');

			carousel.navigateToItem(3).done(function() {
				carousel.navigateToItem(3).done(function () {
					done();
				});
			});
		});

		it('navigating to the same middle page is ignored', function(done) {
			carousel.init('.carousel');

			carousel.navigateToPage(1).done(function() {
				carousel.navigateToPage(1).done(function () {
					done();
				});
			});
		});

		it('instant navigation can follow normal one', function(done) {
			carousel.init('.carousel');

			var startIndex = 5;

			carousel.navigateToItem(startIndex).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(startIndex);

				carousel.navigateToPreviousItem(true).done(function() {
					expect(carousel.getCurrentItemIndex()).toEqual(startIndex - 1);

					done();
				});
			});
		});

		it('supports navigating to next page', function(done) {
			carousel.init('.carousel');

			var currentIndex = carousel.getCurrentPageIndex();

			carousel.navigateToNextPage().done(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(currentIndex + 1);

				done();
			});
		});

		it('supports navigating to previous page', function(done) {
			carousel.init('.carousel');

			var startIndex = 2;

			carousel.navigateToPage(startIndex).done(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(startIndex);

				carousel.navigateToPreviousPage().done(function() {
					expect(carousel.getCurrentPageIndex()).toEqual(startIndex - 1);

					done();
				});
			});
		});

		it('calling "_getElementSize" with invalid orientation throws error', function() {
			carousel.init('.carousel');

			var requestInvalidOrientation = function() {
				carousel._getElementSize(carousel._$wrap, 'foobar');
			};

			expect(requestInvalidOrientation).toThrow();
		});

		it('calling "_getExtraSize" with invalid orientation throws error', function() {
			carousel.init('.carousel');

			var requestInvalidOrientation = function() {
				carousel._getExtraSize(carousel._$wrap, 'foobar');
			};

			expect(requestInvalidOrientation).toThrow();
		});

		it('throws error when initiating with invalid renderer', function() {
			var initWithInvalidRenderer = function() {
				carousel.init('.carousel', {
					renderer: 'foobar'
				});
			};

			expect(initWithInvalidRenderer).toThrow();
		});

		it('throws error when navigating to negative item index', function() {
			carousel.init('.carousel');

			var navigateToInvalidIndex = function() {
				carousel.navigateToItem(1000);
			};

			expect(navigateToInvalidIndex).toThrow();
		});

		it('throws error when requesting negative item index element', function() {
			carousel.init('.carousel');

			var requestInvalidIndexElement = function() {
				carousel.getItemElementByIndex(-1);
			};

			expect(requestInvalidIndexElement).toThrow();
		});

		it('throws error when requesting too large item index element', function() {
			carousel.init('.carousel');

			var requestInvalidIndexElement = function() {
				carousel.getItemElementByIndex(1000);
			};

			expect(requestInvalidIndexElement).toThrow();
		});

		it('throws error when navigating to too large item index', function() {
			carousel.init('.carousel');

			var navigateToInvalidIndex = function() {
				carousel.navigateToItem(-1);
			};

			expect(navigateToInvalidIndex).toThrow();
		});

		it('navigating before animation complete is ignored', function(done) {
			carousel.init('.carousel');

			carousel.navigateToItem(1);

			expect(carousel.isAnimating()).toEqual(true);

			carousel.navigateToItem(2).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(1);

				done();
			});
		});

		// used only for code coverage
		it('navigating to current page index resolves immediately', function(done) {
			carousel.init('.carousel');

			carousel.navigateToItem(0).done(done);
		});

		it('method "getMainWrap" returns the carousel main wrap element', function() {
			carousel.init('.carousel');

			var expectedElement = $('.carousel')[0];

			expect(carousel.getMainWrap()).toEqual(expectedElement);
		});

		it('method "getItemsWrap" returns the carousel items wrap element', function() {
			carousel.init('.carousel');

			var expectedElement = $('.carousel > DIV')[0];

			expect(carousel.getItemsWrap()).toEqual(expectedElement);
		});

		it('method "getScrollerWrap" returns the carousel scroller wrap element', function() {
			carousel.init('.carousel');

			var expectedElement = $('.carousel > DIV > DIV')[0];

			expect(carousel.getScrollerWrap()).toEqual(expectedElement);
		});

		it('method "getOrientation" return the carousel orientation', function() {
			carousel.init('.carousel');

			expect(carousel.getOrientation()).toEqual(FlowCarousel.Config.Orientation.HORIZONTAL);
		});

		it('method "getItemSize" returns single item size', function() {
			carousel.init('.carousel');

			expect(carousel.getItemSize() > 0).toEqual(true);
		});

		it('method "getPageCount" returns the number of pages', function() {
			carousel.init('.carousel');

			expect(carousel.getPageCount() > 0).toEqual(true);
		});

		it('method "getTargetItemIndex" returns the target item index to animate to', function(done) {
			var targetIndex = 5;

			carousel.init('.carousel');

			expect(carousel.getTargetItemIndex()).toEqual(0);
			expect(carousel.getCurrentItemIndex()).toEqual(0);

			carousel.navigateToItem(targetIndex).done(done);

			expect(carousel.getTargetItemIndex()).toEqual(targetIndex);
			expect(carousel.getCurrentItemIndex()).toEqual(0);
		});

		it('method "getCurrentPageIndex" returns the current page index', function(done) {
			var targetPage = 3;

			carousel.init('.carousel');

			expect(carousel.getCurrentPageIndex()).toEqual(0);

			carousel.navigateToPage(targetPage).done(function() {
				expect(carousel.getCurrentPageIndex()).toEqual(targetPage);

				done();
			});

			expect(carousel.getCurrentPageIndex()).toEqual(0);
		});

		it('method "isAnimating" returns whether the component is animating', function(done) {
			var targetPage = 3;

			carousel.init('.carousel');

			expect(carousel.isAnimating()).toEqual(false);

			carousel.navigateToPage(targetPage).done(function() {
				expect(carousel.isAnimating()).toEqual(false);

				done();
			});

			expect(carousel.isAnimating()).toEqual(true);

			window.setTimeout(function() {
				expect(carousel.isAnimating()).toEqual(true);
			}, 10);
		});

		it('method "getCurrentPageVisibleRange" returns visible items range', function() {
			carousel.init('.carousel', {
				useResponsiveLayout: false,
				itemsPerPage: 10
			});

			var visibleRange = carousel.getCurrentPageVisibleRange();

			expect(visibleRange.start).toEqual(0);
			expect(visibleRange.end).toEqual(9);
		});

		it('method "getCurrentPageVisibleItemElements" returns visible item elements', function() {
			carousel.init('.carousel', {
				useResponsiveLayout: false,
				itemsPerPage: 10
			});

			var visibleItemElements = carousel.getCurrentPageVisibleItemElements();

			expect(visibleItemElements.length).toEqual(10);
		});

		it('method "getItemElementByIndex" returns null for element that is not rendered', function() {
			carousel.init('.carousel');

			var unrenderedElemet = carousel.getItemElementByIndex(20);

			expect(unrenderedElemet).toEqual(null);
		});

		it('method "getNavigatorByType" returns navigator instance for valid type', function() {
			carousel.init('.carousel');

			var validNavigator = carousel.getNavigatorByType(FlowCarousel.Config.Navigator.KEYBOARD);

			expect(validNavigator).toEqual(jasmine.any(AbstractNavigator));
			expect(validNavigator).toEqual(jasmine.any(KeyboardNavigator));
		});

		it('method "getNavigatorByType" returns null for non-existing navigator type', function() {
			carousel.init('.carousel');

			var invalidNavigator = carousel.getNavigatorByType('foobar');

			expect(invalidNavigator).toEqual(null);
		});

		it('method "getPageSize" returns a single page size', function() {
			carousel.init('.carousel');

			var pageSize = carousel.getPageSize();

			expect(pageSize > 0).toEqual(true);
		});

		it('method "getTotalSize" returns total scroller size', function() {
			carousel.init('.carousel');

			var totalSize = carousel.getTotalSize();

			expect(totalSize > 0).toEqual(true);
		});

		it('method "getCurrentItemPosition" returns current item position', function() {
			carousel.init('.carousel');

			var itemPosition = carousel.getCurrentItemPosition();

			expect(itemPosition).toEqual(0);
		});

		it('method "getClosestItemIndexAtPosition" returns closest item index to a position', function() {
			carousel.init('.carousel');

			var closestItemForward = carousel.getClosestItemIndexAtPosition(-1000, 1),
				closestItemBackward = carousel.getClosestItemIndexAtPosition(-1000, -1);

			expect(closestItemForward).toEqual(2);
			expect(closestItemBackward).toEqual(3);
		});

		it('method "getClosestItemIndexAtPosition" returns closest item index to a position', function() {
			carousel.init('.carousel');

			var closestItemForward = carousel.getClosestItemIndexAtPosition(-1000, 1),
				closestItemBackward = carousel.getClosestItemIndexAtPosition(-1000, -1);

			expect(closestItemForward).toEqual(2);
			expect(closestItemBackward).toEqual(3);
		});

		it('method "getClosestPageIndexAtPosition" returns closest page index to a position', function() {
			carousel.init('.carousel');

			var closestPageForward = carousel.getClosestPageIndexAtPosition(-1000, 1),
				closestItemBackward = carousel.getClosestPageIndexAtPosition(-1000, -1);

			expect(closestPageForward).toEqual(0);
			expect(closestItemBackward).toEqual(1);
		});

		it('method "isFirstPage" and "isLastPage" returns whether the user is on the first/last page', function(done) {
			carousel.init('.carousel');

			expect(carousel.isFirstPage()).toEqual(true);
			expect(carousel.isLastPage()).toEqual(false);

			carousel.navigateToPage(1).done(function() {
				expect(carousel.isFirstPage()).toEqual(false);
				expect(carousel.isLastPage()).toEqual(false);

				carousel.navigateToPage(carousel.getPageCount() - 1).done(function() {
					expect(carousel.isFirstPage()).toEqual(false);
					expect(carousel.isLastPage()).toEqual(true);

					done();
				});
			});
		});

		it('adding a navigator of type that already exists throws error', function() {
			carousel.init('.carousel');

			var addExistingNavigator = function() {
				carousel.addNavigator(FlowCarousel.Config.Navigator.KEYBOARD, null);
			};

			expect(addExistingNavigator).toThrow();
		});

		it('adding a navigator that is not an instance of AbstractNavigator throws error', function() {
			carousel.init('.carousel');

			var addInvalidNavigator = function() {
				carousel.addNavigator('foobar', null);
			};

			expect(addInvalidNavigator).toThrow();
		});

		it('the current item index does not change before the end of the animation', function(done) {
			var targetIndex = 5;

			carousel.init('.carousel');

			expect(carousel.getTargetItemIndex()).toEqual(0);
			expect(carousel.getCurrentItemIndex()).toEqual(0);

			carousel.navigateToItem(targetIndex).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(targetIndex);

				done();
			});

			expect(carousel.getTargetItemIndex()).toEqual(targetIndex);
			expect(carousel.getCurrentItemIndex()).toEqual(0);
		});

		it('can resize the main wrap based on the largest visible child element', function(done) {
			$('.carousel .carousel-item').each(function() {
				$(this).css('height', (100 + Math.random() * 200) + 'px');
			});

			carousel.init('.carousel', {
				sizeMode: FlowCarousel.Config.SizeMode.MATCH_LARGEST_ITEM,
				useResponsiveLayout: false,
				itemsPerPage: 5
			}).done(function() {
				var biggestSize = 0;

				$('.carousel .carousel-item').each(function(index) {
					if (index > 4) {
						return;
					}

					if ($(this).height() > biggestSize) {
						biggestSize = $(this).height();
					}
				});

				// for whatever reason it seems to be impossible to get the height using normal method on PhantomJS
				//expect($('.carousel .flow-carousel-scroller').css('height')).toEqual(biggestSize + 'px');
				expect($('.carousel .flow-carousel-scroller').attr('style').indexOf(biggestSize) !== -1).toEqual(true);

				done();
			});
		});

		it('supports vertical orientation', function(done) {
			$('.carousel').removeClass('carousel-horizontal').addClass('carousel-vertical');

			carousel.init('.carousel', {
				orientation: FlowCarousel.Config.Orientation.VERTICAL
			});

			carousel.navigateToItem(10).done(function() {
				expect(carousel.getCurrentItemIndex()).toEqual(10);

				done();
			});
		});

		it('calling "init" several times throws error', function() {
			var callInitSeveralTimes = function() {
				carousel.init('.carousel');
				carousel.init('.carousel');
			};

			expect(callInitSeveralTimes).toThrow();
		});

		it('initiating the same element several times throws error', function() {
			var carousel2 = new FlowCarousel();

			var callInitOnSameElement = function() {
				carousel.init('.carousel');
				carousel2.init('.carousel');
			};

			expect(callInitOnSameElement).toThrow();
		});

		it('calling "destroy" several times throws error', function() {
			carousel.init('.carousel');

			var callDestroySeveralTimes = function() {
				carousel.destroy();
				carousel.destroy();
			};

			expect(callDestroySeveralTimes).toThrow();
		});
	});
});