/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <reference types="packages/angular_devkit/build_angular/src/babel-bazel" />
import { PluginObj } from '@babel/core';
export interface ProcessBundleOptions {
    filename: string;
    code: string;
    map?: string;
    name: string;
    sourceMaps?: boolean;
    hiddenSourceMaps?: boolean;
    vendorSourceMaps?: boolean;
    runtime?: boolean;
    optimize?: boolean;
    optimizeOnly?: boolean;
    ignoreOriginal?: boolean;
    cacheKeys?: (string | undefined)[];
    integrityAlgorithm?: 'sha256' | 'sha384' | 'sha512';
    runtimeData?: ProcessBundleResult[];
    replacements?: [string, string][];
    supportedBrowsers?: string[] | Record<string, string>;
    memoryMode?: boolean;
}
export interface ProcessBundleResult {
    name: string;
    integrity?: string;
    original?: ProcessBundleFile;
    downlevel?: ProcessBundleFile;
}
export interface ProcessBundleFile {
    filename: string;
    size: number;
    integrity?: string;
    content?: string;
    map?: {
        filename: string;
        size: number;
        content?: string;
    };
}
export declare const enum CacheKey {
    OriginalCode = 0,
    OriginalMap = 1,
    DownlevelCode = 2,
    DownlevelMap = 3
}
export declare function process(options: ProcessBundleOptions): Promise<ProcessBundleResult>;
export declare function createI18nPlugins(locale: string, translation: unknown | undefined, missingTranslation: 'error' | 'warning' | 'ignore', shouldInline: boolean, localeDataContent?: string): Promise<{
    diagnostics: import("@angular/localize/src/tools/src/diagnostics").Diagnostics;
    plugins: PluginObj<import("@babel/core").PluginPass>[];
}>;
export interface InlineOptions {
    filename: string;
    code: string;
    map?: string;
    es5: boolean;
    outputPath: string;
    missingTranslation?: 'warning' | 'error' | 'ignore';
    setLocale?: boolean;
}
export declare function inlineLocales(options: InlineOptions): Promise<{
    file: string;
    diagnostics: {
        type: "error" | "warning";
        message: string;
    }[];
    count: number;
} | {
    file: string;
    diagnostics: {
        type: "error" | "warning";
        message: string;
    }[];
}>;
