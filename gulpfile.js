var gulp            = require('gulp'),
    include         = require('gulp-file-include'),
    sass            = require('gulp-sass'),
    autoprefixer    = require('gulp-autoprefixer'),
    minifycss       = require('gulp-cssnano'),
    rename          = require('gulp-rename'),
    eslint          = require('gulp-eslint'),
    source          = require('vinyl-source-stream'),
    buffer          = require('vinyl-buffer'),
    uglify          = require('gulp-uglify'),
    browserify      = require('browserify'),
    watchify        = require('watchify'),
    babelify        = require('babelify');

var path = {
        src: {
            html: './src/html/pages/*.html',
            includes: 'src/html/includes/',
            scss: './src/scss/manifest.scss',
            js  : './src/js/**/*',
            entry: './src/js/app.js',
            public: './src/public/*'
        },
        dist: {
            html: './docs',
            css: './docs/css',
            js  : './docs/js',
            public: './docs'
        },
        file: {
            app: {
                dev: 'app.js',
                prod: 'app.min.js'
            }
        }
    };

gulp.task('html', function(){
    return gulp.src(path.src.html)
    .pipe(include({prefix:'@@', basepath: path.src.includes}))
    .pipe(gulp.dest(path.dist.html))
;});

gulp.task('scss', function() {
    return gulp.src(path.src.scss)
    .pipe(sass({errLogToConsole: true}))
    .pipe(autoprefixer({browser: ['> 1%', 'last 2 versions']}))
    .pipe(rename({basename: 'main'}))
    .pipe(gulp.dest(path.dist.css))
    .pipe(minifycss())
    .pipe(rename({basename: 'main', suffix: '.min'}))
    .pipe(gulp.dest(path.dist.css))
    //.pipe(reload({stream:true}))
;});

gulp.task('lint', function() {
    return gulp.src(path.src.js)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
;});

gulp.task('js', function(){
    process.env.NODE_ENV = "production";
    browserify({
        extensions: ['.jsx'],
        transform: [babelify],
        entries: [path.src.entry]
    })
    .bundle()
    .on('error', console.error.bind(console))
    .pipe(source(path.file.app.prod))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(path.dist.js));
});

gulp.task('public', function() {
    return gulp.src(path.src.public)
    .pipe(gulp.dest(path.dist.public))
;});

gulp.task('build',['html','scss','lint','js', 'public']);

gulp.task('dev', ['html', 'scss'], function() {
    gulp.watch(path.src.html, ['html']);
    gulp.watch(path.src.scss, ['scss']);
    gulp.watch(path.src.js, ['lint']);

    console.log('Watching and waiting...');

    process.env.NODE_ENV = "development";
    var b = watchify(browserify({
        extensions: ['.jsx'],
        entries: [path.src.entry],
        transform: [babelify],
        debug: true,
        cache: {},
        packageCache: {},
        fullPaths: true
    }), {poll:100});

    return b.on('update', function () {
        b.bundle()
        .on('error', console.error.bind(console))
        .pipe(source(path.file.app.dev))
        .pipe(gulp.dest(path.dist.js))
        console.log('Bundle updated');
    })
    .bundle()
    .pipe(source(path.file.app.dev))
    .pipe(gulp.dest(path.dist.js));
});
