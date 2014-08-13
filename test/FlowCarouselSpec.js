define([
	'FlowCarousel',
	'Config',
	'AbstractDataSource',
	'ArrayDataSource',
], function(FlowCarousel, Config, AbstractDataSource, ArrayDataSource) {
	'use strict';

	function CustomDataSource() {
		AbstractDataSource.call(this);
	}

	CustomDataSource.prototype = Object.create(AbstractDataSource.prototype);

	describe('FlowCarousel', function () {
		var defaultConfig = new Config(),
			carousel;

		// create the carousel before each run
		beforeEach(function() {
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

		it('data is array data source after initialization with defaults', function () {
			carousel.init();

			expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));
			expect(carousel.getDataSource()).toEqual(jasmine.any(ArrayDataSource));
		});

		it('init works without providing user config', function () {
			var callInitWithoutConfig = function() {
				carousel.init();
			};

			expect(callInitWithoutConfig).not.toThrow();
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

			carousel.init({
				itemsPerPage: newItemsPerPage
			});

			expect(carousel.getConfig().itemsPerPage).toEqual(newItemsPerPage);
		});

		it('can be initiated with array data', function (done) {
			var data = [1, 2, 3, 4];

			carousel.init(null, data);

			expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));
			expect(carousel.getDataSource()).toEqual(jasmine.any(ArrayDataSource));

			carousel.getDataSource().getItems().done(function(items) {
				expect(items).toEqual(data);

				done();
			});
		});

		it('throws error if provided data is of wrong type', function () {
			var initiatedWithWrongData = function() {
				carousel.init(null, 'foobar');
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
			var customDataSource = new CustomDataSource();

			carousel.init(null, customDataSource);

			expect(carousel.getDataSource()).toEqual(jasmine.any(CustomDataSource));
			expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));
		});

		it('"setDataSource" accepts custom data sources', function () {
			var customDataSource = new CustomDataSource();

			carousel.init();
			carousel.setDataSource(customDataSource);

			expect(carousel.getDataSource()).toEqual(jasmine.any(CustomDataSource));
			expect(carousel.getDataSource()).toEqual(jasmine.any(AbstractDataSource));
		});
	});
});