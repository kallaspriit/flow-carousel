/* global module */
module.exports = function(config) {
	'use strict';

    config.set({
 
        // base path, that will be used to resolve files and exclude
        basePath: '',
 
        // frameworks to use
        frameworks: ['jasmine', 'requirejs'],

		// plugins to load
		/*plugins: [
			'karma-requirejs',
			'karma-jasmine',
			'karma-chrome-launcher',
			'karma-html2js-preprocessor',
			'karma-coverage'
		],*/

		// configure preprocessors
		preprocessors: {
			'test/**/*.html': ['html2js'],
			'src/**/*.js': ['coverage']
		},
 
        // list of files / patterns to load in the browser
        files: [
			{pattern: 'test/shim/**/*.js', included: true},
			{pattern: 'examples/lib/**/*.js', included: true},
			{pattern: 'src/**/*.js', included: false},
			{pattern: 'test/**/*Spec.js', included: false},
			{pattern: 'test/test.js', watched: true, included: true, served: true},
			{pattern: 'test/**/*.html', watched: true, included: true, served: true},
        ],

        // test results reporter to use
        reporters: ['progress'],
 
        // web server port
        port: 9876,
 
        // enable / disable colors in the output (reporters and logs)
        colors: true,
 
        // level of logging
        logLevel: config.LOG_INFO,
 
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,
 
        // Start these browsers
        browsers: [
			'PhantomJS',
			//'Chrome',
			//'Firefox',
			//'IE'
			//'ChromeWithoutSecurity'
		],

		// Loggers to use
		loggers: [{type: 'console'}],

		// Create custom launchers
		customLaunchers: {
			ChromeWithoutSecurity: {
				base: 'Chrome',
				flags: ['--disable-web-security']
			}
		},
 
        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,
 
        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};