"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./build-browser-features"), exports);
__exportStar(require("./default-progress"), exports);
__exportStar(require("./delete-output-dir"), exports);
__exportStar(require("./run-module-as-observable-fork"), exports);
__exportStar(require("./normalize-file-replacements"), exports);
__exportStar(require("./normalize-asset-patterns"), exports);
__exportStar(require("./normalize-source-maps"), exports);
__exportStar(require("./normalize-optimization"), exports);
__exportStar(require("./normalize-builder-schema"), exports);
__exportStar(require("./url"), exports);
__exportStar(require("./workers"), exports);
