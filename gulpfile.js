/*eslint spaced-comment: ["off"]*/
/*eslint strict: ["off"]*/

'use strict';

const del = require('del');
const gulp = require('gulp');
const babel = require('gulp-babel');
const lint = require('gulp-eslint');
const notice = require('gulp-notice');

gulp.task('lint', () =>
  gulp.src([
    '**/*.js',
    '!**/*.min.js',
    '!dist/**',
    '!node_modules/**'
  ])
  .pipe(lint())
  .pipe(lint.format())
  .pipe(lint.failAfterError())
);

gulp.task('clean', () => {
  del([
    'dist/**/*',
    '!dist/',
    '!dist/.gitkeep'
  ]);
});

gulp.task('transpile', ['clean'], () =>
  gulp.src([
    'src/**/*.js'
  ])
  .pipe(babel())
  .pipe(notice())
  .pipe(gulp.dest('dist'))
);

gulp.task('default', ['transpile']);
