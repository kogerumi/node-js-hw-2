const fs = require('fs');
const path = require('path');

const REMOVE_ORIGINAL_PARAM = '-rmo';
let removed = [];

// Copying file with optional source removal
const copyFileToCatalog = (filepath, dest, cb, removeOriginal) => {

  const filename = path.parse(filepath).base;
  const catalogDir = path.join(dest, filename.charAt(0).toUpperCase());

  if (!fs.existsSync(dest)) fs.mkdirSync(dest);
  if (!fs.existsSync(catalogDir)) fs.mkdirSync(catalogDir);

  fs.copyFileSync(filepath, path.join(catalogDir, filename));

  if (removeOriginal) {
    removeOriginal && fs.unlink(filepath, err => {
      if (err) return console.log(JSON.stringify(err));
      cb && cb();
    });

    return;
  }

  cb && cb();
};

// Remove empty directory with all empty subdirectories
const cleanEmpty = (pathName) => {

  const clean = (p) => {

    if (removed.includes(p)) return;

    fs.readdir(p, { withFileTypes: true }, (err, items) => {

      if (err) return console.log(err.message);

      if (!items.length && !removed.includes(p)) {

        removed.push(p);

        fs.rmdir(p, err => {
          if (err) return console.log(JSON.stringify(err));
          clean(pathName);
        });

        return;
      }

      items.forEach((item) => {
        if (item.isDirectory()) {
          clean(path.resolve(p, item.name));
        }
      });

    });

  };

  clean(pathName);

};

// Iterating all files in directory including subdirectories
const walkFiles = (dir, fileCallback) => {

  fs.readdir(dir, { withFileTypes: true }, (err, items) => {

    if (err) return console.log(err.message);

    if (!items.length) {
      console.log('Directory is empty');
      return;
    }

    items.forEach((item) => {

      let originalPath = path.resolve(dir, item.name);

      if (item.isDirectory()) {
        walkFiles(originalPath, fileCallback);
      }

      if (item.isFile()) {
        fileCallback && fileCallback(originalPath);
      }

    });

  });

};

// Making alphabetical catalog from source directory files
const mkcat = (src, dest, removeOriginal) => {

  const srcDir = path.isAbsolute(src) ? src : path.join(process.cwd(), src);
  const destDir = path.isAbsolute(dest) ? dest : path.join(process.cwd(), dest);

  walkFiles(srcDir, filePath => copyFileToCatalog(
    filePath,
    destDir,
    () => cleanEmpty(srcDir),
    removeOriginal
  ));

};

const init = () => {

  const src = process.argv[2];
  const dest = process.argv[3];
  const removeOriginal = process.argv.includes(REMOVE_ORIGINAL_PARAM);

  mkcat(src, dest, removeOriginal);

};

init();
