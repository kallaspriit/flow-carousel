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
			library: {
				options: {
					jshintrc: '.jshintrc',
				},
				src: [
					'src/**/*.js',
				]
			},
			tests: {
				options: {
					jshintrc: 'test/.jshintrc',
				},
				src: [
					'test/**/*.js',
				]
			}
		},

		// generates a single file distribution version of the project
		// TODO the combined files should not include jQuery
		requirejs: {
			combined: {
				options: {
					baseUrl: './src',
					paths: {},
					name: 'FlowCarousel',
					out: 'dist/FlowCarousel.js',
					almond: true,
					wrap: {
						startFile: 'build/almond-start.frag',
						endFile: 'build/almond-end.frag'
					},
					optimize: 'none'
				}
			},
			minified: {
				options: {
					baseUrl: './src',
					paths: {},
					name: 'FlowCarousel',
					out: 'dist/FlowCarousel.min.js',
					almond: true,
					wrap: {
						startFile: 'build/almond-start.frag',
						endFile: 'build/almond-end.frag'
					},
					optimize: 'uglify2',
					preserveLicenseComments: false,
					generateSourceMaps: true
				}
			}
		},

		// executes tests using karma test runner
		karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },

		// generates the reference documentation
		yuidoc: {
			compile: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					paths: [
						'src',
					],
					outdir: 'reference',
					linkNatives: 'true'
				}
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
	grunt.registerTask('default', ['jshint', 'test', 'build', 'reference']);

	// builds distribution version of the library
	grunt.registerTask('build', ['requirejs']);

	// executes the tests
	grunt.registerTask('test', ['karma']);

	// executes the tests
	grunt.registerTask('reference', ['yuidoc']);
};