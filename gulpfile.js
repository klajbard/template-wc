const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const clean = require("gulp-clean");
const rollup = require("rollup");
const resolve = require("rollup-plugin-node-resolve");
const replace = require("gulp-replace");

const { minify } = require("terser");
const htmlmin = require("gulp-htmlmin");

const fileinclude = require("gulp-file-include");
const rename = require("gulp-rename");
const CleanCSS = require("clean-css");

const HASH = (+new Date()).toString(36);

function errorHandler({ message, line, col, pos }) {
  console.log("message: " + message);
  console.log("filename: " + file.basename);
  console.log("line: " + line);
  console.log("col: " + col);
  console.log("pos: " + pos);
}

gulp.task("copy-public-assets", () => {
  return gulp.src(["src/public/**/*"]).pipe(gulp.dest("dist"));
});

gulp.task("copy-js-assets", () => {
  return gulp
    .src([
      "src/pages/**/*.js",
      "node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js",
    ])
    .pipe(
      rename(function (path) {
        path.basename += `-${HASH}`;
      })
    )
    .pipe(gulp.dest("dist"));
});

gulp.task("copy-css-assets", () => {
  return gulp
    .src(["src/*.css", "src/pages/**/*.css"])
    .pipe(
      rename(function (path) {
        path.basename += `-${HASH}`;
      })
    )
    .on("data", function (file) {
      function getCss() {
        return new CleanCSS({}).minify(file.contents.toString());
      }
      (function () {
        try {
          file.contents = Buffer.from(
            JSON.parse(Buffer.from(JSON.stringify(getCss().styles)))
          );
        } catch (error) {
          errorHandler(error);
        }
      })();
    })
    .pipe(gulp.dest("dist"));
});

gulp.task("process-html", () => {
  return gulp
    .src(["src/*.html", "src/pages/**/*.html"])
    .pipe(
      htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true })
    )
    .pipe(fileinclude())
    .pipe(replace("{{hostname}}", process.env.HOSTNAME))
    .pipe(replace("{{cdn_host}}", process.env.CDN_HOST))
    .pipe(replace(`.css"`, `-${HASH}.css"`))
    .pipe(replace(`-###.js"`, `-${HASH}.js"`))
    .pipe(gulp.dest("dist"));
});

gulp.task("clean", () => {
  return gulp.src("dist", { allowEmpty: true }).pipe(clean());
});

gulp.task("build", async () => {
  const bundle = await rollup.rollup({
    input: ["src/main.js"],
    output: {
      file: "dist/main.js",
      format: "es",
    },
    plugins: [resolve()],
  });

  return bundle.write({
    file: `dist/index-${HASH}.js`,
    format: "umd",
    name: "library",
  });
});

gulp.task("minify", async () => {
  return gulp
    .src("dist/**/*.js")
    .on("data", function (file) {
      async function getJs() {
        const result = await minify(file.contents.toString());
        return await minify(result);
      }
      (async function () {
        try {
          file.contents = Buffer.from(
            JSON.parse(Buffer.from(JSON.stringify(await getJs()))).code
          );
        } catch (error) {
          errorHandler(error);
        }
      })();
    })
    .pipe(gulp.dest("dist"));
});

gulp.task(
  "bundle",
  gulp.series(
    "copy-css-assets",
    "build",
    "copy-public-assets",
    "copy-js-assets",
    "minify",
    "process-html"
  )
);

gulp.task("reload", async () => browserSync.reload());

gulp.task("serve", () => {
  browserSync.init({
    server: "dist",
    host: "0.0.0.0", //Allows to access from any devices on the network for testing purpose
  });

  return gulp.watch(
    ["src/**/*.{css,html,js,svg}"],
    gulp.series("clean", "bundle", "reload")
  );
});

gulp.task("default", gulp.series("clean", "bundle"));

gulp.task("watch", gulp.series("default", "serve"));
