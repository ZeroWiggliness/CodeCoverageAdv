// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const sharedPlugins = () => [typescript(), nodeResolve({ preferBuiltins: true }), commonjs()]

const config = [
  {
    input: 'src/index.ts',
    output: {
      esModule: true,
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true
    },
    plugins: sharedPlugins()
  },
  {
    input: 'src/cli.ts',
    output: {
      banner: '#!/usr/bin/env node',
      file: 'dist/cca.js',
      format: 'es',
      sourcemap: true
    },
    plugins: sharedPlugins()
  }
]

export default config
