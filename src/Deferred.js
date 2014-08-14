define([
], function() {
	'use strict';

	/**
	 * Provides utility functionality.
	 *
	 * Uses the jQuery deferred implementation.
	 *
	 * @class Deferred
	 * @constructor
	 */
	var Deferred = window.jQuery.Deferred;

	// proxy to jQuery when()
	Deferred.when = $.when;

	return Deferred;
});