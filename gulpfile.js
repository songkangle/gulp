'use strict';
var gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    SSI = require('browsersync-ssi'),//多浏览器多设备同步&自动刷新

    uglifyJs = require('gulp-uglify'), //混淆js
    minifyJs = require('gulp-minify'), //压缩js
    // compass = require('gulp-compass'),    //compass 用来编译sass

    sass =  require('gulp-sass'),           //compass 用来编译sass

    minifyCss = require('gulp-minify-css'),//压缩CSS
    imagemin = require('gulp-imagemin'),//压缩图片

    htmlmin = require('gulp-htmlmin'),//压缩html

    plumber = require('gulp-plumber'),//错误处理插件plumber

    clean = require('gulp-clean'), //clean 用来删除文件
    runSequence = require('gulp-run-sequence');//控制task中的串行和并行。这个很重要，它能够严格规定task的执行顺序，否则gulp默认并行，有些时候会产生问题。如先清空再重建文件，可能重建过程中又清空了。


//创建一个名为serve的任务，该任务的内容就是匿名函数中的内容。
gulp.task('serve', function () {
    //使用browserSync创建服务器，自动打开浏览器并打开./dist文件夹中的文件（默认为index.html）
    browserSync.init({
        server: {
            baseDir: ["./dist"],
            middleware: SSI({
                baseDir: './dist',
                ext: '.shtml',
                version: '2.10.0'
            })
        }
    });
    //监听各个目录的文件，如果有变动则执行相应的任务操作文件
    gulp.watch("app/sass/*.scss", ['sass']);
    gulp.watch("app/js/*.js", ['js']);
    gulp.watch("app/img/*.{png,jpg,gif,ico}", ['testImagemin']);
    gulp.watch("app/font/*.ttf", ['font']);
    gulp.watch("app/**/*.html", ['html']);
    //如果有任何文件变动，自动刷新浏览器
    gulp.watch("dist/**/*.html").on("change", browserSync.reload);

});

// //compass任务，将scss编译为css
// gulp.task('compass', function () {
//     //首先取得app/sass下的所有后缀为.scss的文件（**/的意思是包含所有子文件夹）
//     return gulp.src('app/sass/*.scss')
//         .pipe(compass({
//             //设置生成sourcemap，在调试器中显示样式在scss文件中的位置，便于调试
//             sourcemap: 'false',
//             //输出格式设置为compressed就不需要压缩css了
//             style: 'compressed',
//             //文件目录
//             css: 'dist/css',
//             sass: 'app/sass',
//             image: 'app/img'
//         }))
//         //如果有错误输出错误提示
//         .on('error', function (error) {
//             // Would like to catch the error here
//             console.log(error);
//             this.emit('end');
//         })
//         .pipe(minifyCss())
//         //编译后的文件放入dist/stylesheets下
//         .pipe(gulp.dest('dist/css'))
//         //自动刷新浏览器
//         .pipe(browserSync.stream());
// });


gulp.task('sass', function () {
  return gulp.src('app/sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist/css'))
    //自动刷新浏览器
    .pipe(browserSync.stream());

});


//压缩图片
gulp.task('testImagemin', function () {
    gulp.src('app/img/*.{png,jpg,gif,ico}')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

//js任务，将js压缩后放入dist
gulp.task('js', function () {
    //首先取得app/javascript下的所有后缀为.js的文件（**/的意思是包含所有子文件夹）
    return gulp.src('app/js/*.js')
    //错误管理模块
        .pipe(plumber())
        //混淆，不方便调试
        .pipe(uglifyJs())
        //js压缩
        .pipe(minifyJs({
            ext: {
                src: '.min.js',
                min: '.min.js'
            },
            exclude: ['tasks'],
            ignoreFiles: ['.min.js']
        }))
        //输出到dist/javascript
        .pipe(gulp.dest("dist/js"))
        //自动刷新浏览器
        .pipe(browserSync.stream());
});

//font任务，目前什么都没做
gulp.task('font', function () {
    return gulp.src("app/font/*.ttf")
        .pipe(plumber())
        .pipe(gulp.dest("dist/font/"))
        .pipe(browserSync.stream());
});

gulp.task('html', function () {
    return gulp.src("app/*.html")
        .pipe(htmlmin({
            removeComments: true,//清除HTML注释
            collapseWhitespace: true,//压缩HTML
            collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
            removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
            minifyJS: true,//压缩页面JS
            minifyCSS: true//压缩页面CSS
        }))
        .pipe(gulp.dest("dist/"))
});

//clean任务：清空dist文件夹，下边重建dist的时候使用
gulp.task('clean', function () {
    return gulp.src('dist/*', {read: false})
        .pipe(clean());
});

//redist任务：需要时手动执行，重建dist文件夹：首先清空，然后重新处理所有文件
gulp.task('redist', function () {
    //先运行clean，然后并行运行html,js,sass
    runSequence('clean', ['html', 'js', 'sass', 'testImagemin', 'font']);
});

//建立一个名为default的默认任务。当你在gitbash中执行gulp命令的时候，就会
gulp.task('default', function () {
    //先运行redist，启动服务器
    runSequence('redist', 'serve');
});