package com.drpogodin.reactnativefs;

// TODO: The compilation produces warning:
//  Note: Some input files use or override a deprecated API.
//  Note: Recompile with -Xlint:deprecation for details.
// It should be taken care of later.

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Environment;
import android.os.StatFs;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.SparseArray;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.ActivityResultRegistry;
import androidx.activity.result.contract.ActivityResultContracts.OpenDocument;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.ReactActivity;

import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.URI;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.drpogodin.reactnativefs.Errors;

public class ReactNativeFsModule extends ReactNativeFsSpec {
  public static final String NAME = "ReactNativeFs";

  private SparseArray<Downloader> downloaders = new SparseArray<>();
  private SparseArray<Uploader> uploaders = new SparseArray<>();

  private ArrayDeque<Promise> pendingPickFilePromises = new ArrayDeque<Promise>();
  private ActivityResultLauncher<String[]> pickFileLauncher;

  /**
   * Attempts to close given object, discarting possible exception. Does nothing
   * if given argument is null.
   * @param closeable
   */
  static private void closeIgnoringException(Closeable closeable) {
    if (closeable != null) {
      try { closeable.close(); }
      catch (Exception e) {}
    }
  }

  ReactNativeFsModule(ReactApplicationContext context) {
    super(context);
  }

  private ActivityResultLauncher<String[]> getPickFileLauncher() {
    if (pickFileLauncher == null) {
      ReactActivity activity = (ReactActivity)getCurrentActivity();
      ActivityResultRegistry registry = activity.getActivityResultRegistry();
      pickFileLauncher = registry.register(
        "RNFS_pickFile",
        new OpenDocument(),
        new ActivityResultCallback<Uri>() {
          @Override
          public void onActivityResult(Uri uri) {
            WritableArray res = Arguments.createArray();
            if (uri != null) res.pushString(uri.toString());
            pendingPickFilePromises.pop().resolve(res);
          }
        }
      );
    }
    return pickFileLauncher;
  }

  @Override
  protected void finalize() throws Throwable {
    if (pickFileLauncher != null) pickFileLauncher.unregister();
    super.finalize();
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  public Map<String,Object> getTypedExportedConstants() {
    final Map<String,Object> constants = new HashMap<>();

    constants.put("DocumentDirectory", 0);
    constants.put("DocumentDirectoryPath", this.getReactApplicationContext().getFilesDir().getAbsolutePath());
    constants.put("TemporaryDirectoryPath", this.getReactApplicationContext().getCacheDir().getAbsolutePath());
    constants.put("PicturesDirectoryPath", Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES).getAbsolutePath());
    constants.put("CachesDirectoryPath", this.getReactApplicationContext().getCacheDir().getAbsolutePath());
    constants.put("DownloadDirectoryPath", Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath());
    constants.put("FileTypeRegular", 0);
    constants.put("FileTypeDirectory", 1);

    File externalStorageDirectory = Environment.getExternalStorageDirectory();
    if (externalStorageDirectory != null) {
      constants.put("ExternalStorageDirectoryPath", externalStorageDirectory.getAbsolutePath());
    } else {
      constants.put("ExternalStorageDirectoryPath", null);
    }

    File externalDirectory = this.getReactApplicationContext().getExternalFilesDir(null);
    if (externalDirectory != null) {
      constants.put("ExternalDirectoryPath", externalDirectory.getAbsolutePath());
    } else {
      constants.put("ExternalDirectoryPath", null);
    }

    File externalCachesDirectory = this.getReactApplicationContext().getExternalCacheDir();
    if (externalCachesDirectory != null) {
      constants.put("ExternalCachesDirectoryPath", externalCachesDirectory.getAbsolutePath());
    } else {
      constants.put("ExternalCachesDirectoryPath", null);
    }

    return constants;
  }

  @ReactMethod
  public void addListener(String eventName) {
    // NOOP
  }

  @ReactMethod
  public void appendFile(String filepath, String base64Content, Promise promise) {
    try (OutputStream outputStream = getOutputStream(filepath, true)) {
      byte[] bytes = Base64.decode(base64Content, Base64.DEFAULT);
      outputStream.write(bytes);

      promise.resolve(null);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void copyAssetsFileIOS(
    String imageUri,
    String destPath,
    double width,
    double height,
    double scale,
    double compression,
    String resizeMode,
    Promise promise
  ) {
    Errors.NOT_IMPLEMENTED.reject(promise, "copyAssetsFileIOS()");
  }

  @ReactMethod
  public void copyAssetsVideoIOS(String imageUri, String destPath, Promise promise) {
    Errors.NOT_IMPLEMENTED.reject(promise, "copyAssetsVideoIOS()");
  }

  @ReactMethod
  public void completeHandlerIOS(double jobId) {
    // TODO: It is iOS-only. We need at least Promise here,
    // to reject.
  }

  @ReactMethod
  public void copyFile(final String filepath, final String destPath, ReadableMap options, final Promise promise) {
    new CopyFileTask() {
      @Override
      protected void onPostExecute (Exception ex) {
        if (ex == null) {
          promise.resolve(null);
        } else {
          ex.printStackTrace();
          reject(promise, filepath, ex);
        }
      }
    }.execute(filepath, destPath);
  }

  @ReactMethod
  public void copyFileAssets(String assetPath, String destination, Promise promise) {
    AssetManager assetManager = getReactApplicationContext().getAssets();
    try {
      InputStream in = assetManager.open(assetPath);
      copyInputStream(in, assetPath, destination, promise);
    } catch (IOException e) {
      // Default error message is just asset name, so make a more helpful error here.
      reject(promise, assetPath, new Exception(String.format("Asset '%s' could not be opened", assetPath)));
    }
  }

  @ReactMethod
  public void copyFileRes(String filename, String destination, Promise promise) {
    try {
      int res = getResIdentifier(filename);
      InputStream in = getReactApplicationContext().getResources().openRawResource(res);
      copyInputStream(in, filename, destination, promise);
    } catch (Exception e) {
      reject(promise, filename, new Exception(String.format("Res '%s' could not be opened", filename)));
    }
  }

  // TODO: As of now it is meant to be Windows-only.
  @ReactMethod
  public void copyFolder(String from, String to, Promise promise) {
    Errors.NOT_IMPLEMENTED.reject(promise, "copyFolder()");
  }

  @ReactMethod
  public void downloadFile(final ReadableMap options, final Promise promise) {
    try {
      File file = new File(options.getString("toFile"));
      URL url = new URL(options.getString("fromUrl"));
      final int jobId = options.getInt("jobId");
      ReadableMap headers = options.getMap("headers");
      int progressInterval = options.getInt("progressInterval");
      int progressDivider = options.getInt("progressDivider");
      int readTimeout = options.getInt("readTimeout");
      int connectionTimeout = options.getInt("connectionTimeout");
      boolean hasBeginCallback = options.getBoolean("hasBeginCallback");
      boolean hasProgressCallback = options.getBoolean("hasProgressCallback");

      DownloadParams params = new DownloadParams();

      params.src = url;
      params.dest = file;
      params.headers = headers;
      params.progressInterval = progressInterval;
      params.progressDivider = progressDivider;
      params.readTimeout = readTimeout;
      params.connectionTimeout = connectionTimeout;

      params.onTaskCompleted = new DownloadParams.OnTaskCompleted() {
        public void onTaskCompleted(DownloadResult res) {
          if (res.exception == null) {
            WritableMap infoMap = Arguments.createMap();

            infoMap.putInt("jobId", jobId);
            infoMap.putInt("statusCode", res.statusCode);
            infoMap.putDouble("bytesWritten", (double)res.bytesWritten);
            if(res.statusCode >= 200 && res.statusCode < 300){
              // Create a WritableMap for the headers
              WritableMap headersMap = Arguments.createMap();
              for (Map.Entry<String, String> entry : res.headers.entrySet()) {
                  headersMap.putString(entry.getKey(), entry.getValue());
              }
              infoMap.putMap("headers", headersMap);
            }

            promise.resolve(infoMap);
          } else {
            reject(promise, options.getString("toFile"), res.exception);
          }
        }
      };

      if (hasBeginCallback) {
        params.onDownloadBegin = new DownloadParams.OnDownloadBegin() {
          public void onDownloadBegin(int statusCode, long contentLength, Map<String, String> headers) {
            WritableMap headersMap = Arguments.createMap();

            for (Map.Entry<String, String> entry : headers.entrySet()) {
              headersMap.putString(entry.getKey(), entry.getValue());
            }

            WritableMap data = Arguments.createMap();

            data.putInt("jobId", jobId);
            data.putInt("statusCode", statusCode);
            data.putDouble("contentLength", (double)contentLength);
            data.putMap("headers", headersMap);

            sendEvent(getReactApplicationContext(), "DownloadBegin", data);
          }
        };
      }

      if (hasProgressCallback) {
        params.onDownloadProgress = new DownloadParams.OnDownloadProgress() {
          public void onDownloadProgress(long contentLength, long bytesWritten) {
            WritableMap data = Arguments.createMap();

            data.putInt("jobId", jobId);
            data.putDouble("contentLength", (double)contentLength);
            data.putDouble("bytesWritten", (double)bytesWritten);

            sendEvent(getReactApplicationContext(), "DownloadProgress", data);
          }
        };
      }

      Downloader downloader = new Downloader();

      downloader.execute(params);

      this.downloaders.put(jobId, downloader);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, options.getString("toFile"), ex);
    }
  }

  @ReactMethod
  public void exists(String filepath, Promise promise) {
    try {
      File file = new File(filepath);
      promise.resolve(file.exists());
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void existsAssets(String filepath, Promise promise) {
    try {
      AssetManager assetManager = getReactApplicationContext().getAssets();

      try {
        String[] list = assetManager.list(filepath);
        if (list != null && list.length > 0) {
          promise.resolve(true);
          return;
        }
      } catch (Exception ignored) {
        //.. probably not a directory then
      }

      // Attempt to open file (win = exists)
      try (InputStream fileStream = assetManager.open(filepath)) {
        promise.resolve(true);
      } catch (Exception ex) {
        promise.resolve(false); // don't throw an error, resolve false
      }
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void existsRes(String filename, Promise promise) {
    try {
      int res = getResIdentifier(filename);
      if (res > 0) {
        promise.resolve(true);
      } else {
        promise.resolve(false);
      }
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filename, ex);
    }
  }

  @ReactMethod
  public void getAllExternalFilesDirs(Promise promise){
    File[] allExternalFilesDirs = this.getReactApplicationContext().getExternalFilesDirs(null);
    WritableArray fs = Arguments.createArray();
    for (File f : allExternalFilesDirs) {
      if (f != null) {
        fs.pushString(f.getAbsolutePath());
      }
    }
    promise.resolve(fs);
  }

  @ReactMethod
  public void getFSInfo(Promise promise) {
    File path = Environment.getDataDirectory();
    StatFs stat = new StatFs(path.getPath());
    StatFs statEx = new StatFs(Environment.getExternalStorageDirectory().getPath());
    long totalSpace;
    long freeSpace;
    long totalSpaceEx = 0;
    long freeSpaceEx = 0;
    if (android.os.Build.VERSION.SDK_INT >= 18) {
      totalSpace = stat.getTotalBytes();
      freeSpace = stat.getFreeBytes();
      totalSpaceEx = statEx.getTotalBytes();
      freeSpaceEx = statEx.getFreeBytes();
    } else {
      long blockSize = stat.getBlockSize();
      totalSpace = blockSize * stat.getBlockCount();
      freeSpace = blockSize * stat.getAvailableBlocks();
    }
    WritableMap info = Arguments.createMap();
    info.putDouble("totalSpace", (double) totalSpace);   // Int32 too small, must use Double
    info.putDouble("freeSpace", (double) freeSpace);
    info.putDouble("totalSpaceEx", (double) totalSpaceEx);
    info.putDouble("freeSpaceEx", (double) freeSpaceEx);
    promise.resolve(info);
  }

  @ReactMethod
  public void hash(String filepath, String algorithm, Promise promise) {
    FileInputStream inputStream = null;
    try {
      Map<String, String> algorithms = new HashMap<>();

      algorithms.put("md5", "MD5");
      algorithms.put("sha1", "SHA-1");
      algorithms.put("sha224", "SHA-224");
      algorithms.put("sha256", "SHA-256");
      algorithms.put("sha384", "SHA-384");
      algorithms.put("sha512", "SHA-512");

      if (!algorithms.containsKey(algorithm)) throw new Exception("Invalid hash algorithm");

      File file = new File(filepath);

      if (file.isDirectory()) {
        rejectFileIsDirectory(promise);
        return;
      }

      if (!file.exists()) {
        rejectFileNotFound(promise, filepath);
        return;
      }

      MessageDigest md = MessageDigest.getInstance(algorithms.get(algorithm));

      inputStream = new FileInputStream(filepath);
      byte[] buffer = new byte[1024 * 10]; // 10 KB Buffer

      int read;
      while ((read = inputStream.read(buffer)) != -1) {
        md.update(buffer, 0, read);
      }

      StringBuilder hexString = new StringBuilder();
      for (byte digestByte : md.digest())
        hexString.append(String.format("%02x", digestByte));

      promise.resolve(hexString.toString());
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    } finally {
      closeIgnoringException(inputStream);
    }
  }

  @ReactMethod
  public void isResumable(double jobId, Promise promise) {
    Errors.NOT_IMPLEMENTED.reject(promise, "isResumable()");
  }

  @ReactMethod
  public void mkdir(String filepath, ReadableMap options, Promise promise) {
    try {
      File file = new File(filepath);

      file.mkdirs();

      boolean exists = file.exists();

      if (!exists) throw new Exception("Directory could not be created");

      promise.resolve(null);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void moveFile(final String filepath, String destPath, ReadableMap options, final Promise promise) {
    try {
      final File inFile = new File(filepath);

      if (!inFile.renameTo(new File(destPath))) {
        new CopyFileTask() {
          @Override
          protected void onPostExecute (Exception ex) {
            if (ex == null) {
              inFile.delete();
              promise.resolve(true);
            } else {
              ex.printStackTrace();
              reject(promise, filepath, ex);
            }
          }
        }.execute(filepath, destPath);
      } else {
          promise.resolve(true);
      }
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void pathForBundle(String bundle, Promise promise) {
    Errors.NOT_IMPLEMENTED.reject(promise, "pathForBundle()");
  }

  @ReactMethod
  public void pathForGroup(String group, Promise promise) {
    Errors.NOT_IMPLEMENTED.reject(promise, "pathForGroup()");
  }

  @ReactMethod
  public void pickFile(ReadableMap options, Promise promise) {
    ReadableArray mimeTypesArray = options.getArray("mimeTypes");
    String[] mimeTypes = new String[mimeTypesArray.size()];
    for (int i = 0; i < mimeTypesArray.size(); ++i) {
      mimeTypes[i] = mimeTypesArray.getString(i);
    }

    // Note: Here we assume that if a new pickFile() call is done prior to
    // the previous one having been completed, effectivly the new call with
    // open a new file picker on top of the view stack (thus, on top of
    // the one opened for the previous call), thus just keeping all pending
    // promises in FILO stack we should be able to resolve them in the correct
    // order.
    pendingPickFilePromises.push(promise);
    getPickFileLauncher().launch(mimeTypes);
  }

  @ReactMethod
  public void read(
    String filepath,
    double length,
    double position,
    Promise promise
  ) {
    try (InputStream inputStream = getInputStream(filepath)) {
      byte[] buffer = new byte[(int)length];
      inputStream.skip((int)position);
      int bytesRead = inputStream.read(buffer, 0, (int)length);

      String base64Content = Base64.encodeToString(buffer, 0, bytesRead, Base64.NO_WRAP);

      promise.resolve(base64Content);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void readDir(String directory, Promise promise) {
    try {
      File file = new File(directory);

      if (!file.exists()) throw new Exception("Folder does not exist");

      File[] files = file.listFiles();

      WritableArray fileMaps = Arguments.createArray();

      for (File childFile : files) {
        WritableMap fileMap = Arguments.createMap();

        fileMap.putDouble("mtime", (double) childFile.lastModified() / 1000);
        fileMap.putString("name", childFile.getName());
        fileMap.putString("path", childFile.getAbsolutePath());
        fileMap.putDouble("size", (double) childFile.length());
        fileMap.putInt("type", childFile.isDirectory() ? 1 : 0);

        fileMaps.pushMap(fileMap);
      }

      promise.resolve(fileMaps);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, directory, ex);
    }
  }

  @ReactMethod
  public void readDirAssets(String directory, Promise promise) {
    try {
      AssetManager assetManager = getReactApplicationContext().getAssets();
      String[] list = assetManager.list(directory);

      WritableArray fileMaps = Arguments.createArray();
      for (String childFile : list) {
        WritableMap fileMap = Arguments.createMap();

        fileMap.putString("name", childFile);
        String path = directory.isEmpty() ? childFile : String.format("%s/%s", directory, childFile); // don't allow / at the start when directory is ""
        fileMap.putString("path", path);
        int length = -1;
        boolean isDirectory = true;
        try {
          AssetFileDescriptor assetFileDescriptor = assetManager.openFd(path);
          if (assetFileDescriptor != null) {
            length = (int) assetFileDescriptor.getLength();
            assetFileDescriptor.close();
            isDirectory = false;
          }
        } catch (IOException ex) {
          //.. ah.. is a directory or a compressed file?
          isDirectory = !ex.getMessage().contains("compressed");
        }
        fileMap.putInt("size", length);
        fileMap.putInt("type", isDirectory ? 1 : 0); // if 0, probably a folder..

        fileMaps.pushMap(fileMap);
      }
      promise.resolve(fileMaps);

    } catch (IOException e) {
      reject(promise, directory, e);
    }
  }

  @ReactMethod
  public void readFile(String filepath, Promise promise) {
    try (InputStream inputStream = getInputStream(filepath)) {
      byte[] inputData = getInputStreamBytes(inputStream);
      String base64Content = Base64.encodeToString(inputData, Base64.NO_WRAP);

      promise.resolve(base64Content);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void readFileAssets(String filepath, Promise promise) {
    InputStream stream = null;
    try {
      // ensure isn't a directory
      AssetManager assetManager = getReactApplicationContext().getAssets();
      stream = assetManager.open(filepath, 0);
      if (stream == null) {
        reject(promise, filepath, new Exception("Failed to open file"));
        return;
      }

      byte[] buffer = new byte[stream.available()];
      stream.read(buffer);
      String base64Content = Base64.encodeToString(buffer, Base64.NO_WRAP);
      promise.resolve(base64Content);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    } finally {
      closeIgnoringException(stream);
    }
  }

  @ReactMethod
  public void readFileRes(String filename, Promise promise) {
    InputStream stream = null;
    try {
      int res = getResIdentifier(filename);
      stream = getReactApplicationContext().getResources().openRawResource(res);
      if (stream == null) {
        reject(promise, filename, new Exception("Failed to open file"));
        return;
      }

      byte[] buffer = new byte[stream.available()];
      stream.read(buffer);
      String base64Content = Base64.encodeToString(buffer, Base64.NO_WRAP);
      promise.resolve(base64Content);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filename, ex);
    } finally {
      closeIgnoringException(stream);
    }
  }

  @ReactMethod
  public void removeListeners(double count) {
    // NOOP
  }

  @ReactMethod
  public void resumeDownload(double jobId) {
    // TODO: This is currently iOS-only method,
    // and worse it does not return a promise,
    // thus we even can't cleanly reject it here.
    // At least add the Promise here.
  }

  @ReactMethod
  public void scanFile(String path, final Promise promise) {
    MediaScannerConnection.scanFile(this.getReactApplicationContext(),
      new String[]{path},
      null,
      new MediaScannerConnection.MediaScannerConnectionClient() {
        @Override
        public void onMediaScannerConnected() {}
         @Override
        public void onScanCompleted(String path, Uri uri) {
          promise.resolve(path);
        }
      }
    );
  }

  @ReactMethod
  public void setReadable(
    String filepath,
    boolean readable,
    boolean ownerOnly,
    Promise promise
  ) {
    try {
      File file = new File(filepath);

      if (!file.exists()) throw new Exception("File does not exist");

      file.setReadable(readable, ownerOnly);

      promise.resolve(true);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void stat(String filepath, Promise promise) {
    try {
      String originalFilepath = getOriginalFilepath(filepath, true);
      File file = new File(originalFilepath);

      if (!file.exists()) throw new Exception("File does not exist");

      WritableMap statMap = Arguments.createMap();
      statMap.putInt("ctime", (int) (file.lastModified() / 1000));
      statMap.putInt("mtime", (int) (file.lastModified() / 1000));
      statMap.putDouble("size", (double) file.length());
      statMap.putInt("type", file.isDirectory() ? 1 : 0);
      statMap.putString("originalFilepath", originalFilepath);

      promise.resolve(statMap);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void stopDownload(double jobId) {
    Downloader downloader = this.downloaders.get((int)jobId);
    if (downloader != null) {
      downloader.stop();
    }
  }

  @ReactMethod
  public void stopUpload(double jobId) {
    Uploader uploader = this.uploaders.get((int)jobId);

    if (uploader != null) {
      uploader.stop();
    }
  }

  @ReactMethod
  public void touch(String filepath, ReadableMap options, Promise promise) {
    try {
      File file = new File(filepath);

      long mtime = (long)options.getDouble("mtime");
      // TODO: setLastModified() returns "true" on success, "false" otherwise,
      // thus instead of resolving with its result, we should throw if result is
      // false.
      promise.resolve(file.setLastModified((long) mtime));
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void unlink(String filepath, Promise promise) {
    try {
      File file = new File(filepath);

      if (!file.exists()) throw new Exception("File does not exist");

      DeleteRecursive(file);

      promise.resolve(null);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  @ReactMethod
  public void uploadFiles(final ReadableMap options, final Promise promise) {
    try {
      ReadableArray files = options.getArray("files");
      URL url = new URL(options.getString("toUrl"));
      final int jobId = options.getInt("jobId");
      ReadableMap headers = options.getMap("headers");
      ReadableMap fields = options.getMap("fields");
      String method = options.getString("method");
      boolean binaryStreamOnly = options.getBoolean("binaryStreamOnly");
      boolean hasBeginCallback = options.getBoolean("hasBeginCallback");
      boolean hasProgressCallback = options.getBoolean("hasProgressCallback");

      ArrayList<ReadableMap> fileList = new ArrayList<>();
      UploadParams params = new UploadParams();
      for(int i =0;i<files.size();i++){
        fileList.add(files.getMap(i));
      }
      params.src = url;
      params.files =fileList;
      params.headers = headers;
      params.method = method;
      params.fields = fields;
      params.binaryStreamOnly = binaryStreamOnly;
      params.onUploadComplete = new UploadParams.onUploadComplete() {
        public void onUploadComplete(UploadResult res) {
          if (res.exception == null) {
            WritableMap infoMap = Arguments.createMap();

            infoMap.putInt("jobId", jobId);
            infoMap.putInt("statusCode", res.statusCode);
            infoMap.putMap("headers",res.headers);
            infoMap.putString("body",res.body);
            promise.resolve(infoMap);
          } else {
            reject(promise, options.getString("toUrl"), res.exception);
          }
        }
      };

      if (hasBeginCallback) {
        params.onUploadBegin = new UploadParams.onUploadBegin() {
          public void onUploadBegin() {
            WritableMap data = Arguments.createMap();

            data.putInt("jobId", jobId);

            sendEvent(getReactApplicationContext(), "UploadBegin", data);
          }
        };
      }

      if (hasProgressCallback) {
        params.onUploadProgress = new UploadParams.onUploadProgress() {
          public void onUploadProgress(int totalBytesExpectedToSend,int totalBytesSent) {
            WritableMap data = Arguments.createMap();

            data.putInt("jobId", jobId);
            data.putInt("totalBytesExpectedToSend", totalBytesExpectedToSend);
            data.putInt("totalBytesSent", totalBytesSent);

            sendEvent(getReactApplicationContext(), "UploadProgress", data);
          }
        };
      }

      Uploader uploader = new Uploader();

      uploader.execute(params);

      this.uploaders.put(jobId, uploader);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, options.getString("toUrl"), ex);
    }
  }

  // TODO: position arg should be double.
  @ReactMethod
  public void write(
    String filepath,
    String base64Content,
    double position,
    Promise promise
  ) {
    OutputStream outputStream = null;
    RandomAccessFile file = null;
    try {
      byte[] bytes = Base64.decode(base64Content, Base64.DEFAULT);

      if (position < 0) {
        outputStream = getOutputStream(filepath, true);
        outputStream.write(bytes);
      } else {
        file = new RandomAccessFile(filepath, "rw");
        file.seek((long)position);
        file.write(bytes);
      }

      promise.resolve(null);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    } finally {
      closeIgnoringException(outputStream);
      closeIgnoringException(file);
    }
  }

  @ReactMethod
  public void writeFile(String filepath, String base64Content, ReadableMap options, Promise promise) {
    try (OutputStream outputStream = getOutputStream(filepath, false)) {
      byte[] bytes = Base64.decode(base64Content, Base64.DEFAULT);
      outputStream.write(bytes);

      promise.resolve(null);
    } catch (Exception ex) {
      ex.printStackTrace();
      reject(promise, filepath, ex);
    }
  }

  private class CopyFileTask extends AsyncTask<String, Void, Exception> {
    protected Exception doInBackground(String... paths) {
      InputStream in = null;
      OutputStream out = null;
      try {
        String filepath = paths[0];
        String destPath = paths[1];

        in = getInputStream(filepath);
        out = getOutputStream(destPath, false);

        byte[] buffer = new byte[1024];
        int length;
        while ((length = in.read(buffer)) > 0) {
          out.write(buffer, 0, length);
          Thread.yield();
        }
        return null;
      } catch (Exception ex) {
        return ex;
      } finally {
        closeIgnoringException(in);
        closeIgnoringException(out);
      }
    }
  }

  /**
   * Internal method for copying that works with any InputStream
   *
   * @param in          InputStream from assets or file
   * @param source      source path (only used for logging errors)
   * @param destination destination path
   * @param promise     React Callback
   */
  private void copyInputStream(InputStream in, String source, String destination, Promise promise) {
    OutputStream out = null;
    try {
      out = getOutputStream(destination, false);

      byte[] buffer = new byte[1024 * 10]; // 10k buffer
      int read;
      while ((read = in.read(buffer)) != -1) {
        out.write(buffer, 0, read);
      }

      // Success!
      promise.resolve(null);
    } catch (Exception ex) {
      reject(promise, source, new Exception(String.format("Failed to copy '%s' to %s (%s)", source, destination, ex.getLocalizedMessage())));
    } finally {
      closeIgnoringException(in);
      closeIgnoringException(out);
    }
  }

  private void DeleteRecursive(File fileOrDirectory) {
    if (fileOrDirectory.isDirectory()) {
      for (File child : fileOrDirectory.listFiles()) {
        DeleteRecursive(child);
      }
    }

    fileOrDirectory.delete();
  }

  private Uri getFileUri(String filepath, boolean isDirectoryAllowed) throws IORejectionException {
    Uri uri = Uri.parse(filepath);
    if (uri.getScheme() == null) {
      // No prefix, assuming that provided path is absolute path to file
      File file = new File(filepath);
      if (!isDirectoryAllowed && file.isDirectory()) {
        throw new IORejectionException("EISDIR", "EISDIR: illegal operation on a directory, read '" + filepath + "'");
      }
      uri = Uri.fromFile(file);
    }
    return uri;
  }

  private InputStream getInputStream(String filepath) throws IORejectionException {
    Uri uri = getFileUri(filepath, false);
    InputStream stream;
    try {
      stream = getReactApplicationContext().getContentResolver().openInputStream(uri);
    } catch (FileNotFoundException ex) {
      throw new IORejectionException("ENOENT", "ENOENT: " + ex.getMessage() + ", open '" + filepath + "'");
    }
    if (stream == null) {
      throw new IORejectionException("ENOENT", "ENOENT: could not open an input stream for '" + filepath + "'");
    }
    return stream;
  }

  private static byte[] getInputStreamBytes(InputStream inputStream) throws IOException {
    byte[] bytesResult;
    int bufferSize = 1024;
    byte[] buffer = new byte[bufferSize];
    try (ByteArrayOutputStream byteBuffer = new ByteArrayOutputStream()) {
      int len;
      while ((len = inputStream.read(buffer)) != -1) {
        byteBuffer.write(buffer, 0, len);
      }
      bytesResult = byteBuffer.toByteArray();
    }
    return bytesResult;
  }

  private String getOriginalFilepath(String filepath, boolean isDirectoryAllowed) throws IORejectionException {
    Uri uri = getFileUri(filepath, isDirectoryAllowed);
    String originalFilepath = filepath;
    if (uri.getScheme().equals("content")) {
      try {
        Cursor cursor = getReactApplicationContext().getContentResolver().query(uri, null, null, null, null);
        if (cursor.moveToFirst()) {
          originalFilepath = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA));
        }
        cursor.close();
      } catch (IllegalArgumentException ignored) {
      }
    }
    return originalFilepath;
  }

  private OutputStream getOutputStream(String filepath, boolean append) throws IORejectionException {
    Uri uri = getFileUri(filepath, false);
    OutputStream stream;
    try {
      stream = getReactApplicationContext().getContentResolver().openOutputStream(uri, append ? "wa" : getWriteAccessByAPILevel());
    } catch (FileNotFoundException ex) {
      throw new IORejectionException("ENOENT", "ENOENT: " + ex.getMessage() + ", open '" + filepath + "'");
    }
    if (stream == null) {
      throw new IORejectionException("ENOENT", "ENOENT: could not open an output stream for '" + filepath + "'");
    }
    return stream;
  }

  private int getResIdentifier(String filename) {
    String suffix = filename.substring(filename.lastIndexOf(".") + 1);
    String name = filename.substring(0, filename.lastIndexOf("."));
    Boolean isImage = suffix.equals("png") || suffix.equals("jpg") || suffix.equals("jpeg") || suffix.equals("bmp") || suffix.equals("gif") || suffix.equals("webp") || suffix.equals("psd") || suffix.equals("svg") || suffix.equals("tiff");
    return getReactApplicationContext().getResources().getIdentifier(name, isImage ? "drawable" : "raw", getReactApplicationContext().getPackageName());
  }

  private String getWriteAccessByAPILevel() {
    return android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.P ? "w" : "rwt";
  }

  // TODO: These should be merged / replaced by the dedicated "Errors" module.
  private void reject(Promise promise, String filepath, Exception ex) {
    if (ex instanceof FileNotFoundException) {
      rejectFileNotFound(promise, filepath);
      return;
    }
    if (ex instanceof IORejectionException) {
      IORejectionException ioRejectionException = (IORejectionException) ex;
      promise.reject(ioRejectionException.getCode(), ioRejectionException.getMessage());
      return;
    }

    promise.reject(null, ex.getMessage());
  }

  private void rejectFileNotFound(Promise promise, String filepath) {
    promise.reject("ENOENT", "ENOENT: no such file or directory, open '" + filepath + "'");
  }

  private void rejectFileIsDirectory(Promise promise) {
    promise.reject("EISDIR", "EISDIR: illegal operation on a directory, read");
  }

  private void sendEvent(ReactContext reactContext, String eventName, WritableMap params) {
    RCTDeviceEventEmitter emitter =
      getReactApplicationContext()
      .getJSModule(RCTDeviceEventEmitter.class);
    emitter.emit(eventName, params);
  }
}
