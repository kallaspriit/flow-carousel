define([
	'jquery'
], function() {
	'use strict';

	/**
	 * Provides a way to include jquery without actually including it in the build.
	 *
	 * Expects that jQuery is already loaded.
	 */
	return window.jQuery;
});