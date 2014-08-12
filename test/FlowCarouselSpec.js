define([
	'FlowCarousel'
], function(FlowCarousel) {
	describe('FlowCarousel', function () {
		it('exists', function () {
			expect(typeof(FlowCarousel)).toBe('function');
		});

		it('can be instantiated', function () {
			var flowCarousel = new FlowCarousel();

			expect(typeof(flowCarousel)).toBe('object');
		});

		it('has version number', function () {
			var flowCarousel = new FlowCarousel();

			expect(typeof(flowCarousel.version)).toBe('string');
		});
	});
});