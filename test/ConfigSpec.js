define([
	'Config'
], function(Config) {
	'use strict';

	describe('Config', function () {
		var original = new Config(),
			config;

		// create the config before each run
		beforeEach(function() {
			config = new Config();
		});

		// release it after
		afterEach(function() {
			config = null;
		});

		// tests
		it('exists', function () {
			expect(Config).toEqual(jasmine.any(Function));
		});

		it('can be instantiated', function () {
			expect(config).toEqual(jasmine.any(Config));
		});

		it('has properties', function () {
			expect(config.itemsPerPage).toEqual(jasmine.any(Number));
		});

		it('can be extended', function () {
			var newItemsPerPage = 100;

			expect(config.itemsPerPage).toEqual(original.itemsPerPage);

			config.extend({
				itemsPerPage: newItemsPerPage
			});

			expect(config.itemsPerPage).toEqual(newItemsPerPage);
		});

		it('responsive layout is used by default', function () {
			expect(config.useResponsiveLayout).toEqual(true);
		});

		it('throws error when user property does not exist', function () {
			var setInvalidProperty = function() {
				config.extend({
					foobar: 5
				});
			};

			expect(setInvalidProperty).toThrow();
		});

		it('calculates default responsive breakpoints', function () {
			expect(config.getItemsPerPage(2000)).toEqual(5);
			expect(config.getItemsPerPage(1800)).toEqual(4);
			expect(config.getItemsPerPage(900)).toEqual(3);
			expect(config.getItemsPerPage(500)).toEqual(2);
			expect(config.getItemsPerPage(300)).toEqual(1);
		});

		it('responsive breakpoints are inclusive', function () {
			expect(config.getItemsPerPage(1824)).toEqual(5);
			expect(config.getItemsPerPage(768)).toEqual(3);
		});

		it('user can define new responsive breakpoints', function () {
			config.extend({
				responsiveBreakpoints: [{
					size: 0,
					itemsPerPage: 1
				}, {
					size: 250,
					itemsPerPage: 2
				}, {
					size: 500,
					itemsPerPage: 3
				}]
			});

			expect(config.getItemsPerPage(1000)).toEqual(3);
			expect(config.getItemsPerPage(300)).toEqual(2);
			expect(config.getItemsPerPage(100)).toEqual(1);
			expect(config.getItemsPerPage(0)).toEqual(1);
		});

		it('user can choose not to use responsive layout', function () {
			var itemsPerPage = 10;

			config.extend({
				useResponsiveLayout: false,
				itemsPerPage: itemsPerPage
			});

			expect(config.getItemsPerPage(1000)).toEqual(itemsPerPage);
			expect(config.getItemsPerPage(300)).toEqual(itemsPerPage);
			expect(config.getItemsPerPage(100)).toEqual(itemsPerPage);
			expect(config.getItemsPerPage(0)).toEqual(itemsPerPage);
		});

		it('returns first responsive breakpoint value if size less then minimum', function () {
			config.extend({
				responsiveBreakpoints: [{
					size: 100,
					itemsPerPage: 1
				}, {
					size: 250,
					itemsPerPage: 2
				}, {
					size: 500,
					itemsPerPage: 3
				}]
			});

			expect(config.getItemsPerPage(50)).toEqual(1);
		});

		it('provides class name', function () {
			expect(config.getClassName('wrap')).toEqual('flow-carousel-wrap');
		});

		it('requesting invalid class name type throws error', function () {
			var requestInvalidClassType = function() {
				expect(config.getClassName('foo'));
			};

			expect(requestInvalidClassType).toThrow();
		});

		it('has horizontal and vertical orientations', function () {
			expect(Config.Orientation.HORIZONTAL).toEqual(jasmine.any(String));
			expect(Config.Orientation.VERTICAL).toEqual(jasmine.any(String));

			expect(Config.Orientation.HORIZONTAL).toEqual('horizontal');
			expect(Config.Orientation.VERTICAL).toEqual('vertical');
		});

		it('default orientation is horizontal', function () {
			expect(config.orientation).toEqual(Config.Orientation.HORIZONTAL);
		});
	});
});