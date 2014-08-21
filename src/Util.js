define([
], function() {
	'use strict';

	/**
	 * Provides utility functionality.
	 *
	 * @class Util
	 * @constructor
	 */
	return {

		/**
		 * Returns whether given arguments is an object (and not an array nor null).
		 *
		 * @method isObject
		 * @param {*} arg Arguments to check
		 * @return {boolean}
		 * @static
		 */
		isObject: function(arg) {
			return typeof arg === 'object' && arg !== null;
		},

		/**
		 * Returns whether given arguments is an array (and not a object nor null).
		 *
		 * @method isArray
		 * @param {*} arg Arguments to check
		 * @return {boolean}
		 * @static
		 */
		isArray: function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		},

		/**
		 * Returns whether given object contains given value.
		 *
		 * @method objectHasValue
		 * @param {object} obj Object to check
		 * @param {*} value Value to search for
		 * @return {boolean}
		 */
		objectHasValue: function(obj, value) {
			var prop;

			for (prop in obj) {
				if(obj.hasOwnProperty(prop) && obj[prop] === value) {
					return true;
				}
			}

			return false;
		},

		/**
		 * Parses a css transform matrix.
		 *
		 * Input is something along the way of "matrix(1, 0, 0, 1, -1877, 0)".
		 *
		 * Returns objects with keys x, y.
		 *
		 * @method parseTransformMatrix
		 * @param {string} matrix Matrix to parse
		 * @return {object}
		 */
		parseTransformMatrix: function(matrix) {
			var offset = 7,
				largeMatrix = false;

			if (matrix.substring(0, 8) === 'matrix3d') {
				offset = 9;
				largeMatrix = true;
			}

			var trimmed = matrix.substr(offset).substr(0, matrix.length - offset - 1),
				noWhitespace = trimmed.replace(/ +/g, ''),
				items = noWhitespace.split(/,/);

			return {
				x: parseInt(largeMatrix ? items[12] : items[4], 10),
				y: parseInt(largeMatrix ? items[13] : items[5], 10)
			};
		}
	};
});