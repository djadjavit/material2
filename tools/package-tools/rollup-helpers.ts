import {buildConfig} from './build-config';
import {rollupRemoveLicensesPlugin} from './rollup-remove-licenses';

// There are no type definitions available for these imports.
const rollup = require('rollup');
const rollupNodeResolutionPlugin = require('rollup-plugin-node-resolve');

const ROLLUP_GLOBALS = {
  // Import tslib rather than having TypeScript output its helpers multiple times.
  // See https://github.com/Microsoft/tslib
  'tslib': 'tslib',

  // Angular dependencies
  '@angular/animations': 'ng.animations',
  '@angular/core': 'ng.core',
  '@angular/common': 'ng.common',
  '@angular/forms': 'ng.forms',
  '@angular/http': 'ng.http',
  '@angular/platform-browser': 'ng.platformBrowser',
  '@angular/platform-browser-dynamic': 'ng.platformBrowserDynamic',
  '@angular/platform-browser/animations': 'ng.platformBrowser.animations',

  // Local Angular packages inside of Material.
  '@angular/material': 'ng.material',

  // TODO(jelbourn): don't hard-code these
  '@angular/cdk/a11y': 'ng.cdk.a11y',
  '@angular/cdk/bidi': 'ng.cdk.bidi',
  '@angular/cdk/coercion': 'ng.cdk.coercion',
  '@angular/cdk/keyboard': 'ng.cdk.keyboard',
  '@angular/cdk/observe-content': 'ng.cdk.observeContent',
  '@angular/cdk/platform': 'ng.cdk.platform',
  '@angular/cdk/portal': 'ng.cdk.portal',
  '@angular/cdk/rxjs': 'ng.cdk.rxjs',
  '@angular/cdk/table': 'ng.cdk.table',
  '@angular/cdk': 'ng.cdk',

  '@angular/cdk/a11y/index': 'ng.cdk.a11y',
  '@angular/cdk/bidi/index': 'ng.cdk.bidi',
  '@angular/cdk/coercion/index': 'ng.cdk.coercion',
  '@angular/cdk/keyboard/index': 'ng.cdk.keyboard',
  '@angular/cdk/observe-content/index': 'ng.cdk.observeContent',
  '@angular/cdk/platform/index': 'ng.cdk.platform',
  '@angular/cdk/portal/index': 'ng.cdk.portal',
  '@angular/cdk/rxjs/index': 'ng.cdk.rxjs',
  '@angular/cdk/table/index': 'ng.cdk.table',

  // RxJS dependencies
  'rxjs/BehaviorSubject': 'Rx',
  'rxjs/Observable': 'Rx',
  'rxjs/Subject': 'Rx',
  'rxjs/Subscription': 'Rx',
  'rxjs/observable/combineLatest': 'Rx.Observable',
  'rxjs/observable/forkJoin': 'Rx.Observable',
  'rxjs/observable/fromEvent': 'Rx.Observable',
  'rxjs/observable/merge': 'Rx.Observable',
  'rxjs/observable/of': 'Rx.Observable',
  'rxjs/observable/throw': 'Rx.Observable',
  'rxjs/operator/auditTime': 'Rx.Observable.prototype',
  'rxjs/operator/catch': 'Rx.Observable.prototype',
  'rxjs/operator/debounceTime': 'Rx.Observable.prototype',
  'rxjs/operator/do': 'Rx.Observable.prototype',
  'rxjs/operator/filter': 'Rx.Observable.prototype',
  'rxjs/operator/finally': 'Rx.Observable.prototype',
  'rxjs/operator/first': 'Rx.Observable.prototype',
  'rxjs/operator/let': 'Rx.Observable.prototype',
  'rxjs/operator/map': 'Rx.Observable.prototype',
  'rxjs/operator/share': 'Rx.Observable.prototype',
  'rxjs/operator/startWith': 'Rx.Observable.prototype',
  'rxjs/operator/switchMap': 'Rx.Observable.prototype',
  'rxjs/operator/takeUntil': 'Rx.Observable.prototype',
  'rxjs/operator/toPromise': 'Rx.Observable.prototype',

  // RxJS imports for the examples package
  'rxjs/add/observable/merge': 'Rx.Observable',
  'rxjs/add/observable/fromEvent': 'Rx.Observable',
  'rxjs/add/operator/startWith': 'Rx.Observable.prototype',
  'rxjs/add/operator/map': 'Rx.Observable.prototype',
  'rxjs/add/operator/debounceTime': 'Rx.Observable.prototype',
  'rxjs/add/operator/distinctUntilChanged': 'Rx.Observable.prototype',
};

export type BundleConfig = {
  entry: string;
  dest: string;
  format: string;
  moduleName: string;
};

/** Creates a rollup bundle of a specified JavaScript file.*/
export function createRollupBundle(config: BundleConfig): Promise<any> {
  const bundleOptions = {
    context: 'this',
    external: Object.keys(ROLLUP_GLOBALS),
    entry: config.entry,
    plugins: [rollupRemoveLicensesPlugin]
  };

  const writeOptions = {
    // Keep the moduleId empty because we don't want to force developers to a specific moduleId.
    moduleId: '',
    moduleName: config.moduleName || 'ng.material',
    banner: buildConfig.licenseBanner,
    format: config.format,
    dest: config.dest,
    globals: ROLLUP_GLOBALS,
    sourceMap: true
  };

  // When creating a UMD, we want to exclude tslib from the `external` bundle option so that it
  // is inlined into the bundle.
  if (config.format === 'umd') {
    bundleOptions.plugins.push(rollupNodeResolutionPlugin());

    const external = Object.keys(ROLLUP_GLOBALS);
    external.splice(external.indexOf('tslib'), 1);
    bundleOptions.external = external;
  }

  return rollup.rollup(bundleOptions).then((bundle: any) => bundle.write(writeOptions));
}
