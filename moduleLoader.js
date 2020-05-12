/**
 * If the string contains a trailing slash,
 * make sure we get rid of it.
 * 
 * @param {string} str The string to remove the trailing slash from.
 * @returns {string} The string without trailing slash.
 */
function removeTrailingSlash (str) {
  if (str.slice(-1) === '/') {
    return str.slice(0, -1)
  }
  return str
}

/**
 * Join an arbitrary amount of paths together.
 * 
 * @param  {...string} paths The paths to be joined.
 * @returns {string} The joined path.
 */
function joinPath (...paths) {
  // We need to treat the first item in the paths carefully as it
  // can contain useful information (e.g. "./example" vs "../example" vs "example")
  const [firstPartOfPath, ...restOfPaths] = paths

  let joinedPath = removeTrailingSlash(firstPartOfPath)
  for (let path of restOfPaths) {
    joinedPath = `${joinedPath}/${removeTrailingSlash(path)}`
  }

  return joinedPath
}

/**
 * Clear fanzy extention names from packages.
 * 
 * It's quite common to name your package "something.js",
 * but then not really use the ".js" part in the file names.
 * 
 * @param {string} moduleName The name of the module.
 * @returns {string} The core part of the module name.
 */
function clearExtentions (moduleName) {
  const [coreName] = moduleName.split('.')
  return coreName
}

/**
 * Try to import from multiple different paths.
 * 
 * @param {string[]} possiblePaths The list of paths to try.
 * @returns {Promise<any>} Itself, the module or null.
 */
async function tryMultipleImports (possiblePaths) {
  let [pathToTry, ...remainingPaths] = possiblePaths

  if (pathToTry == null) {
    return null
  }

  let importedModule = null
  try {
    importedModule = await import(pathToTry)
  } catch (error) {
    importedModule = tryMultipleImports(remainingPaths)
  }

  return importedModule
}

/**
 * Load an npm package.
 * 
 * @param {string} module The npm module to load.
 * 
 * @example
 * const { take } = await use('ramda')
 */
function use (module) {
  let rootPath = './node_modules'
  let possiblePathsToModule = [
    joinPath(rootPath, module, 'index.js'),
    joinPath(rootPath, module, 'es', 'index.js'),
    joinPath(rootPath, module, 'dist', `${module}.esm.js`),
    joinPath(rootPath, module, 'dist', `${clearExtentions(module)}.esm.js`),
  ]

  return tryMultipleImports(possiblePathsToModule) || {}
}

// @ts-ignore
window.SpicetifyModuleLoader = { use }
