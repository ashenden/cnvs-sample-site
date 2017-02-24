// Load plugins

var argv          = require('yargs').argv,
    autoprefixer  = require("gulp-autoprefixer"),
    browserSync   = require('browser-sync'),
    clean         = require('gulp-clean'),
    colorLighten  = require("less-color-lighten"),
    concat        = require("gulp-concat"),
    cp            = require('child_process')
    gulp          = require("gulp"),
    htmlmin       = require('gulp-htmlmin'),
    ifElse        = require('gulp-if-else'),
    jekyll        = require('gulp-jekyll');
    less          = require("gulp-less"),
    minifyCSS     = require("gulp-minify-css"),
    notify        = require('gulp-notify'),
    plumber       = require("gulp-plumber"),
    rename        = require("gulp-rename"),
    sourcemaps    = require("gulp-sourcemaps"),
    stylelint     = require('gulp-stylelint'),
    uglify        = require("gulp-uglify"),
    util          = require("gulp-util");
    watchLess     = require('gulp-watch-less');

// Define Variables

var reload        = browserSync.reload;
var config        = {};
var messages = {
  jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

var config = {
  jekyllConfig: "_config.yml"
};

var dirs = {
  path: ".",
  styles: "./styles",
  javascripts: "./javascripts",
  vendor: "./javascripts/vendor/**/*.*",
  images: "./images/**/*.*",
  fonts: "./fonts/**/*.*",
  build: {
    path: "./build",
    styles: "./build/styles",
    javascripts: "./build/javascripts"
  }
};

var files = {
  styles: "styles",
  javascripts: "scripts",
  html: dirs.path + "/" + "index.html",
  build: {
    styles: {
      filename: "styles",
      suffix: ".min"
    },
    javascripts: {
      filename: "scripts",
      suffix: ".min"
    }
  }
};

// Default Gulp Task

gulp.task('default', ['serve']);

// Build and Serve Documentation

gulp.task('serve', ['build', 'browser-sync', 'watch']);

// Build Documentation Styles, Javascript, and Move Assets

gulp.task("build", ["move", "styles", "javascripts"]);

// Clean cnvs and Documentation buildribution  Directories

gulp.task('clean', function() {

  return gulp.src([
      dirs.build.path
    ], {
      read: false
    })
    .pipe(clean());

});

// Watch for file changes

gulp.task("watch", function () {

  gulp.watch([dirs.styles + "/**/*.less"], ["styles"]);
  gulp.watch([dirs.javascripts + "/**/*.js"], ["javascripts"]);
  gulp.watch([dirs.path + '/images/**/*'], ["move"]);
  gulp.watch([
    dirs.path + '/**/*.html',
    dirs.path + '/**/*.md',
    dirs.path + '/_data/**/*',
    '!' + dirs.build.path + '/**/*'
  ], ['jekyll-rebuild']);

});

// Move Documentation Assets to Documentation buildribution Directory

gulp.task("move", function () {

  return gulp.src([
      dirs.vendor,
      dirs.images,
      dirs.fonts
    ], {
      base: dirs.path
    })
    .pipe(gulp.dest(dirs.build.path));

});

// Compile and Process Documentation Styles

gulp.task("styles", ["stylelint"], function () {

  return gulp.src(dirs.styles + "/" + files.styles + ".less")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(less({
      paths: [dirs.styles],
      plugins: [colorLighten]
    }))
    .on("error", function (err) {
      util.log(err.message);
      this.emit("end");
    })
    .pipe(autoprefixer({
      browsers: ["last 2 versions"]
    }))
    .pipe(rename({
      basename: files.build.styles.filename,
      extname: ".css"
    }))
    .pipe(sourcemaps.write('./', {
      includeContent: false,
      sourceRoot: dirs.styles
    }))
    .pipe(gulp.dest(dirs.build.styles))
    .pipe(minifyCSS())
    .pipe(rename({
      basename: files.build.styles.filename,
      suffix: files.build.styles.suffix,
      extname: ".css"
    }))
    .pipe(sourcemaps.write('./', {
      includeContent: false,
      sourceRoot: dirs.styles
    }))
    .pipe(gulp.dest(dirs.build.styles));

});

// Lint Documentation Styles

gulp.task("stylelint", function () {

  // return gulp.src(dirs.styles + '/**/*.less')
  //   .pipe(stylelint({
  //     reporters: [{formatter: 'string', console: true}]
  //   }));

  return true;

});

// Process Documentation Javascript files

gulp.task("javascripts", function () {

  return gulp.src(dirs.javascripts + "/*.js")
    .pipe(concat(files.build.javascripts.filename + ".js"))
    .pipe(gulp.dest(dirs.build.javascripts))
    .pipe(rename({
      basename: files.build.javascripts.filename,
      suffix: files.build.javascripts.suffix,
      extname: ".js"
    }))
    .pipe(uglify({
      mangle: false,
      compress: true
    }).on("error", function (err) {
      util.log(err.message);
      this.emit("end");
    }))
    .pipe(gulp.dest(dirs.build.javascripts));

});

// Start Jekyll Server then start Documentation Site

gulp.task('browser-sync', ['jekyll-build'], function() {

  var files = [
      dirs.build.styles + '/**/*.css',
      dirs.build.javascripts + '**/*.js',
      dirs.build + 'images/**/*'
   ];

  browserSync({
    files: files,
    injectChanges: true,
    server: {
      baseDir: dirs.build.path,
      open: true,
      notify: false
    }
  });

});

// Start Jekyll Server

gulp.task('jekyll-build', function (done) {

  browserSync.notify(messages.jekyllBuild);

  var spawn = require('child_process').spawn;

  var jekyll = spawn('jekyll', ['build', '--config=' + dirs.path + '/' + config.jekyllConfig, '--source=' + dirs.path, '--destination=' + dirs.build.path], {
    stdio: 'inherit'
  }).on('close', done);

  return jekyll;

});

gulp.task('jekyll-rebuild', ['jekyll-build'], function () {

  browserSync.reload();

});
