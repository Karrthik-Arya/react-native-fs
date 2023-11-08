import { type DownloadBeginCallbackResultT, type DownloadFileOptionsT, type DownloadProgressCallbackResultT, type DownloadResultT, type FSInfoResultT, type FileOptionsT, type MkdirOptionsT, type PickFileOptionsT, type ReadDirAssetsResItemT, type ReadDirResItemT, type StatResultT, type StringMapT, type UploadBeginCallbackArgT, type UploadFileOptionsT, type UploadFileItemT, type UploadProgressCallbackArgT, type UploadResultT } from './NativeReactNativeFs';
import { type EncodingT, type EncodingOptions } from './utils';
export declare function appendFile(filepath: string, contents: string, encodingOrOptions?: EncodingOptions): Promise<void>;
export declare function copyFile(from: string, into: string, options?: FileOptionsT): Promise<void>;
export declare function downloadFile(options: DownloadFileOptionsT): {
    jobId: number;
    promise: Promise<DownloadResultT>;
};
export declare function exists(filepath: string): Promise<boolean>;
export declare const getFSInfo: () => Promise<FSInfoResultT>;
export declare const isResumable: (jobId: number) => Promise<boolean>;
export declare function mkdir(path: string, options?: MkdirOptionsT): Promise<void>;
export declare function moveFile(filepath: string, destPath: string, options?: FileOptionsT): Promise<void>;
export declare function pickFile(options?: Partial<PickFileOptionsT>): Promise<string[]>;
export type ReadFileOptionsT = {
    encoding?: EncodingT;
};
export declare function read(path: string, length?: number, position?: number, encodingOrOptions?: EncodingT | ReadFileOptionsT): Promise<string>;
export declare function readFile(path: string, encodingOrOptions?: EncodingT | ReadFileOptionsT): Promise<string>;
export declare function readDir(dirpath: string): Promise<ReadDirResItemT[]>;
export declare function readdir(dirpath: string): Promise<string[]>;
export declare function stat(filepath: string): Promise<StatResultT>;
export declare const stopDownload: (jobId: number) => void;
export declare function touch(filepath: string, mtime?: Date, ctime?: Date): Promise<void>;
export declare function unlink(path: string): Promise<void>;
export declare function uploadFiles(options: UploadFileOptionsT): {
    jobId: number;
    promise: Promise<UploadResultT>;
};
export declare function write(filepath: string, contents: string, position?: number, encodingOrOptions?: EncodingOptions): Promise<void>;
type WriteFileOptionsT = {
    encoding?: EncodingT;
    NSFileProtectionKey?: string;
};
export declare function writeFile(path: string, content: string, encodingOrOptions?: EncodingT | WriteFileOptionsT): Promise<void>;
export declare function copyFileAssets(from: string, into: string): Promise<void>;
export declare function copyFileRes(from: string, into: string): Promise<void>;
export declare function existsAssets(filepath: string): Promise<boolean>;
export declare function existsRes(filename: string): Promise<boolean>;
export declare const getAllExternalFilesDirs: () => Promise<string[]>;
export declare function hash(filepath: string, algorithm: string): Promise<string>;
export declare function readDirAssets(path: string): Promise<ReadDirAssetsResItemT[]>;
export declare function readFileAssets(path: string, encodingOrOptions?: EncodingOptions): Promise<string>;
export declare function readFileRes(filename: string, encodingOrOptions?: EncodingOptions): Promise<string>;
export declare const scanFile: (path: string) => Promise<string>;
export declare const setReadable: (filepath: string, readable: boolean, ownerOnly: boolean) => Promise<boolean>;
export declare const completeHandlerIOS: (jobId: number) => void;
export declare function copyAssetsFileIOS(imageUri: string, destPath: string, width: number, height: number, scale?: number, compression?: number, resizeMode?: string): Promise<string>;
export declare const copyAssetsVideoIOS: (imageUri: string, destPath: string) => Promise<string>;
export declare const pathForBundle: (bundle: string) => Promise<string>;
export declare const pathForGroup: (group: string) => Promise<string>;
export declare const resumeDownload: (jobId: number) => void;
export declare const stopUpload: (jobId: number) => void;
export declare function copyFolder(from: string, into: string): Promise<void>;
declare const MainBundlePath: string | undefined, CachesDirectoryPath: string, ExternalCachesDirectoryPath: string, DocumentDirectoryPath: string, DownloadDirectoryPath: string, ExternalDirectoryPath: string, ExternalStorageDirectoryPath: string, TemporaryDirectoryPath: string, LibraryDirectoryPath: string | undefined, PicturesDirectoryPath: string | undefined, FileProtectionKeys: string | undefined, RoamingDirectoryPath: string | undefined;
export { type DownloadBeginCallbackResultT, type DownloadFileOptionsT, type DownloadProgressCallbackResultT, type DownloadResultT, type EncodingT, type FileOptionsT, type FSInfoResultT, type MkdirOptionsT, type ReadDirAssetsResItemT, type ReadDirResItemT, type StringMapT, type UploadBeginCallbackArgT, type UploadFileItemT, type UploadFileOptionsT, type UploadProgressCallbackArgT, type UploadResultT, type WriteFileOptionsT, MainBundlePath, CachesDirectoryPath, ExternalCachesDirectoryPath, DocumentDirectoryPath, DownloadDirectoryPath, ExternalDirectoryPath, ExternalStorageDirectoryPath, TemporaryDirectoryPath, LibraryDirectoryPath, PicturesDirectoryPath, // For Windows
FileProtectionKeys, RoamingDirectoryPath, };
//# sourceMappingURL=index.d.ts.map