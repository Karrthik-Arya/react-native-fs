"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TemporaryDirectoryPath = exports.RoamingDirectoryPath = exports.PicturesDirectoryPath = exports.MainBundlePath = exports.LibraryDirectoryPath = exports.FileProtectionKeys = exports.ExternalStorageDirectoryPath = exports.ExternalDirectoryPath = exports.ExternalCachesDirectoryPath = exports.DownloadDirectoryPath = exports.DocumentDirectoryPath = exports.CachesDirectoryPath = void 0;
exports.appendFile = appendFile;
exports.completeHandlerIOS = void 0;
exports.copyAssetsFileIOS = copyAssetsFileIOS;
exports.copyAssetsVideoIOS = void 0;
exports.copyFile = copyFile;
exports.copyFileAssets = copyFileAssets;
exports.copyFileRes = copyFileRes;
exports.copyFolder = copyFolder;
exports.downloadFile = downloadFile;
exports.exists = exists;
exports.existsAssets = existsAssets;
exports.existsRes = existsRes;
exports.getFSInfo = exports.getAllExternalFilesDirs = void 0;
exports.hash = hash;
exports.isResumable = void 0;
exports.mkdir = mkdir;
exports.moveFile = moveFile;
exports.pathForGroup = exports.pathForBundle = void 0;
exports.pickFile = pickFile;
exports.read = read;
exports.readDir = readDir;
exports.readDirAssets = readDirAssets;
exports.readFile = readFile;
exports.readFileAssets = readFileAssets;
exports.readFileRes = readFileRes;
exports.readdir = readdir;
exports.setReadable = exports.scanFile = exports.resumeDownload = void 0;
exports.stat = stat;
exports.stopUpload = exports.stopDownload = void 0;
exports.touch = touch;
exports.unlink = unlink;
exports.uploadFiles = uploadFiles;
exports.write = write;
exports.writeFile = writeFile;
var _reactNative = require("react-native");
var _ReactNativeFs = _interopRequireDefault(require("./ReactNativeFs"));
var _utils = require("./utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const nativeEventEmitter = new _reactNative.NativeEventEmitter(_ReactNativeFs.default);
let lastJobId = 0;

// Internal functions.

/**
 * Generic function used by readDir and readDirAssets.
 */
async function readDirGeneric(dirpath, command) {
  const files = await command((0, _utils.normalizeFilePath)(dirpath));
  const {
    FileTypeDirectory,
    FileTypeRegular
  } = _ReactNativeFs.default.getConstants();
  return files.map(file => ({
    ctime: file.ctime && new Date(file.ctime * 1000) || null,
    mtime: file.mtime && new Date(file.mtime * 1000) || null,
    name: file.name,
    path: file.path,
    size: file.size,
    isFile: () => file.type === FileTypeRegular,
    isDirectory: () => file.type === FileTypeDirectory
  }));
}

// Common exports.

function appendFile(filepath, contents, encodingOrOptions) {
  const b64 = (0, _utils.encode)(contents, (0, _utils.toEncoding)(encodingOrOptions));
  return _ReactNativeFs.default.appendFile((0, _utils.normalizeFilePath)(filepath), b64);
}
function copyFile(from, into) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return _ReactNativeFs.default.copyFile((0, _utils.normalizeFilePath)(from), (0, _utils.normalizeFilePath)(into), options);
}
function downloadFile(options) {
  if (typeof options !== 'object') {
    throw new Error('downloadFile: Invalid value for argument `options`');
  }
  if (typeof options.fromUrl !== 'string') {
    throw new Error('downloadFile: Invalid value for property `fromUrl`');
  }
  if (typeof options.toFile !== 'string') {
    throw new Error('downloadFile: Invalid value for property `toFile`');
  }
  if (options.headers && typeof options.headers !== 'object') {
    throw new Error('downloadFile: Invalid value for property `headers`');
  }
  if (options.background && typeof options.background !== 'boolean') {
    throw new Error('downloadFile: Invalid value for property `background`');
  }
  if (options.progressDivider && typeof options.progressDivider !== 'number') {
    throw new Error('downloadFile: Invalid value for property `progressDivider`');
  }
  if (options.progressInterval && typeof options.progressInterval !== 'number') {
    throw new Error('downloadFile: Invalid value for property `progressInterval`');
  }
  if (options.readTimeout && typeof options.readTimeout !== 'number') {
    throw new Error('downloadFile: Invalid value for property `readTimeout`');
  }
  if (options.connectionTimeout && typeof options.connectionTimeout !== 'number') {
    throw new Error('downloadFile: Invalid value for property `connectionTimeout`');
  }
  if (options.backgroundTimeout && typeof options.backgroundTimeout !== 'number') {
    throw new Error('downloadFile: Invalid value for property `backgroundTimeout`');
  }
  const jobId = ++lastJobId;
  const subscriptions = [];
  if (options.begin) {
    subscriptions.push(nativeEventEmitter.addListener('DownloadBegin', res => {
      if (res.jobId === jobId && options.begin) options.begin(res);
    }));
  }
  if (options.progress) {
    subscriptions.push(nativeEventEmitter.addListener('DownloadProgress', res => {
      if (res.jobId === jobId && options.progress) options.progress(res);
    }));
  }
  if (options.resumable) {
    subscriptions.push(nativeEventEmitter.addListener('DownloadResumable', res => {
      if (res.jobId === jobId && options.resumable) options.resumable(res);
    }));
  }
  var nativeOptions = {
    jobId: jobId,
    fromUrl: options.fromUrl,
    toFile: (0, _utils.normalizeFilePath)(options.toFile),
    background: !!options.background,
    backgroundTimeout: options.backgroundTimeout || 3600000,
    // 1 hour
    cacheable: !!options.cacheable,
    connectionTimeout: options.connectionTimeout || 5000,
    discretionary: !!options.discretionary,
    headers: options.headers || {},
    progressDivider: options.progressDivider || 0,
    progressInterval: options.progressInterval || 0,
    readTimeout: options.readTimeout || 15000,
    hasBeginCallback: !!options.begin,
    hasProgressCallback: !!options.progress,
    hasResumableCallback: !!options.resumable
  };
  return {
    jobId,
    promise: (async () => {
      try {
        return await _ReactNativeFs.default.downloadFile(nativeOptions);
      } finally {
        subscriptions.forEach(sub => sub.remove());
      }
    })()
  };
}
function exists(filepath) {
  return _ReactNativeFs.default.exists((0, _utils.normalizeFilePath)(filepath));
}
const getFSInfo = exports.getFSInfo = _ReactNativeFs.default.getFSInfo;
const isResumable = exports.isResumable = _ReactNativeFs.default.isResumable;
function mkdir(path) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return _ReactNativeFs.default.mkdir((0, _utils.normalizeFilePath)(path), options);
}
function moveFile(filepath, destPath) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return _ReactNativeFs.default.moveFile((0, _utils.normalizeFilePath)(filepath), (0, _utils.normalizeFilePath)(destPath), options);
}
function pickFile() {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return _ReactNativeFs.default.pickFile({
    mimeTypes: options.mimeTypes || ['*/*']
  });
}
async function read(path) {
  let length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  let position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  let encodingOrOptions = arguments.length > 3 ? arguments[3] : undefined;
  const b64 = await _ReactNativeFs.default.read((0, _utils.normalizeFilePath)(path), length, position);
  return (0, _utils.decode)(b64, (0, _utils.toEncoding)(encodingOrOptions));
}
function readFile(path, encodingOrOptions) {
  return (0, _utils.readFileGeneric)(path, encodingOrOptions, _ReactNativeFs.default.readFile);
}
function readDir(dirpath) {
  return readDirGeneric(dirpath, _ReactNativeFs.default.readDir);
}

// Node style version (lowercase d). Returns just the names
async function readdir(dirpath) {
  const files = await _ReactNativeFs.default.readDir((0, _utils.normalizeFilePath)(dirpath));
  return files.map(file => file.name || '');
}
async function stat(filepath) {
  const result = await _ReactNativeFs.default.stat((0, _utils.normalizeFilePath)(filepath));
  const {
    FileTypeDirectory,
    FileTypeRegular
  } = _ReactNativeFs.default.getConstants();
  return {
    path: filepath,
    ctime: new Date(result.ctime * 1000),
    mtime: new Date(result.mtime * 1000),
    size: result.size,
    mode: result.mode,
    originalFilepath: result.originalFilepath,
    isFile: () => result.type === FileTypeRegular,
    isDirectory: () => result.type === FileTypeDirectory
  };
}
const stopDownload = exports.stopDownload = _ReactNativeFs.default.stopDownload;
function touch(filepath, mtime, ctime) {
  if (ctime && !(ctime instanceof Date)) {
    throw new Error('touch: Invalid value for argument `ctime`');
  }
  if (mtime && !(mtime instanceof Date)) {
    throw new Error('touch: Invalid value for argument `mtime`');
  }
  return _ReactNativeFs.default.touch((0, _utils.normalizeFilePath)(filepath), {
    ctime: ctime && ctime.getTime(),
    mtime: mtime && mtime.getTime()
  });
}
function unlink(path) {
  return _ReactNativeFs.default.unlink((0, _utils.normalizeFilePath)(path));
}
function uploadFiles(options) {
  const jobId = ++lastJobId;
  const subscriptions = [];
  if (typeof options !== 'object') {
    throw new Error('uploadFiles: Invalid value for argument `options`');
  }
  if (typeof options.toUrl !== 'string') {
    throw new Error('uploadFiles: Invalid value for property `toUrl`');
  }
  if (!Array.isArray(options.files)) {
    throw new Error('uploadFiles: Invalid value for property `files`');
  }
  if (options.headers && typeof options.headers !== 'object') {
    throw new Error('uploadFiles: Invalid value for property `headers`');
  }
  if (options.fields && typeof options.fields !== 'object') {
    throw new Error('uploadFiles: Invalid value for property `fields`');
  }
  if (options.method && typeof options.method !== 'string') {
    throw new Error('uploadFiles: Invalid value for property `method`');
  }
  if (options.begin) {
    subscriptions.push(nativeEventEmitter.addListener('UploadBegin', options.begin));
  } else if (options.beginCallback) {
    // Deprecated
    subscriptions.push(nativeEventEmitter.addListener('UploadBegin', options.beginCallback));
  }
  if (options.progress) {
    subscriptions.push(nativeEventEmitter.addListener('UploadProgress', options.progress));
  } else if (options.progressCallback) {
    // Deprecated
    subscriptions.push(nativeEventEmitter.addListener('UploadProgress', options.progressCallback));
  }
  var nativeOptions = {
    jobId: jobId,
    toUrl: options.toUrl,
    files: options.files,
    binaryStreamOnly: options.binaryStreamOnly || false,
    headers: options.headers || {},
    fields: options.fields || {},
    method: options.method || 'POST',
    hasBeginCallback: options.begin instanceof Function || options.beginCallback instanceof Function,
    hasProgressCallback: options.progress instanceof Function || options.progressCallback instanceof Function
  };
  return {
    jobId,
    promise: _ReactNativeFs.default.uploadFiles(nativeOptions).then(res => {
      subscriptions.forEach(sub => sub.remove());
      return res;
    })
  };
}
function write(filepath, contents) {
  let position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
  let encodingOrOptions = arguments.length > 3 ? arguments[3] : undefined;
  const b64 = (0, _utils.encode)(contents, (0, _utils.toEncoding)(encodingOrOptions));
  return _ReactNativeFs.default.write((0, _utils.normalizeFilePath)(filepath), b64, position);
}
function writeFile(path, content, encodingOrOptions) {
  const b64 = (0, _utils.encode)(content, (0, _utils.toEncoding)(encodingOrOptions));
  return _ReactNativeFs.default.writeFile((0, _utils.normalizeFilePath)(path), b64, typeof encodingOrOptions === 'object' ? encodingOrOptions : {});
}

// Android-specific.

function copyFileAssets(from, into) {
  return _ReactNativeFs.default.copyFileAssets((0, _utils.normalizeFilePath)(from), (0, _utils.normalizeFilePath)(into));
}
function copyFileRes(from, into) {
  return _ReactNativeFs.default.copyFileRes(from, (0, _utils.normalizeFilePath)(into));
}
function existsAssets(filepath) {
  return _ReactNativeFs.default.existsAssets(filepath);
}
function existsRes(filename) {
  return _ReactNativeFs.default.existsRes(filename);
}
const getAllExternalFilesDirs = exports.getAllExternalFilesDirs = _ReactNativeFs.default.getAllExternalFilesDirs;
function hash(filepath, algorithm) {
  return _ReactNativeFs.default.hash((0, _utils.normalizeFilePath)(filepath), algorithm);
}
async function readDirAssets(path) {
  const res = await readDirGeneric(path, _ReactNativeFs.default.readDirAssets);
  return res;
}
function readFileAssets(path, encodingOrOptions) {
  return (0, _utils.readFileGeneric)(path, encodingOrOptions, _ReactNativeFs.default.readFileAssets);
}
function readFileRes(filename, encodingOrOptions) {
  return (0, _utils.readFileGeneric)(filename, encodingOrOptions, _ReactNativeFs.default.readFileRes);
}
const scanFile = exports.scanFile = _ReactNativeFs.default.scanFile;

// TODO: Not documented!
// setReadable for Android
const setReadable = exports.setReadable = _ReactNativeFs.default.setReadable;

// iOS-specific

const completeHandlerIOS = exports.completeHandlerIOS = _ReactNativeFs.default.completeHandlerIOS;

// iOS only
// Copies fotos from asset-library (camera-roll) to a specific location
// with a given width or height
// @see: https://developer.apple.com/reference/photos/phimagemanager/1616964-requestimageforasset
function copyAssetsFileIOS(imageUri, destPath, width, height) {
  let scale = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1.0;
  let compression = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1.0;
  let resizeMode = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 'contain';
  return _ReactNativeFs.default.copyAssetsFileIOS(imageUri, destPath, width, height, scale, compression, resizeMode);
}

// iOS only
// Copies fotos from asset-library (camera-roll) to a specific location
// with a given width or height
// @see: https://developer.apple.com/reference/photos/phimagemanager/1616964-requestimageforasset
const copyAssetsVideoIOS = exports.copyAssetsVideoIOS = _ReactNativeFs.default.copyAssetsVideoIOS;

// TODO: This is presumably iOS-specific, it is not documented,
// so it should be double-checked, what it does.
const pathForBundle = exports.pathForBundle = _ReactNativeFs.default.pathForBundle;
const pathForGroup = exports.pathForGroup = _ReactNativeFs.default.pathForGroup;
const resumeDownload = exports.resumeDownload = _ReactNativeFs.default.resumeDownload;
const stopUpload = exports.stopUpload = _ReactNativeFs.default.stopUpload;

// Windows-specific.

// Windows workaround for slow copying of large folders of files
function copyFolder(from, into) {
  return _ReactNativeFs.default.copyFolder((0, _utils.normalizeFilePath)(from), (0, _utils.normalizeFilePath)(into));
}
const {
  MainBundlePath,
  CachesDirectoryPath,
  ExternalCachesDirectoryPath,
  DocumentDirectoryPath,
  DownloadDirectoryPath,
  ExternalDirectoryPath,
  ExternalStorageDirectoryPath,
  TemporaryDirectoryPath,
  LibraryDirectoryPath,
  PicturesDirectoryPath,
  // For Windows
  FileProtectionKeys,
  RoamingDirectoryPath // For Windows
} = _ReactNativeFs.default.getConstants();
exports.RoamingDirectoryPath = RoamingDirectoryPath;
exports.FileProtectionKeys = FileProtectionKeys;
exports.PicturesDirectoryPath = PicturesDirectoryPath;
exports.LibraryDirectoryPath = LibraryDirectoryPath;
exports.TemporaryDirectoryPath = TemporaryDirectoryPath;
exports.ExternalStorageDirectoryPath = ExternalStorageDirectoryPath;
exports.ExternalDirectoryPath = ExternalDirectoryPath;
exports.DownloadDirectoryPath = DownloadDirectoryPath;
exports.DocumentDirectoryPath = DocumentDirectoryPath;
exports.ExternalCachesDirectoryPath = ExternalCachesDirectoryPath;
exports.CachesDirectoryPath = CachesDirectoryPath;
exports.MainBundlePath = MainBundlePath;
//# sourceMappingURL=index.js.map