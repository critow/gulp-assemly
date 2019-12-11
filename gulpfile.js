const gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    del = require('del'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    browserSync = require('browser-sync').create(),
    concat = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpif = require('gulp-if'),
    gcmq = require('gulp-group-css-media-queries'),
    sass = require('gulp-sass'),
    tildeImporter = require('node-sass-tilde-importer'),
    rigger = require('gulp-rigger'),

    isDev = (process.argv.indexOf('--dev') !== -1),
    isProd = !isDev,
    isSync = (process.argv.indexOf('--sync') !== -1);

sass.compiler = require('node-sass');

const path = {
    build: {
        html: 'build',
        script: 'build/script',
        style: 'build/style',
        image: 'build/image',
        fonts: 'build/fonts'
    },
    src: {
        html: 'src/*.html',
        script: 'src/script/*.js',
        style: 'src/style/main.sass',
        image: 'src/image/**/*.{gif,jpg,png,svg}',
        fonts: 'src/fonts/**/*.{css,eot,ttf,woff}'
    },
    watch: {
        html: 'src/**/*.html',
        script: 'src/script/**/*.js',
        style: 'src/style/**/*.sass',
        image: 'src/image/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};

function clear() {
    return del('build/*');
}

function clearStyle() {
    return del('build/style/*');
}

function clearScript() {
    return del('build/script/*');
}

function styles() {
    return gulp.src(path.src.style)
        .pipe(gulpif(isDev, sourcemaps.init()))
        .pipe(sass({
            importer: tildeImporter
        }))
        .pipe(gcmq())
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 2 versions'],
            browsers: ['> 0.1%'],
            cascade: false
        }))
        .pipe(gulpif(isProd, cleanCSS({
            level: 2
        })))
        .pipe(gulpif(isDev, sourcemaps.write()))
        .pipe(gulp.dest(path.build.style))
        .pipe(gulpif(isSync, browserSync.stream()));
}

function script() {
    return gulp.src(path.src.script)
        .pipe(rigger())
        .pipe(gulpif(isDev, sourcemaps.init()))
        // .pipe(gulpif(isProd, babel({
        //     presets: ['@babel/env']
        // })))
        // .pipe(gulpif(isProd, uglify()))
        .pipe(gulpif(isDev, sourcemaps.write()))
        .pipe(gulp.dest(path.build.script))
        .pipe(gulpif(isSync, browserSync.stream()));
}

function img() {
    return gulp.src(path.src.image)
        .pipe(gulpif(isProd, imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        })))
        .pipe(gulp.dest(path.build.image));
}

function html() {
    return gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(gulpif(isSync, browserSync.stream()));
}

function fonts() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
}

function swiper() {
    return gulp.src('./node_modules/swiper/**/{swiper.min.js,swiper.min.css}')
        .pipe(gulp.dest('./build/swiper'));
}

function watch() {
    if (isSync) {
        browserSync.init({
            server: {
                baseDir: "./build/",
            }
        });
    }

    gulp.watch('./src/script/**/*.js', script);
    gulp.watch('./src/style/**/*.sass', styles);
    gulp.watch('./src/**/*.html', html);
}

let build = gulp.series(clear,
    gulp.parallel(styles, fonts, script, swiper, img, html)
);

let ss = gulp.series(
    clearStyle,
    clearScript,
    gulp.parallel(script, styles)
);

gulp.task('build', build);
gulp.task('watch', gulp.series(build, watch));
gulp.task('ss', ss);