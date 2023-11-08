"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
// Note: It would be better to have all these type definitions in a dedicated
// module, however as of its current version RN's Codegen does not seem to handle
// type imports correctly.
/**
 * These are options expected by native implementations of downloadFile()
 * function.
 */
// TODO: When it is used as return type of Androids readDirAssets()
// it is not so good, as there are no mtime and ctime fields in that case.
// Should have a dedicated type for that.
// TODO: Essentially here StatResult is similar to ReadDirItem,
// but it does not contain Date fields, thus making it possible
// to pass it from native side, unlike ReadDirItem.
var _default = exports.default = _reactNative.TurboModuleRegistry.getEnforcing('ReactNativeFs');
//# sourceMappingURL=NativeReactNativeFs.js.map