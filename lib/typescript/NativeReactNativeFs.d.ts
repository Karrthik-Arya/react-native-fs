import type { TurboModule } from 'react-native';
export type DownloadBeginCallbackResultT = {
    jobId: number;
    statusCode: number;
    contentLength: number;
    headers: StringMapT;
};
export type DownloadProgressCallbackResultT = {
    jobId: number;
    contentLength: number;
    bytesWritten: number;
};
/**
 * These are options expected by native implementations of downloadFile()
 * function.
 */
export type NativeDownloadFileOptionsT = {
    jobId: number;
    fromUrl: string;
    toFile: string;
    background: boolean;
    backgroundTimeout: number;
    cacheable: boolean;
    connectionTimeout: number;
    discretionary: boolean;
    headers: StringMapT;
    progressDivider: number;
    progressInterval: number;
    readTimeout: number;
    hasBeginCallback: boolean;
    hasProgressCallback: boolean;
    hasResumableCallback: boolean;
};
export type PickFileOptionsT = {
    mimeTypes: string[];
};
export type DownloadFileOptionsT = {
    fromUrl: string;
    toFile: string;
    background?: boolean;
    backgroundTimeout?: number;
    cacheable?: boolean;
    connectionTimeout?: number;
    discretionary?: boolean;
    headers?: StringMapT;
    progressDivider?: number;
    progressInterval?: number;
    readTimeout?: number;
    begin?: (res: DownloadBeginCallbackResultT) => void;
    progress?: (res: DownloadProgressCallbackResultT) => void;
    resumable?: (res: unknown) => void;
};
export type DownloadResultT = {
    jobId: number;
    statusCode: number;
    bytesWritten: number;
    headers: {
        [headerName: string]: string;
    };
};
export type FileOptionsT = {
    NSFileProtectionKey?: string;
};
export type FSInfoResultT = {
    totalSpace: number;
    totalSpaceEx: number;
    freeSpace: number;
    freeSpaceEx: number;
};
export type StringMapT = {
    [key: string]: string;
};
export type MkdirOptionsT = {
    NSURLIsExcludedFromBackupKey?: boolean;
    NSFileProtectionKey?: string;
};
export type ReadDirAssetsResItemT = {
    name: string;
    path: string;
    size: number;
    isDirectory: () => boolean;
    isFile: () => boolean;
};
export type ReadDirResItemT = {
    mtime: Date | null;
    name: string;
    path: string;
    size: number;
    isDirectory: () => boolean;
    isFile: () => boolean;
    ctime: Date | null;
};
export type StatResultT = {
    name?: string;
    path: string;
    size: number;
    mode: number;
    ctime: Date | number;
    mtime: Date | number;
    originalFilepath: string;
    isFile: () => boolean;
    isDirectory: () => boolean;
    type?: number;
};
export type NativeReadDirResItemT = {
    ctime: number;
    mtime: number;
    name: string;
    path: string;
    size: number;
    type: string;
};
type NativeStatResultT = {
    ctime: number;
    mtime: number;
    size: number;
    type: string;
    mode: number;
    originalFilepath: string;
};
export type UploadFileItemT = {
    name?: string;
    filename: string;
    filepath: string;
    filetype?: string;
};
export type UploadBeginCallbackArgT = {
    jobId: number;
};
export type UploadProgressCallbackArgT = {
    jobId: number;
    totalBytesExpectedToSend: number;
    totalBytesSent: number;
};
export type UploadFileOptionsT = {
    toUrl: string;
    binaryStreamOnly?: boolean;
    files: UploadFileItemT[];
    headers?: StringMapT;
    fields?: StringMapT;
    method?: string;
    beginCallback?: (res: UploadBeginCallbackArgT) => void;
    progressCallback?: (res: UploadProgressCallbackArgT) => void;
    begin?: (res: UploadBeginCallbackArgT) => void;
    progress?: (res: UploadProgressCallbackArgT) => void;
};
export type NativeUploadFileOptionsT = {
    jobId: number;
    toUrl: string;
    binaryStreamOnly?: boolean;
    files: object[];
    headers?: StringMapT;
    fields?: StringMapT;
    method?: string;
    hasBeginCallback: boolean;
    hasProgressCallback: boolean;
};
export type UploadResultT = {
    jobId: number;
    statusCode: number;
    headers: StringMapT;
    body: string;
};
type TouchOptions = {
    ctime?: number;
    mtime?: number;
};
export interface Spec extends TurboModule {
    readonly getConstants: () => {
        CachesDirectoryPath: string;
        DocumentDirectoryPath: string;
        DownloadDirectoryPath: string;
        ExternalCachesDirectoryPath: string;
        ExternalDirectoryPath: string;
        ExternalStorageDirectoryPath: string;
        MainBundlePath?: string;
        TemporaryDirectoryPath: string;
        FileTypeRegular: string;
        FileTypeDirectory: string;
        DocumentDirectory: number;
        LibraryDirectoryPath?: string;
        PicturesDirectoryPath?: string;
        RoamingDirectoryPath?: string;
        FileProtectionKeys?: string;
    };
    addListener(event: string): void;
    removeListeners(count: number): void;
    appendFile(path: string, b64: string): Promise<void>;
    copyFile(from: string, into: string, options: FileOptionsT): Promise<void>;
    downloadFile(options: NativeDownloadFileOptionsT): Promise<DownloadResultT>;
    exists(path: string): Promise<boolean>;
    getFSInfo(): Promise<FSInfoResultT>;
    hash(path: string, algorithm: string): Promise<string>;
    mkdir(path: string, options: MkdirOptionsT): Promise<void>;
    moveFile(from: string, into: string, options: FileOptionsT): Promise<void>;
    pickFile(options: PickFileOptionsT): Promise<string[]>;
    read(path: string, length: number, position: number): Promise<string>;
    readFile(path: string): Promise<string>;
    readDir(path: string): Promise<NativeReadDirResItemT[]>;
    stat(path: string): Promise<NativeStatResultT>;
    stopDownload(jobId: number): void;
    stopUpload(jobId: number): void;
    touch(path: string, options: TouchOptions): Promise<void>;
    unlink(path: string): Promise<void>;
    uploadFiles(options: NativeUploadFileOptionsT): Promise<UploadResultT>;
    write(path: string, b64: string, position: number): Promise<void>;
    writeFile(path: string, b64: string, options: FileOptionsT): Promise<void>;
    copyFileAssets(from: string, into: string): Promise<void>;
    copyFileRes(from: string, into: string): Promise<void>;
    existsAssets(path: string): Promise<boolean>;
    existsRes(path: string): Promise<boolean>;
    getAllExternalFilesDirs(): Promise<string[]>;
    readFileAssets(path: string): Promise<string>;
    readFileRes(path: string): Promise<string>;
    readDirAssets(path: string): Promise<NativeReadDirResItemT[]>;
    scanFile(path: string): Promise<string>;
    setReadable(filepath: string, readable: boolean, ownerOnly: boolean): Promise<boolean>;
    copyAssetsFileIOS(imageUri: string, destPath: string, width: number, height: number, scale: number, compression: number, resizeMode: string): Promise<string>;
    copyAssetsVideoIOS(imageUri: string, destPath: string): Promise<string>;
    completeHandlerIOS(jobId: number): void;
    isResumable(jobId: number): Promise<boolean>;
    pathForBundle(bundle: string): Promise<string>;
    pathForGroup(group: string): Promise<string>;
    resumeDownload(jobId: number): void;
    copyFolder(from: string, into: string): Promise<void>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeReactNativeFs.d.ts.map