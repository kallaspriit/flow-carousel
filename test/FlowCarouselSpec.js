define([
	'FlowCarousel',
	'Config',
	'AbstractDataSource',
	'ArrayDataSource',
	'HtmlDataSource',
	'AbstractAnimator',
	'DefaultAnimator',
	'AbstractRenderer',
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
	Deferred
) {
	'use strict';

	// dummy custom data source
	function CustomDataSource() {
		AbstractDataSource.call(this);
	}

	CustomDataSource.prototype = Object.create(AbstractDataSource.prototype);

	CustomDataSource.prototype.getItemCount = function() {
		return 0;
	};

	CustomDataSource.prototype.getItems = function(startIndex, endIndex) {
		var deferred = new Deferred();

		void(startIndex, endIndex);

		deferred.resolve([]);

		return deferred.promise();
	};

	// dummy custom renderer
	function CustomRenderer() {
		AbstractRenderer.call(this);
	}

	CustomRenderer.prototype = Object.create(AbstractRenderer.prototype);

	CustomRenderer.prototype.renderItem = function(config, index, data) {
		var deferred = new Deferred();

		deferred.resolve($('<div>test #' + data + '</div>'));

		return deferred.promise();
	};

	describe('FlowCarousel', function () {
		var defaultConfig = new Config(),
			carousel;

		// create the carousel before each run
		beforeEach(function() {
			// load test fixture
			document.body.innerHTML = window.__html__['test/fixtures/test.html'];

			carousel = new FlowCarousel();
		});

		// release it after
		afterEach(function() {
			carousel = null;
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

		it('"init" accepts custom data sources', function () {
			var customDataSource = new CustomDataSource(),
				customRenderer = new CustomRenderer();

			carousel.init('.carousel', {
				dataSource: customDataSource,
				renderer: customRenderer
			});

			expect(carousel.getDataSource()).toEqual(jasmine.any(CustomDataSource));
			expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));
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

		it('"setDataSource" accepts custom data sources', function () {
			var customDataSource = new CustomDataSource();

			carousel.init('.carousel');
			carousel.setDataSource(customDataSource);

			expect(carousel.getDataSource()).toEqual(jasmine.any(CustomDataSource));
			expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));
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
			carousel.init('.carousel', {
				orientation: carousel.Orientation.VERTICAL
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

		it('changing carousel wrap size triggers responsive layout', function(done){
			spyOn(carousel, '_reLayout').and.callFake(function() {
				expect(carousel._reLayout).toHaveBeenCalled();

				done();
			});

			carousel.init('.carousel');

			// give it some time to change
			window.setTimeout(function() {
				$('.carousel').css('width', '300px');
			}, 200);
		});

		it('changing carousel wrap size triggers responsive layout', function(done){
			spyOn(carousel, '_reLayout').and.callThrough();

			carousel.init('.carousel');

			// give it some time to change
			window.setTimeout(function() {
				$('.carousel').css('width', '300px');
			}, 200);

			// give it some time to change
			window.setTimeout(function() {
				done();
			}, 300);
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
	});
});