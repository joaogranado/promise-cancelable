/**
 * Module dependencies.
 */

const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const uglify = require('rollup-plugin-uglify');

/**
 * Config.
 */

const config = {
  exports: 'named',
  format: 'umd',
  moduleName: 'Cancelable',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    resolve({ jsnext: true })
  ]
};

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe_comps: true,
        unsafe: true,
        warnings: false
      }
    })
  );
}

/**
 * Export `config`.
 */

module.exports = config;
