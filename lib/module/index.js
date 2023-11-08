import { NativeEventEmitter } from 'react-native';
import RNFS from './ReactNativeFs';
import { decode, encode, normalizeFilePath, readFileGeneric, toEncoding } from './utils';
const nativeEventEmitter = new NativeEventEmitter(RNFS);
let lastJobId = 0;

// Internal functions.

/**
 * Generic function used by readDir and readDirAssets.
 */
async function readDirGeneric(dirpath, command) {
  const files = await command(normalizeFilePath(dirpath));
  const {
    FileTypeDirectory,
    FileTypeRegular
  } = RNFS.getConstants();
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

export function appendFile(filepath, contents, encodingOrOptions) {
  const b64 = encode(contents, toEncoding(encodingOrOptions));
  return RNFS.appendFile(normalizeFilePath(filepath), b64);
}
export function copyFile(from, into) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return RNFS.copyFile(normalizeFilePath(from), normalizeFilePath(into), options);
}
export function downloadFile(options) {
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
    toFile: normalizeFilePath(options.toFile),
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
        return await RNFS.downloadFile(nativeOptions);
      } finally {
        subscriptions.forEach(sub => sub.remove());
      }
    })()
  };
}
export function exists(filepath) {
  return RNFS.exists(normalizeFilePath(filepath));
}
export const getFSInfo = RNFS.getFSInfo;
export const isResumable = RNFS.isResumable;
export function mkdir(path) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return RNFS.mkdir(normalizeFilePath(path), options);
}
export function moveFile(filepath, destPath) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return RNFS.moveFile(normalizeFilePath(filepath), normalizeFilePath(destPath), options);
}
export function pickFile() {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return RNFS.pickFile({
    mimeTypes: options.mimeTypes || ['*/*']
  });
}
export async function read(path) {
  let length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  let position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  let encodingOrOptions = arguments.length > 3 ? arguments[3] : undefined;
  const b64 = await RNFS.read(normalizeFilePath(path), length, position);
  return decode(b64, toEncoding(encodingOrOptions));
}
export function readFile(path, encodingOrOptions) {
  return readFileGeneric(path, encodingOrOptions, RNFS.readFile);
}
export function readDir(dirpath) {
  return readDirGeneric(dirpath, RNFS.readDir);
}

// Node style version (lowercase d). Returns just the names
export async function readdir(dirpath) {
  const files = await RNFS.readDir(normalizeFilePath(dirpath));
  return files.map(file => file.name || '');
}
export async function stat(filepath) {
  const result = await RNFS.stat(normalizeFilePath(filepath));
  const {
    FileTypeDirectory,
    FileTypeRegular
  } = RNFS.getConstants();
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
export const stopDownload = RNFS.stopDownload;
export function touch(filepath, mtime, ctime) {
  if (ctime && !(ctime instanceof Date)) {
    throw new Error('touch: Invalid value for argument `ctime`');
  }
  if (mtime && !(mtime instanceof Date)) {
    throw new Error('touch: Invalid value for argument `mtime`');
  }
  return RNFS.touch(normalizeFilePath(filepath), {
    ctime: ctime && ctime.getTime(),
    mtime: mtime && mtime.getTime()
  });
}
export function unlink(path) {
  return RNFS.unlink(normalizeFilePath(path));
}
export function uploadFiles(options) {
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
    promise: RNFS.uploadFiles(nativeOptions).then(res => {
      subscriptions.forEach(sub => sub.remove());
      return res;
    })
  };
}
export function write(filepath, contents) {
  let position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
  let encodingOrOptions = arguments.length > 3 ? arguments[3] : undefined;
  const b64 = encode(contents, toEncoding(encodingOrOptions));
  return RNFS.write(normalizeFilePath(filepath), b64, position);
}
export function writeFile(path, content, encodingOrOptions) {
  const b64 = encode(content, toEncoding(encodingOrOptions));
  return RNFS.writeFile(normalizeFilePath(path), b64, typeof encodingOrOptions === 'object' ? encodingOrOptions : {});
}

// Android-specific.

export function copyFileAssets(from, into) {
  return RNFS.copyFileAssets(normalizeFilePath(from), normalizeFilePath(into));
}
export function copyFileRes(from, into) {
  return RNFS.copyFileRes(from, normalizeFilePath(into));
}
export function existsAssets(filepath) {
  return RNFS.existsAssets(filepath);
}
export function existsRes(filename) {
  return RNFS.existsRes(filename);
}
export const getAllExternalFilesDirs = RNFS.getAllExternalFilesDirs;
export function hash(filepath, algorithm) {
  return RNFS.hash(normalizeFilePath(filepath), algorithm);
}
export async function readDirAssets(path) {
  const res = await readDirGeneric(path, RNFS.readDirAssets);
  return res;
}
export function readFileAssets(path, encodingOrOptions) {
  return readFileGeneric(path, encodingOrOptions, RNFS.readFileAssets);
}
export function readFileRes(filename, encodingOrOptions) {
  return readFileGeneric(filename, encodingOrOptions, RNFS.readFileRes);
}
export const scanFile = RNFS.scanFile;

// TODO: Not documented!
// setReadable for Android
export const setReadable = RNFS.setReadable;

// iOS-specific

export const completeHandlerIOS = RNFS.completeHandlerIOS;

// iOS only
// Copies fotos from asset-library (camera-roll) to a specific location
// with a given width or height
// @see: https://developer.apple.com/reference/photos/phimagemanager/1616964-requestimageforasset
export function copyAssetsFileIOS(imageUri, destPath, width, height) {
  let scale = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1.0;
  let compression = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1.0;
  let resizeMode = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 'contain';
  return RNFS.copyAssetsFileIOS(imageUri, destPath, width, height, scale, compression, resizeMode);
}

// iOS only
// Copies fotos from asset-library (camera-roll) to a specific location
// with a given width or height
// @see: https://developer.apple.com/reference/photos/phimagemanager/1616964-requestimageforasset
export const copyAssetsVideoIOS = RNFS.copyAssetsVideoIOS;

// TODO: This is presumably iOS-specific, it is not documented,
// so it should be double-checked, what it does.
export const pathForBundle = RNFS.pathForBundle;
export const pathForGroup = RNFS.pathForGroup;
export const resumeDownload = RNFS.resumeDownload;
export const stopUpload = RNFS.stopUpload;

// Windows-specific.

// Windows workaround for slow copying of large folders of files
export function copyFolder(from, into) {
  return RNFS.copyFolder(normalizeFilePath(from), normalizeFilePath(into));
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
} = RNFS.getConstants();
export { MainBundlePath, CachesDirectoryPath, ExternalCachesDirectoryPath, DocumentDirectoryPath, DownloadDirectoryPath, ExternalDirectoryPath, ExternalStorageDirectoryPath, TemporaryDirectoryPath, LibraryDirectoryPath, PicturesDirectoryPath,
// For Windows
FileProtectionKeys, RoamingDirectoryPath // For Windows
};
//# sourceMappingURL=index.js.map