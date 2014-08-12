/* global module */
module.exports = function (grunt) {
	'use strict';

	// require all the dependencies
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// set grunt config
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// lints the codebase for errors and typos
		jshint: {
			app: {
				options: {
					jshintrc: '.jshintrc',
				},
				src: [
					'src/*.js',
				]
			}
		},

		// creates a local server for viewing the examples
		connect: {
			server: {
				options: {
					port: 9001,
					base: './',
					keepalive: true
				}
			}
		}
	});

	// register default task
	grunt.registerTask('default', ['jshint']);
};