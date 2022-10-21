module.exports = function (grunt) {
	const git = require('git-rev-sync'),
	      thisTag    = git.tag() || '',
	      thisBranch = git.branch() || '';

	grunt.initConfig({
		                 pkg       : grunt.file.readJSON('package.json'),
		                 banner    : '/*\n' +
		                             '* <%= pkg.title %>\n' +
		                             '*\n' +
		                             '* <%= pkg.description %>\n' +
		                             '*\n' +
		                             '* Author: <%= pkg.author %>\n' +
		                             '* Copyright (c) <%= grunt.template.today("yyyy") %> PMG: The Engage Group\n' +
		                             '* License: <%= pkg.license %>\n' +
		                             '*\n' +
		                             '* Release:\n' +
		                             // '*   Version: ' + (thisTag.match(/v\d(\.\d)+/) ? thisTag : pkg.version) + '\n' +
		                             '*   Version: ' + (thisTag || pkg.version) + '\n' +
		                             '*   Branch:  ' + thisBranch + '\n' +
		                             '*   Git Tag: ' + thisTag + '\n' +
		                             '*   Date:    <%= grunt.template.today("yyyymmdd") %>\n' +
		                             '*/\n',
		                 postFix   : `_${thisTag}`,
		                 postFixEN : `_${thisTag}`.replace(/\./g, '_'),
		                 uglify    : {
			                 options: {
				                 banner   : '<%= banner %>',
				                 sourceMap: 'dist/<%= pkg.fileName %>.min.js.map'
			                 },
			                 build  : {
									  src: 'src/<%= pkg.fileName %>.js',
				                 dest: 'dist/<%= pkg.fileName %>.min.js'
			                 },
		                 },
		                 cssmin    : {
			                 build: {
				                 src : 'src/<%= pkg.fileName %>.css',
				                 dest: 'dist/<%= pkg.fileName %>.min.css'
			                 }
		                 },
		                 copy      : {
			                 dist: {
				                 files: [
					                 {
						                 src : 'dist/<%= pkg.fileName %>.min.js',
						                 dest: 'dist/<%= pkg.fileName %><%= postFix %>.min.js',
					                 },
					                 {
						                 src : 'dist/<%= pkg.fileName %>.min.js.map',
						                 dest: 'dist/<%= pkg.fileName %><%= postFix %>.min.js.map',
					                 },
					                 {
						                 src : 'dist/<%= pkg.fileName %>.min.js',
						                 dest: 'dist/<%= pkg.fileName %><%= postFixEN %>_min.js',
					                 },
					                 {
						                 src : 'dist/<%= pkg.fileName %>.min.css',
						                 dest: 'dist/<%= pkg.fileName %><%= postFix %>.min.css',
					                 },
					                 {
						                 src : 'dist/<%= pkg.fileName %>.min.css',
						                 dest: 'dist/<%= pkg.fileName %><%= postFixEN %>_min.css',
					                 }
				                 ]
			                 }
		                 },
		                 file_append: {
			                 default_options: {
				                 files: [
					                 {
						                 prepend: '<%= banner %>',
						                 input  : 'dist/<%= pkg.fileName %><%= postFix %>.min.css',
						                 output : 'dist/<%= pkg.fileName %><%= postFix %>.min.css',
					                 },
					                 {
						                 prepend: '<%= banner %>',
						                 input  : 'dist/<%= pkg.fileName %><%= postFixEN %>_min.css',
						                 output : 'dist/<%= pkg.fileName %><%= postFixEN %>_min.css',
					                 }
				                 ]
			                 }
		                 }
	                 });

	// if the git tag is a version number set the current version
	if (thisTag.match(/v\d(\.\d)+/)) {
		let pkg = grunt.file.readJSON('package.json');
		pkg['version'] = thisTag;
		grunt.file.write('package.json', JSON.stringify(pkg, null, '\t'));
	}

	require('load-grunt-tasks')(grunt);

	// Default task(s).
	grunt.registerTask('default', ['uglify', 'cssmin', 'copy', 'file_append']);

};
