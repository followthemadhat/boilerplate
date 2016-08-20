var gulp           = require('gulp'),
    gutil          = require('gulp-util' ),
    sass           = require('gulp-sass'),
    browserSync    = require('browser-sync'),
    concat         = require('gulp-concat'),
    uglify         = require('gulp-uglify'),
    cleanCSS       = require('gulp-clean-css'),
    rename         = require('gulp-rename'),
    del            = require('del'),
    imagemin       = require('gulp-imagemin'),
    pngquant       = require('imagemin-pngquant'),
    cache          = require('gulp-cache'),
    autoprefixer   = require('gulp-autoprefixer'),
    fileinclude    = require('gulp-file-include'),
    gulpRemoveHtml = require('gulp-remove-html'),
    bourbon        = require('node-bourbon'),
    plumber        = require('gulp-plumber'),
    newer          = require('gulp-newer'),
    uncss          = require('gulp-uncss'),
    useref         = require('gulp-useref'),
    ftp            = require('vinyl-ftp');

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: 'src'
    },
    notify: false
  });
});

gulp.task('sass', function() {
  return gulp.src([
      'src/sass//main.scss',
      'src/sass/fonts.sass'
      ])
    .pipe(plumber())
    .pipe(sass({
      includePaths: bourbon.includePaths
    }).on('error', sass.logError))
    .pipe(rename({suffix: '.min', prefix : ''}))
    .pipe(autoprefixer(['last 15 versions']))
    .pipe(cleanCSS())
    .pipe(gulp.dest('src/css'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('headersass', function() {
  return gulp.src('src/header.scss')
    .pipe(sass({
      includePaths: bourbon.includePaths
    }).on('error', sass.logError))
    .pipe(rename({suffix: '.min', prefix : ''}))
    .pipe(autoprefixer(['last 15 versions']))
    .pipe(cleanCSS())
    .pipe(gulp.dest('src'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('libs', function() {
  return gulp.src([
    'src/libs/jquery/build/jquery.min.js',
    // 'src/libs/magnific-popup/magnific-popup.min.js'
    ])
    .pipe(plumber())
    .pipe(concat('libs.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('src/js'));
});

gulp.task('watch', ['sass', 'headersass', 'libs', 'browser-sync'], function() {
  gulp.watch('src/header.scss', ['headersass']);
  gulp.watch('src/sass/**/*.+(sass|scss)', ['sass']);
  gulp.watch('src/*.html', browserSync.reload);
  gulp.watch('src/js/**/*.js', browserSync.reload);
});

gulp.task('imagemin', function() {
  return gulp.src('src/img/**/*')
    .pipe(plumber())
    .pipe(cache(imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    })))
    .pipe(gulp.dest('build/img'));
});

gulp.task('buildhtml', function() {
  gulp.src(['src/*.html'])
    .pipe(fileinclude({
      prefix: '@@'
    }))
    .pipe(gulpRemoveHtml())
    .pipe(gulp.dest('build/'));
});

gulp.task('clean', function() { return del.sync('build'); });

gulp.task('build', ['clean', 'buildhtml', 'imagemin', 'sass', 'libs'], function() {

  var buildCss = gulp.src([
    'src/css/fonts.min.css',
    'src/css/main.min.css'
    ]).pipe(gulp.dest('build/css'));

  var buildFiles = gulp.src([
    'src/.htaccess'
  ]).pipe(gulp.dest('build'));

  var buildFonts = gulp.src('src/fonts/**/*').pipe(gulp.dest('build/fonts'));

  var buildJs = gulp.src('src/js/**/*').pipe(gulp.dest('build/js'));

});

gulp.task('deploy', ['build'], function() {

  var conn = ftp.create({
    host:      'hostname.com',
    user:      'username',
    password:  'userpassword',
    parallel:  10,
    log: gutil.log
  });

  var globs = [
  'build/**',
  'build/.htaccess',
  ];
  return gulp.src( globs, { buffer: false } )
  .pipe( conn.dest( '/path/to/folder/on/server' ) );

});

gulp.task('clearcache', function () { return cache.clearAll(); });

gulp.task('default', ['watch']);
