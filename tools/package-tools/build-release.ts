import {join} from 'path';
import {readdirSync, lstatSync, writeFileSync} from 'fs';
import {mkdirpSync} from 'fs-extra';
import {copyFiles} from './copy-files';
import {addPureAnnotationsToFile} from './pure-annotations';
import {updatePackageVersion} from './package-versions';
import {inlinePackageMetadataFiles} from './metadata-inlining';
import {createTypingsReexportFile} from './typings-reexport';
import {createMetadataReexportFile} from './metadata-reexport';
import {getSecondaryEntryPointsForPackage} from './secondary-entry-points';
import {buildConfig} from './build-config';

const {packagesDir, outputDir, projectDir} = buildConfig;

/** Directory where all bundles will be created in. */
const bundlesDir = join(outputDir, 'bundles');

/**
 * Copies different output files into a folder structure that follows the `angular/angular`
 * release folder structure. The output will also contain a README and the according package.json
 * file. Additionally the package will be Closure Compiler and AOT compatible.
 */
export function composeRelease(packageName: string, options: ReleaseBuildOptions = {}) {
  // To avoid refactoring of the project the package material will map to the source path `lib/`.
  const sourcePath = join(packagesDir, packageName === 'material' ? 'lib' : packageName);
  const packagePath = join(outputDir, 'packages', packageName);
  const releasePath = join(outputDir, 'releases', packageName);

  inlinePackageMetadataFiles(packagePath);

  copyFiles(packagePath, '**/*.+(d.ts|metadata.json)', join(releasePath, 'typings'));
  copyFiles(bundlesDir, `*.umd?(.min).js?(.map)`, join(releasePath, 'bundles'));
  copyFiles(bundlesDir, `${packageName}?(.es5).js?(.map)`, join(releasePath, '@angular'));
  copyFiles(join(bundlesDir, packageName), '**', join(releasePath, '@angular', packageName));
  copyFiles(projectDir, 'LICENSE', releasePath);
  copyFiles(packagesDir, 'README.md', releasePath);
  copyFiles(sourcePath, 'package.json', releasePath);

  updatePackageVersion(releasePath);
  createTypingsReexportFile(releasePath, './typings/index', packageName);
  createMetadataReexportFile(releasePath, './typings/index', packageName);

  if (options.useSecondaryEntryPoints) {
    createFilesForSecondaryEntryPoint(packageName, packagePath, releasePath);
  }

  addPureAnnotationsToFile(join(releasePath, '@angular', `${packageName}.es5.js`));
}

/**
 * Creates files necessary for a secondary entry-point.
 * @param packageName The name of the package for which to create entry-point files.
 * @param packagePath
 * @param releasePath The path to the release package.
 */
function createFilesForSecondaryEntryPoint(packageName: string, packagePath: string, releasePath: string) {
  getSecondaryEntryPointsForPackage(packageName).forEach(entryPointName => {
    // Create a directory in the root of the package for this entry point that contains
    // * A package.json that lists the different bundle locations
    // * An index.d.ts file that re-exports the index.d.ts from the typings/ directory
    // * A metadata.json re-export for this entry-point's metadata.
    const entryPointDir = join(releasePath, entryPointName);
    mkdirpSync(entryPointDir);
    createEntryPointPackageJson(entryPointDir, packageName, entryPointName);

    // Copy typings and metadata from tsc output location into the entry-point.
    copyFiles(packagePath, '**/*.+(d.ts|metadata.json)', join(entryPointDir, 'typings'));

    // Create a typings and a metadata re-export inside the entry-point
    createTypingsReexportFile(entryPointDir, `./typings/${entryPointName}/index`, 'index');
    createMetadataReexportFile(entryPointDir, `./typings/${entryPointName}/index`, 'index');

    // Finally, create both a d.ts and metadata file for this entry-point in the root of
    // the package that re-exports from the entry-point's directory.
    createTypingsReexportFile(releasePath, `./${entryPointName}/index`, entryPointName);
    createMetadataReexportFile(releasePath, `./${entryPointName}/index`, entryPointName);
  });
}


function createEntryPointPackageJson(destDir: string, packageName: string, entryPointName: string) {
  const content = {
    name: `@angular/${packageName}/${entryPointName}`,
    typings: `../${entryPointName}.d.ts`,
    main: `../bundles/${packageName}-${entryPointName}.umd.js`,
    module: `../@angular/${packageName}/${entryPointName}.es5.js`,
    es2015: `../@angular/${packageName}/${entryPointName}.js`,
  };

  writeFileSync(join(destDir, 'package.json'), JSON.stringify(content), 'utf-8');
}


interface ReleaseBuildOptions {
  useSecondaryEntryPoints?: boolean;
}
