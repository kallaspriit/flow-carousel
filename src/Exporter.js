define([
], function() {
	'use strict';

	/**
	 * Returns a function that accepts the carousel component as parameter and registers it to various systems
	 * such as RequireJS AMD and AngularJS module if possible.
	 */
	return {
		export: function (FlowCarousel) {
			// support require.js style AMD
			if (typeof window.define === 'function' && window.define.amd) {
				window.define('FlowCarousel', [], function () {
					return FlowCarousel;
				});
			}

			// register AngularJS module
			/*if (typeof window.angular === 'object') {
				window.angular.module('FlowCarousel', [])
					.factory('flowCarousel', function() {
						return FlowCarousel;
					});
			}*/

			// register under window
			window.FlowCarousel = FlowCarousel;
		}
	};
});