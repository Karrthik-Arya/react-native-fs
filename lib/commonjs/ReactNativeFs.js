"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
const LINKING_ERROR = `The package '@dr.pogodin/react-native-fs' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;
const ReactNativeFsModule = isTurboModuleEnabled ? require('./NativeReactNativeFs').default : _reactNative.NativeModules.ReactNativeFs;
const ReactNativeFs = ReactNativeFsModule ? ReactNativeFsModule : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
var _default = exports.default = ReactNativeFs;
//# sourceMappingURL=ReactNativeFs.js.map