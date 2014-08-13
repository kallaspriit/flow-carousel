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
			expect(config.getResponsiveItemsPerPage(2000)).toEqual(5);
			expect(config.getResponsiveItemsPerPage(1800)).toEqual(4);
			expect(config.getResponsiveItemsPerPage(900)).toEqual(3);
			expect(config.getResponsiveItemsPerPage(500)).toEqual(2);
			expect(config.getResponsiveItemsPerPage(300)).toEqual(1);
		});

		it('responsive breakpoints are inclusive', function () {
			expect(config.getResponsiveItemsPerPage(1824)).toEqual(5);
			expect(config.getResponsiveItemsPerPage(768)).toEqual(3);
		});

		it('user can define new responsive breakpoints', function () {
			config.extend({
				responsiveBreakpoints: [{
					width: 0,
					itemsPerPage: 1
				}, {
					width: 250,
					itemsPerPage: 2
				}, {
					width: 500,
					itemsPerPage: 3
				}]
			});

			expect(config.getResponsiveItemsPerPage(1000)).toEqual(3);
			expect(config.getResponsiveItemsPerPage(300)).toEqual(2);
			expect(config.getResponsiveItemsPerPage(100)).toEqual(1);
			expect(config.getResponsiveItemsPerPage(0)).toEqual(1);
		});

		it('returns first responsive breakpoint value if width less then minimum', function () {
			config.extend({
				responsiveBreakpoints: [{
					width: 100,
					itemsPerPage: 1
				}, {
					width: 250,
					itemsPerPage: 2
				}, {
					width: 500,
					itemsPerPage: 3
				}]
			});

			expect(config.getResponsiveItemsPerPage(50)).toEqual(1);
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
	});
});