(function(angular) {
	'use strict';

	// the angular compile service set in the module.run() callback
	var angularCompile = null;

	// Creates and returns the AngularRender class. it's not defined at once because the window.FlowCarousel may not be
	// available before the directive link method runs.
	function createAngularRenderer() {
		var FlowCarousel = window.FlowCarousel;

		/**
		 * The custom renderer for AngularJS that uses angular to render items.
		 *
		 * @class AngularRenderer
		 * @extends AbstractRenderer
		 * @param {angular.Scope} scope The angular scope
		 * @param {string} template Item template
		 * @constructor
		 */
		var AngularRenderer = function(scope, template) {
			FlowCarousel.AbstractRenderer.call(this);

			this._scope = scope;
			this._template = template;
		};

		AngularRenderer.prototype = Object.create(FlowCarousel.AbstractRenderer.prototype);

		/**
		 * Renders a carousel item.
		 *
		 * The data can be either a object of key-value pairs or an existing dom element to modify.
		 *
		 * Rendering an item can be asynchronous so a promise is returned.
		 *
		 * @method renderItem
		 * @param {Config} config Carousel configuration
		 * @param {number} index Item position index
		 * @param {object|DOMElement} data Item data object or existing dom element
		 * @return {Deferred.Promise}
		 */
		AngularRenderer.prototype.renderItem = function(config, index, data) {
			var deferred = new FlowCarousel.Deferred(),
				scope = this._scope.$new(),
				link,
				element;

			// TODO use parameter item name
			// provide the scope with item data
			scope.item = data;

			// reference the parent-parent scope as "$outer"
			scope.$outer = scope.$parent.$parent;

			// use the angular compile service to get the link method
			link = angularCompile(this._template);

			// link the template to the scope and we get an element
			element = link(scope);

			// provide the element synchronously
			deferred.resolve(element);

			return deferred.promise();
		};

		/**
		 * Renders a loading item placeholder.
		 *
		 * By default returns a simple div with the
		 * {{#crossLink "Config/cssClasses/placeholder:property"}}{{/crossLink}} class.
		 *
		 * You may override this in your custom renderer.
		 *
		 * @method renderPlaceholder
		 * @param {Config} config Carousel configuration
		 * @param {number} index Item position index
		 * @return {DOMElement}
		 */
		AngularRenderer.prototype.renderPlaceholder = function(config, index) {
			return $('<div>loading #' + index + '</div>')[0];
		};

		return AngularRenderer;
	}

	/**
	 * Angular FlowCarousel directive.
	 *
	 * Use it either as an argument:
	 * <div flow-carousel config="config">...</div>
	 *
	 * Or a tag:
	 * <flow-carousel config="config">...</flow-carousel>
	 *
	 * To use it in your application, include the "FlowCarousel" module dependency:
	 *
	 * var angularApp = angular.module('CarouselApp', ['FlowCarousel']) ...
	 *
	 * https://github.com/kallaspriit/flow-carousel
	 *
	 * @class FlowCarouselDirective
	 * @constructor
	 * @author Priit Kallas <priit@stagnationlab.com>
	 * @copyright Stagnation Lab
	 * @licence MIT
	 */
	function FlowCarouselDirective() {
		this._carousel = null;
		this._data = null;
		this._scope = null;
	}

	/**
	 * Directive compiler.
	 *
	 * @method compile
	 * @param {DOMElement} $element The element to link to
	 * @param {object} attrs Attributes
	 */
	FlowCarouselDirective.prototype.compile = function($element, attrs) {
		// if the data attribute is set then we're using custom data source and renderer so extract the template and
		// clear the wrap contents
		if (typeof attrs.data !== 'undefined') {
			this._template = this._extractTemplate($element);

			$element.empty();
		}
	};

	/**
	 * Directive linker.
	 *
	 * Throws error if FlowCarousel class is not present.
	 *
	 * @method link
	 * @param {angular.Scope} scope Angular scope
	 * @param {DOMElement} $element The element to link to
	 * @param {object} attrs Attributes
	 */
	FlowCarouselDirective.prototype.link = function(scope, $element/*, attrs*/) {
		var FlowCarousel = window.FlowCarousel,
			config = {
				dataSource: null
			},
			key;

		// we're expecting the FlowCarousel class to have been loaded before the linking procedure runs
		if (typeof FlowCarousel !== 'function') {
			throw new Error(
				'FlowCarousel is not loaded or registered under window, ' +
				'please add "window.FlowCarousel = FlowCarousel;"'
			);
		}

		// store the reference to scope
		this._scope = scope;

		// extend the configuration with user config if provided
		if (typeof scope.config === 'object') {
			for (key in scope.config) {
				config[key] = scope.config[key];
			}
		}

		// check whether basic array custom data has been provided
		if (typeof scope.data === 'object' && typeof scope.data.length === 'number') {
			this._data = scope.data;

			config.dataSource = new FlowCarousel.ArrayDataSource(this._data);
		}

		// if we're using a custom data source then we need custom angular renderer as well
		if (config.dataSource !== null) {
			var AngularRenderer = createAngularRenderer();

			config.renderer = new AngularRenderer(scope, this._template);
		}

		// create carousel instance
		this._carousel = new FlowCarousel();

		// re-validate the scope after navigating to a new range of items
		this._carousel.addListener(FlowCarousel.Event.NAVIGATED_TO_ITEM, function() {
			this._scope.$apply();
		}.bind(this));

		// initiate the carousel component
		this._carousel.init($element, config);
	};

	/**
	 * Extract the AngularJS template from given carousel element.
	 *
	 * @method _extractTemplate
	 * @param {DOMElement} $element Carousel element
	 * @private
	 * @return
	 */
	FlowCarouselDirective.prototype._extractTemplate = function($element) {
		// use the trimmed HTML content of the element as template
		return $element.html().replace(/^\s+|\s+$/g, '');
	};

	// define the FlowCarousel module, this should be included as dependency to your main application module
	angular.module('FlowCarousel', [])
		.directive('flowCarousel', function () {
			var flowCarouselDirective = new FlowCarouselDirective();

			window.d = flowCarouselDirective; // TODO remove this test

			return {
				restrict: 'EA', // element or an attribute
				scope: {
					data: '=',
					config: '='
				},
				compile: function($element, attrs) {
					// run the compile method
					flowCarouselDirective.compile($element, attrs);

					// return the link method
					return flowCarouselDirective.link.bind(flowCarouselDirective);
				}
			};
		})
		.run(['$compile', function($compile) {
			// the AngularRenderer need the compile service
			angularCompile = $compile;
		}]);

	return FlowCarouselDirective;
})(window.angular);