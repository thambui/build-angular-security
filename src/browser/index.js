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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWebpackBrowser = void 0;
const architect_1 = require("@angular-devkit/architect");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const core_1 = require("@angular-devkit/core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const typescript_1 = require("typescript");
const utils_1 = require("../utils");
const action_executor_1 = require("../utils/action-executor");
const bundle_calculator_1 = require("../utils/bundle-calculator");
const cache_path_1 = require("../utils/cache-path");
const color_1 = require("../utils/color");
const copy_assets_1 = require("../utils/copy-assets");
const environment_options_1 = require("../utils/environment-options");
const i18n_inlining_1 = require("../utils/i18n-inlining");
const index_html_generator_1 = require("../utils/index-file/index-html-generator");
const output_paths_1 = require("../utils/output-paths");
const package_chunk_sort_1 = require("../utils/package-chunk-sort");
const read_tsconfig_1 = require("../utils/read-tsconfig");
const service_worker_1 = require("../utils/service-worker");
const spinner_1 = require("../utils/spinner");
const version_1 = require("../utils/version");
const webpack_browser_config_1 = require("../utils/webpack-browser-config");
const configs_1 = require("../webpack/configs");
const async_chunks_1 = require("../webpack/utils/async-chunks");
const helpers_1 = require("../webpack/utils/helpers");
const stats_1 = require("../webpack/utils/stats");
const cacheDownlevelPath = environment_options_1.cachingDisabled ? undefined : cache_path_1.findCachePath('angular-build-dl');
async function initialize(options, context, differentialLoadingNeeded, webpackConfigurationTransform) {
    var _a, _b;
    const originalOutputPath = options.outputPath;
    // Assets are processed directly by the builder except when watching
    const adjustedOptions = options.watch ? options : { ...options, assets: [] };
    const { config, projectRoot, projectSourceRoot, i18n } = await webpack_browser_config_1.generateI18nBrowserWebpackConfigFromContext(adjustedOptions, context, (wco) => [
        configs_1.getCommonConfig(wco),
        configs_1.getBrowserConfig(wco),
        configs_1.getStylesConfig(wco),
        configs_1.getStatsConfig(wco),
        configs_1.getAnalyticsConfig(wco, context),
        configs_1.getTypeScriptConfig(wco),
        wco.buildOptions.webWorkerTsConfig ? configs_1.getWorkerConfig(wco) : {},
    ], { differentialLoadingNeeded });
    // Validate asset option values if processed directly
    if (((_a = options.assets) === null || _a === void 0 ? void 0 : _a.length) && !((_b = adjustedOptions.assets) === null || _b === void 0 ? void 0 : _b.length)) {
        utils_1.normalizeAssetPatterns(options.assets, core_1.normalize(context.workspaceRoot), core_1.normalize(projectRoot), projectSourceRoot === undefined ? undefined : core_1.normalize(projectSourceRoot)).forEach(({ output }) => {
            if (output.startsWith('..')) {
                throw new Error('An asset cannot be written to a location outside of the output path.');
            }
        });
    }
    let transformedConfig;
    if (webpackConfigurationTransform) {
        transformedConfig = await webpackConfigurationTransform(config);
    }
    if (options.deleteOutputPath) {
        utils_1.deleteOutputDir(context.workspaceRoot, originalOutputPath);
    }
    return { config: transformedConfig || config, projectRoot, projectSourceRoot, i18n };
}
/**
 * @experimental Direct usage of this function is considered experimental.
 */
// eslint-disable-next-line max-lines-per-function
function buildWebpackBrowser(options, context, transforms = {}) {
    var _a;
    const root = core_1.normalize(context.workspaceRoot);
    const projectName = (_a = context.target) === null || _a === void 0 ? void 0 : _a.project;
    if (!projectName) {
        throw new Error('The builder requires a target.');
    }
    const baseOutputPath = path.resolve(context.workspaceRoot, options.outputPath);
    let outputPaths;
    // Check Angular version.
    version_1.assertCompatibleAngularVersion(context.workspaceRoot);
    return rxjs_1.from(context.getProjectMetadata(projectName)).pipe(operators_1.switchMap(async (projectMetadata) => {
        var _a;
        const sysProjectRoot = core_1.getSystemPath(core_1.resolve(core_1.normalize(context.workspaceRoot), core_1.normalize((_a = projectMetadata.root) !== null && _a !== void 0 ? _a : '')));
        const { options: compilerOptions } = read_tsconfig_1.readTsconfig(options.tsConfig, context.workspaceRoot);
        const target = compilerOptions.target || typescript_1.ScriptTarget.ES5;
        const buildBrowserFeatures = new utils_1.BuildBrowserFeatures(sysProjectRoot);
        const isDifferentialLoadingNeeded = buildBrowserFeatures.isDifferentialLoadingNeeded(target);
        checkInternetExplorerSupport(buildBrowserFeatures.supportedBrowsers, context.logger);
        return {
            ...(await initialize(options, context, isDifferentialLoadingNeeded, transforms.webpackConfiguration)),
            buildBrowserFeatures,
            isDifferentialLoadingNeeded,
            target,
        };
    }), operators_1.switchMap(
    // eslint-disable-next-line max-lines-per-function
    ({ config, projectRoot, projectSourceRoot, i18n, buildBrowserFeatures, isDifferentialLoadingNeeded, target, }) => {
        const normalizedOptimization = utils_1.normalizeOptimization(options.optimization);
        return build_webpack_1.runWebpack(config, context, {
            webpackFactory: require('webpack'),
            logging: transforms.logging ||
                ((stats, config) => {
                    if (options.verbose) {
                        context.logger.info(stats.toString(config.stats));
                    }
                }),
        }).pipe(
        // eslint-disable-next-line max-lines-per-function
        operators_1.concatMap(async (buildEvent) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const spinner = new spinner_1.Spinner();
            spinner.enabled = options.progress !== false;
            const { success, emittedFiles = [], outputPath: webpackOutputPath } = buildEvent;
            const webpackRawStats = buildEvent.webpackStats;
            if (!webpackRawStats) {
                throw new Error('Webpack stats build result is required.');
            }
            // Fix incorrectly set `initial` value on chunks.
            const extraEntryPoints = [
                ...helpers_1.normalizeExtraEntryPoints(options.styles || [], 'styles'),
                ...helpers_1.normalizeExtraEntryPoints(options.scripts || [], 'scripts'),
            ];
            const webpackStats = {
                ...webpackRawStats,
                chunks: async_chunks_1.markAsyncChunksNonInitial(webpackRawStats, extraEntryPoints),
            };
            if (!success) {
                // If using bundle downleveling then there is only one build
                // If it fails show any diagnostic messages and bail
                if (stats_1.statsHasWarnings(webpackStats)) {
                    context.logger.warn(stats_1.statsWarningsToString(webpackStats, { colors: true }));
                }
                if (stats_1.statsHasErrors(webpackStats)) {
                    context.logger.error(stats_1.statsErrorsToString(webpackStats, { colors: true }));
                }
                return { success };
            }
            else {
                const processResults = [];
                const bundleInfoStats = [];
                outputPaths = output_paths_1.ensureOutputPaths(baseOutputPath, i18n);
                let noModuleFiles;
                let moduleFiles;
                let files;
                const scriptsEntryPointName = helpers_1.normalizeExtraEntryPoints(options.scripts || [], 'scripts').map((x) => x.bundleName);
                if (isDifferentialLoadingNeeded && options.watch) {
                    moduleFiles = emittedFiles;
                    files = moduleFiles.filter((x) => x.extension === '.css' || (x.name && scriptsEntryPointName.includes(x.name)));
                    if (i18n.shouldInline) {
                        const success = await i18n_inlining_1.i18nInlineEmittedFiles(context, emittedFiles, i18n, baseOutputPath, Array.from(outputPaths.values()), scriptsEntryPointName, webpackOutputPath, target <= typescript_1.ScriptTarget.ES5, options.i18nMissingTranslation);
                        if (!success) {
                            return { success: false };
                        }
                    }
                }
                else if (isDifferentialLoadingNeeded) {
                    moduleFiles = [];
                    noModuleFiles = [];
                    // Common options for all bundle process actions
                    const sourceMapOptions = utils_1.normalizeSourceMaps(options.sourceMap || false);
                    const actionOptions = {
                        optimize: normalizedOptimization.scripts,
                        sourceMaps: sourceMapOptions.scripts,
                        hiddenSourceMaps: sourceMapOptions.hidden,
                        vendorSourceMaps: sourceMapOptions.vendor,
                        integrityAlgorithm: options.subresourceIntegrity ? 'sha384' : undefined,
                    };
                    let mainChunkId;
                    const actions = [];
                    let workerReplacements;
                    const seen = new Set();
                    for (const file of emittedFiles) {
                        // Assets are not processed nor injected into the index
                        if (file.asset) {
                            // WorkerPlugin adds worker files to assets
                            if (file.file.endsWith('.worker.js')) {
                                if (!workerReplacements) {
                                    workerReplacements = [];
                                }
                                workerReplacements.push([
                                    file.file,
                                    file.file.replace(/\-(es20\d{2}|esnext)/, '-es5'),
                                ]);
                            }
                            else {
                                continue;
                            }
                        }
                        // Scripts and non-javascript files are not processed
                        if (file.extension !== '.js' ||
                            (file.name && scriptsEntryPointName.includes(file.name))) {
                            if (files === undefined) {
                                files = [];
                            }
                            files.push(file);
                            continue;
                        }
                        // Ignore already processed files; emittedFiles can contain duplicates
                        if (seen.has(file.file)) {
                            continue;
                        }
                        seen.add(file.file);
                        if (file.name === 'vendor' || (!mainChunkId && file.name === 'main')) {
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            mainChunkId = file.id.toString();
                        }
                        // All files at this point except ES5 polyfills are module scripts
                        const es5Polyfills = file.file.startsWith('polyfills-es5');
                        if (!es5Polyfills) {
                            moduleFiles.push(file);
                        }
                        // Retrieve the content/map for the file
                        // NOTE: Additional future optimizations will read directly from memory
                        let filename = path.join(webpackOutputPath, file.file);
                        const code = fs.readFileSync(filename, 'utf8');
                        let map;
                        if (actionOptions.sourceMaps) {
                            try {
                                map = fs.readFileSync(filename + '.map', 'utf8');
                                if (es5Polyfills || i18n.shouldInline) {
                                    fs.unlinkSync(filename + '.map');
                                }
                            }
                            catch { }
                        }
                        if (es5Polyfills) {
                            fs.unlinkSync(filename);
                            filename = filename.replace(/\-es20\d{2}/, '');
                        }
                        else if (i18n.shouldInline) {
                            // Original files must be deleted with i18n to avoid the original files from
                            // being copied over the translated files when copying the project assets.
                            fs.unlinkSync(filename);
                        }
                        const es2015Polyfills = file.file.startsWith('polyfills-es20');
                        // Record the bundle processing action
                        // The runtime chunk gets special processing for lazy loaded files
                        actions.push({
                            ...actionOptions,
                            filename,
                            code,
                            map,
                            // id is always present for non-assets
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            name: file.id,
                            runtime: file.file.startsWith('runtime'),
                            ignoreOriginal: es5Polyfills,
                            optimizeOnly: es2015Polyfills,
                            // When using i18n, file results are kept in memory for further processing
                            memoryMode: i18n.shouldInline,
                        });
                        // ES2015 polyfills are only optimized; optimization check was performed above
                        if (es2015Polyfills) {
                            continue;
                        }
                        // Add the newly created ES5 bundles to the index as nomodule scripts
                        const newFilename = es5Polyfills
                            ? file.file.replace(/\-es20\d{2}/, '')
                            : file.file.replace(/\-(es20\d{2}|esnext)/, '-es5');
                        noModuleFiles.push({ ...file, file: newFilename });
                    }
                    const processActions = [];
                    let processRuntimeAction;
                    for (const action of actions) {
                        if (options.verbose) {
                            context.logger.info(`[${new Date().toISOString()}] Differential loading file queued: ${action.filename}`);
                        }
                        // If SRI is enabled always process the runtime bundle
                        // Lazy route integrity values are stored in the runtime bundle
                        if (action.integrityAlgorithm && action.runtime) {
                            processRuntimeAction = action;
                        }
                        else {
                            processActions.push({ replacements: workerReplacements, ...action });
                        }
                    }
                    const differentialLoadingExecutor = new action_executor_1.BundleActionExecutor({ cachePath: cacheDownlevelPath, i18n }, options.subresourceIntegrity ? 'sha384' : undefined);
                    // Execute the bundle processing actions
                    try {
                        spinner.start('Generating ES5 bundles for differential loading...');
                        for await (const result of differentialLoadingExecutor.processAll(processActions)) {
                            if (options.verbose) {
                                if (result.original) {
                                    context.logger.info(`[${new Date().toISOString()}] Differential loading file processed: ${result.original.filename}`);
                                }
                                if (result.downlevel) {
                                    context.logger.info(`[${new Date().toISOString()}] Differential loading file processed: ${result.downlevel.filename}`);
                                }
                            }
                            processResults.push(result);
                        }
                    }
                    finally {
                        differentialLoadingExecutor.stop();
                    }
                    // Runtime must be processed after all other files
                    if (processRuntimeAction) {
                        const runtimeOptions = {
                            ...processRuntimeAction,
                            runtimeData: processResults,
                            supportedBrowsers: buildBrowserFeatures.supportedBrowsers,
                        };
                        processResults.push(await Promise.resolve().then(() => __importStar(require('../utils/process-bundle'))).then((m) => m.process(runtimeOptions)));
                    }
                    if (options.verbose) {
                        context.logger.info(`[${new Date().toISOString()}] Differential loading processing complete.`);
                    }
                    spinner.succeed('ES5 bundle generation complete.');
                    if (i18n.shouldInline) {
                        spinner.start('Generating localized bundles...');
                        const inlineActions = [];
                        for (const result of processResults) {
                            if (result.original) {
                                if (options.verbose) {
                                    context.logger.info(`[${new Date().toISOString()}] i18n localize file queued: ${result.original.filename}`);
                                }
                                inlineActions.push({
                                    filename: path.basename(result.original.filename),
                                    // Memory mode is always enabled for i18n
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    code: result.original.content,
                                    map: (_a = result.original.map) === null || _a === void 0 ? void 0 : _a.content,
                                    outputPath: baseOutputPath,
                                    es5: false,
                                    missingTranslation: options.i18nMissingTranslation,
                                    setLocale: result.name === mainChunkId,
                                });
                            }
                            if (result.downlevel) {
                                if (options.verbose) {
                                    context.logger.info(`[${new Date().toISOString()}] i18n localize file queued: ${result.downlevel.filename}`);
                                }
                                inlineActions.push({
                                    filename: path.basename(result.downlevel.filename),
                                    // Memory mode is always enabled for i18n
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    code: result.downlevel.content,
                                    map: (_b = result.downlevel.map) === null || _b === void 0 ? void 0 : _b.content,
                                    outputPath: baseOutputPath,
                                    es5: true,
                                    missingTranslation: options.i18nMissingTranslation,
                                    setLocale: result.name === mainChunkId,
                                });
                            }
                        }
                        let hasErrors = false;
                        const i18nExecutor = new action_executor_1.BundleActionExecutor({ i18n }, options.subresourceIntegrity ? 'sha384' : undefined);
                        try {
                            let localizedCount = 0;
                            for await (const result of i18nExecutor.inlineAll(inlineActions)) {
                                localizedCount++;
                                if (options.verbose) {
                                    context.logger.info(`[${new Date().toISOString()}] (${localizedCount}/${inlineActions.length}) Localized "${result.file}" [${result.count} translation(s)].`);
                                }
                                for (const diagnostic of result.diagnostics) {
                                    spinner.stop();
                                    if (diagnostic.type === 'error') {
                                        hasErrors = true;
                                        context.logger.error(diagnostic.message);
                                    }
                                    else {
                                        context.logger.warn(diagnostic.message);
                                    }
                                    spinner.start();
                                }
                            }
                            // Copy any non-processed files into the output locations
                            await copy_assets_1.copyAssets([
                                {
                                    glob: '**/*',
                                    input: webpackOutputPath,
                                    output: '',
                                },
                            ], Array.from(outputPaths.values()), '');
                        }
                        catch (err) {
                            spinner.fail('Localized bundle generation failed.');
                            return { success: false, error: mapErrorToMessage(err) };
                        }
                        finally {
                            i18nExecutor.stop();
                        }
                        if (hasErrors) {
                            spinner.fail('Localized bundle generation failed.');
                        }
                        else {
                            spinner.succeed('Localized bundle generation complete.');
                        }
                        if (hasErrors) {
                            return { success: false };
                        }
                    }
                    for (const result of processResults) {
                        const chunk = (_c = webpackStats.chunks) === null || _c === void 0 ? void 0 : _c.find((chunk) => { var _a; return ((_a = chunk.id) === null || _a === void 0 ? void 0 : _a.toString()) === result.name; });
                        if (result.original) {
                            bundleInfoStats.push(generateBundleInfoStats(result.original, chunk, 'modern'));
                        }
                        if (result.downlevel) {
                            bundleInfoStats.push(generateBundleInfoStats(result.downlevel, chunk, 'legacy'));
                        }
                    }
                    const unprocessedChunks = ((_d = webpackStats.chunks) === null || _d === void 0 ? void 0 : _d.filter((chunk) => !processResults.find((result) => { var _a; return ((_a = chunk.id) === null || _a === void 0 ? void 0 : _a.toString()) === result.name; }))) || [];
                    for (const chunk of unprocessedChunks) {
                        const asset = (_e = webpackStats.assets) === null || _e === void 0 ? void 0 : _e.find((a) => { var _a; return a.name === ((_a = chunk.files) === null || _a === void 0 ? void 0 : _a[0]); });
                        bundleInfoStats.push(stats_1.generateBundleStats({ ...chunk, size: asset === null || asset === void 0 ? void 0 : asset.size }));
                    }
                }
                else {
                    files = emittedFiles.filter((x) => x.name !== 'polyfills-es5');
                    noModuleFiles = emittedFiles.filter((x) => x.name === 'polyfills-es5');
                    if (i18n.shouldInline) {
                        const success = await i18n_inlining_1.i18nInlineEmittedFiles(context, emittedFiles, i18n, baseOutputPath, Array.from(outputPaths.values()), scriptsEntryPointName, webpackOutputPath, target <= typescript_1.ScriptTarget.ES5, options.i18nMissingTranslation);
                        if (!success) {
                            return { success: false };
                        }
                    }
                }
                // Check for budget errors and display them to the user.
                const budgets = options.budgets;
                if (budgets === null || budgets === void 0 ? void 0 : budgets.length) {
                    const budgetFailures = bundle_calculator_1.checkBudgets(budgets, webpackStats, processResults);
                    for (const { severity, message } of budgetFailures) {
                        switch (severity) {
                            case bundle_calculator_1.ThresholdSeverity.Warning:
                                (_f = webpackStats.warnings) === null || _f === void 0 ? void 0 : _f.push({ message });
                                break;
                            case bundle_calculator_1.ThresholdSeverity.Error:
                                (_g = webpackStats.errors) === null || _g === void 0 ? void 0 : _g.push({ message });
                                break;
                            default:
                                assertNever(severity);
                        }
                    }
                }
                const buildSuccess = success && !stats_1.statsHasErrors(webpackStats);
                if (buildSuccess) {
                    // Copy assets
                    if (!options.watch && ((_h = options.assets) === null || _h === void 0 ? void 0 : _h.length)) {
                        spinner.start('Copying assets...');
                        try {
                            await copy_assets_1.copyAssets(utils_1.normalizeAssetPatterns(options.assets, root, core_1.normalize(projectRoot), projectSourceRoot === undefined ? undefined : core_1.normalize(projectSourceRoot)), Array.from(outputPaths.values()), context.workspaceRoot);
                            spinner.succeed('Copying assets complete.');
                        }
                        catch (err) {
                            spinner.fail(color_1.colors.redBright('Copying of assets failed.'));
                            return { success: false, error: 'Unable to copy assets: ' + err.message };
                        }
                    }
                    if (options.index) {
                        spinner.start('Generating index html...');
                        const WOFFSupportNeeded = !buildBrowserFeatures.isFeatureSupported('woff2');
                        const entrypoints = package_chunk_sort_1.generateEntryPoints({
                            scripts: (_j = options.scripts) !== null && _j !== void 0 ? _j : [],
                            styles: (_k = options.styles) !== null && _k !== void 0 ? _k : [],
                        });
                        const indexHtmlGenerator = new index_html_generator_1.IndexHtmlGenerator({
                            indexPath: path.join(context.workspaceRoot, webpack_browser_config_1.getIndexInputFile(options.index)),
                            entrypoints,
                            deployUrl: options.deployUrl,
                            sri: options.subresourceIntegrity,
                            WOFFSupportNeeded,
                            optimization: normalizedOptimization,
                            crossOrigin: options.crossOrigin,
                            postTransform: transforms.indexHtml,
                        });
                        let hasErrors = false;
                        for (const [locale, outputPath] of outputPaths.entries()) {
                            try {
                                const { content, warnings, errors } = await indexHtmlGenerator.process({
                                    baseHref: getLocaleBaseHref(i18n, locale) || options.baseHref,
                                    // i18nLocale is used when Ivy is disabled
                                    lang: locale || undefined,
                                    outputPath,
                                    files: mapEmittedFilesToFileInfo(files),
                                    noModuleFiles: mapEmittedFilesToFileInfo(noModuleFiles),
                                    moduleFiles: mapEmittedFilesToFileInfo(moduleFiles),
                                });
                                if (warnings.length || errors.length) {
                                    spinner.stop();
                                    warnings.forEach((m) => context.logger.warn(m));
                                    errors.forEach((m) => {
                                        context.logger.error(m);
                                        hasErrors = true;
                                    });
                                    spinner.start();
                                }
                                const indexOutput = path.join(outputPath, webpack_browser_config_1.getIndexOutputFile(options.index));
                                await fs.promises.mkdir(path.dirname(indexOutput), { recursive: true });
                                await fs.promises.writeFile(indexOutput, content);
                            }
                            catch (error) {
                                spinner.fail('Index html generation failed.');
                                return { success: false, error: mapErrorToMessage(error) };
                            }
                        }
                        if (hasErrors) {
                            spinner.fail('Index html generation failed.');
                            return { success: false };
                        }
                        else {
                            spinner.succeed('Index html generation complete.');
                        }
                    }
                    if (options.serviceWorker) {
                        spinner.start('Generating service worker...');
                        for (const [locale, outputPath] of outputPaths.entries()) {
                            try {
                                await service_worker_1.augmentAppWithServiceWorker(root, core_1.normalize(projectRoot), core_1.normalize(outputPath), getLocaleBaseHref(i18n, locale) || options.baseHref || '/', options.ngswConfigPath);
                            }
                            catch (error) {
                                spinner.fail('Service worker generation failed.');
                                return { success: false, error: mapErrorToMessage(error) };
                            }
                        }
                        spinner.succeed('Service worker generation complete.');
                    }
                }
                stats_1.webpackStatsLogger(context.logger, webpackStats, config, bundleInfoStats);
                return { success: buildSuccess };
            }
        }), operators_1.map((event) => ({
            ...event,
            baseOutputPath,
            outputPath: baseOutputPath,
            outputPaths: (outputPaths && Array.from(outputPaths.values())) || [baseOutputPath],
        })));
    }));
    function getLocaleBaseHref(i18n, locale) {
        var _a, _b;
        if (i18n.locales[locale] && ((_a = i18n.locales[locale]) === null || _a === void 0 ? void 0 : _a.baseHref) !== '') {
            return utils_1.urlJoin(options.baseHref || '', (_b = i18n.locales[locale].baseHref) !== null && _b !== void 0 ? _b : `/${locale}/`);
        }
        return undefined;
    }
}
exports.buildWebpackBrowser = buildWebpackBrowser;
function mapErrorToMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return undefined;
}
function assertNever(input) {
    throw new Error(`Unexpected call to assertNever() with input: ${JSON.stringify(input, null /* replacer */, 4 /* tabSize */)}`);
}
function generateBundleInfoStats(bundle, chunk, chunkType) {
    return stats_1.generateBundleStats({
        size: bundle.size,
        files: bundle.map ? [bundle.filename, bundle.map.filename] : [bundle.filename],
        names: chunk === null || chunk === void 0 ? void 0 : chunk.names,
        initial: !!(chunk === null || chunk === void 0 ? void 0 : chunk.initial),
        rendered: true,
        chunkType,
    });
}
function mapEmittedFilesToFileInfo(files = []) {
    const filteredFiles = [];
    for (const { file, name, extension, initial } of files) {
        if (name && initial) {
            filteredFiles.push({ file, extension, name });
        }
    }
    return filteredFiles;
}
function checkInternetExplorerSupport(supportedBrowsers, logger) {
    const hasIE9 = supportedBrowsers.includes('ie 9');
    const hasIE10 = supportedBrowsers.includes('ie 10');
    const hasIE11 = supportedBrowsers.includes('ie 11');
    if (hasIE9 || hasIE10) {
        const browsers = (hasIE9 ? 'IE 9' + (hasIE10 ? ' & ' : '') : '') + (hasIE10 ? 'IE 10' : '');
        logger.warn(`Warning: Support was requested for ${browsers} in the project's browserslist configuration. ` +
            (hasIE9 && hasIE10 ? 'These browsers are' : 'This browser is') +
            ' no longer officially supported with Angular v11 and higher.' +
            '\nFor more information, see https://v10.angular.io/guide/deprecations#ie-9-10-and-mobile');
    }
    if (hasIE11) {
        logger.warn(`Warning: Support was requested for IE 11 in the project's browserslist configuration. ` +
            'IE 11 support is deprecated since Angular v12.' +
            '\nFor more information, see https://angular.io/guide/browser-support');
    }
}
exports.default = architect_1.createBuilder(buildWebpackBrowser);
