/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare class KarmaWebpackFailureCb {
    private callback;
    constructor(callback: (error: string | undefined, errors: string[]) => void);
    apply(compiler: any): void;
}
