'use strict';

var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    connect = require('gulp-connect'),
    pug = require('gulp-pug'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    csso = require('gulp-csso'),
    imageop = require('gulp-image-optimization'),
    sprite = require('gulp.spritesmith'),
    svgSprite = require('gulp-svg-sprite'),
    cheerio = require('gulp-cheerio'),
    deleting = require('del'),
    merge = require('merge-stream'),
    combineMq = require('gulp-combine-mq'),
    imagemin = require('gulp-imagemin');

/***
 * CONNECT
 */

gulp.task('connect', function(){
    connect.server({
        root: 'app',
        port: 2585,
        livereload: true
    });
});

/***
 * COMPILE PUG
 */

gulp.task('pug', function(){
    return gulp.src('./app/pug/pages/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(wiredep({
            directory: "./app/bower_components",
            ignorePath: '../../'
        }))
        .pipe(gulp.dest('./app/'))
        .pipe(connect.reload());
});

/***
 * COMPILE SASS
 */

gulp.task('sass', function(){
    gulp.src('./app/sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 5 versions']
        }))
        .pipe(csso())
        .pipe(combineMq({
            beautify: false
        }))
        .pipe(gulp.dest('./app/'))
        .pipe(connect.reload());
});

/***
 * COPYING FILES
 */

gulp.task('copy', function () {
    gulp.src('./app/{fonts,images}/**')
        .pipe(gulp.dest('dist/'));
});

/***
 * IMAGES OPTIMIZATION
 */
gulp.task('images', () =>
    gulp.src('./app/images/**/*.+(png|jpg|gif|jpeg)')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/images'))
);

//gulp.task('images', function(){
    //gulp.src('./app/images/**/*.+(png|jpg|gif|jpeg)')
        //.pipe(imageop({
            //optimizationLevel: 5,
            //progressive: true,
            //interlaced: true
        //}))
        //.pipe(gulp.dest('./dist/images'));
//});

/***
 * PNG SPRITE
 */

gulp.task('pngSprite', function(){
    var spriteData = gulp.src('./app/images/icons/*.png')
        .pipe(sprite({
            imgName: 'sprite.png',
            cssName: 'sprite.scss',
            algorithm: 'top-down',
            padding: 20
        }));

    var imgStream = spriteData.img
        .pipe(gulp.dest('./app/images/'));

    var cssStream = spriteData.css
        .pipe(gulp.dest('./app/sass/components/'));

    return merge(imgStream, cssStream);
});

/***
 * SVG SPRITE
 */

gulp.task('svgSprite', function(){

    var svgSpriteOptions = {
        mode: {
            symbol: {
                render: {
                    css: false,
                    scss: false
                },
                dest: '.',
                sprite: 'svg_sprite.svg',
                example: true
            }
        }
    };

    gulp.src('./app/images/svg/icons/*.svg')
        .pipe(cheerio({
            run: function($){
                $('[fill]').removeAttr('fill');
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true }
        }))
        .pipe(svgSprite(svgSpriteOptions))
        .pipe(gulp.dest('./app/images/svg'));
});

/***
 * CLEAN DIST
 */

gulp.task('clean', function(){
    return deleting(['dist/']);
});

/***
 * BOWER
 */

gulp.task('bower', function(){
    gulp.src('./app/*.html')
        .pipe(wiredep({
            directory: "app/bower_components"
        }))
        .pipe(gulp.dest('./app'));
});

/***
 * BUILD PROJECT
 */

gulp.task('build', ['copy', 'images'], function(){
    return gulp.src('./app/*.html')
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', cleanCSS()))
        .pipe(gulp.dest('dist'));
});

/***
 * WATCH
 */

gulp.task('watch', function(){
    gulp.watch('bower.json', ['bower']);
    gulp.watch('./app/pug/**/*.pug', ['pug']);
    gulp.watch('./app/sass/**/*.scss', ['sass']);
});

/***
 * DEFAULT TASK
 */

gulp.task('default', ['clean', 'connect', 'watch']);