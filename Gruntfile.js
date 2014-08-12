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

		// generates a single file distribution version of the project
		requirejs: {
			combined: {
				options: {
					baseUrl: './',
					paths: {
						jquery: 'examples/lib/jquery'
					},
					name: 'src/FlowCarousel',
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
					baseUrl: './',
					paths: {
						jquery: 'examples/lib/jquery'
					},
					name: 'src/FlowCarousel',
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
	grunt.registerTask('default', ['jshint', 'test', 'build', 'doc']);

	// builds distribution version of the library
	grunt.registerTask('build', ['requirejs']);

	// executes the tests
	grunt.registerTask('test', ['karma']);


	// executes the tests
	grunt.registerTask('doc', ['yuidoc']);
};