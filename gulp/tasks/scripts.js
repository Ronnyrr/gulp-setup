/* eslint-disable global-require */
'use strict';
const gulp  = require('gulp');
const gutil = require('gulp-util');
const c     = gutil.colors;

/** Bundle scripts for browser usage */
gulp.task('scripts', () => {
  const browserify = require('browserify');

  const bundleOpts = {
    debug: true,
    extensions: [ '.jsx' ],
    transform: [ require('babelify') ]
  };

  // app bundler
  let appBundler = browserify('src/client', bundleOpts);

  // this will hold all bundlers and their outputs
  let bundlers  = [ appBundler ];
  const outputs = [ 'app.js' ];

  // wrap the app bundle with watchify in dev mode
  if (gutil.env.dev) {
    gutil.log(`${c.cyan('scripts')}: watching`);

    bundlers = bundlers.map((bundler, index) => {
      bundler = require('watchify')(bundler);
      bundler.on('update', files => {
        run(bundler, outputs[index], files);
      });

      return bundler;
    });
  }

  return require('merge-stream')(
    bundlers.map((bundle, index) => run(bundle, outputs[index]))
  );
});

/** Bundle the given inputs */
function run(bundler, bundleName, files) {
  const sourcemaps = require('gulp-sourcemaps');

  if (files) {
    gutil.log(`${c.cyan('scripts')}: ${c.yellow(files[0].replace(process.cwd(), '.'))}  changed - bundling ${c.yellow(bundleName)}`);
  } else {
    gutil.log(`${c.cyan('scripts')}: bundling ${c.yellow(bundleName)}`);
  }

  return bundler.bundle()
    .pipe(require('vinyl-source-stream')(bundleName))
    .pipe(require('vinyl-buffer')())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gutil.env.dev ?  gutil.noop() : require('gulp-uglify')())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/public/js'));
}
