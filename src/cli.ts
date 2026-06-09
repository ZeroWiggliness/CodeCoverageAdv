import * as fs from 'fs'
import { parseArgs } from 'node:util'
import { execSync } from 'node:child_process'
import { XMLParser } from 'fast-xml-parser'
import { CoberturaParser } from './cobertura.js'
import micromatch from 'micromatch'
import { createMarkdownAndBadges, writeOutputFile } from './main.js'

async function run(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'cobertura-file': { type: 'string', default: 'coverage/cobertura-coverage.xml' },
      'output-file': { type: 'string', default: '' },
      'main-branch': { type: 'string', default: 'main' },
      'current-branch': { type: 'string', default: '' },
      'file-filters': { type: 'string', default: '**/*.*' },
      'coverage-threshold': { type: 'string', default: '50 75' },
      'coverage-changes-threshold': { type: 'string', default: '50 75' },
      'badge-style': { type: 'string', default: 'flat' },
      'fail-action': { type: 'boolean', default: true },
      'max-missing-lines': { type: 'string', default: '100' },
      'merge-request': { type: 'boolean', default: false },
      'output-json': { type: 'string', default: '' }
    },
    strict: false,
    allowPositionals: false
  })

  const coberturaFile = (values['cobertura-file'] as string) || 'coverage/cobertura-coverage.xml'
  const outputFile = (values['output-file'] as string) || ''
  const mainBranch = (values['main-branch'] as string) || 'main'
  const currentBranch = (values['current-branch'] as string) || process.env['CI_COMMIT_REF_NAME'] || ''
  const fileFilters = (values['file-filters'] as string) || '**/*.*'
  const coverageThresholds = (values['coverage-threshold'] as string) || '50 75'
  const coverageChangeThresholds = (values['coverage-changes-threshold'] as string) || '50 75'
  const badgeStyle = (values['badge-style'] as string) || 'flat'
  const failAction = (values['fail-action'] as boolean) ?? true
  const maxMissingLines = parseInt((values['max-missing-lines'] as string) || '100') || 100
  const outputJson = (values['output-json'] as string) || ''

  // Auto-detect merge-request context: explicit flag, GitLab CI env vars, or differing branches
  const isMergeRequest =
    (values['merge-request'] as boolean) ||
    process.env['CI_PIPELINE_SOURCE'] === 'merge_request_event' ||
    !!process.env['CI_MERGE_REQUEST_IID'] ||
    (currentBranch !== '' && currentBranch !== mainBranch)

  // Collect outputs into a plain object
  const outputs: Record<string, string> = {}
  const outputFn = (key: string, value: string): void => {
    outputs[key] = value
  }

  let failed = false
  const failFn = (msg: string): void => {
    failed = true
    console.error(`Error: ${msg}`)
  }
  const logFn = (msg: string): void => {
    console.log(msg)
  }

  if (!fs.existsSync(coberturaFile)) {
    console.error(`Cobertura file not found: ${coberturaFile}`)
    process.exit(1)
  }

  const xmlContent = fs.readFileSync(coberturaFile, 'utf-8')
  const parser = new XMLParser({
    allowBooleanAttributes: true,
    ignoreAttributes: false,
    attributeNamePrefix: '_'
  })
  let xmlDoc: unknown = null
  try {
    xmlDoc = parser.parse(xmlContent, true)
  } catch {
    console.error('XML parsing error')
    process.exit(1)
  }

  const modifiedCoverage = new CoberturaParser(xmlDoc)
  const originalCoverage = modifiedCoverage.getOriginalCoverage()
  createMarkdownAndBadges(originalCoverage, coverageThresholds, false, maxMissingLines, badgeStyle, failAction, outputFn, failFn, logFn)

  console.log(`Original coverage line rate: ${((originalCoverage['_line-rate'] || 0) * 100).toFixed(1)}%`)

  if (isMergeRequest) {
    let changedFiles: string[] = []
    try {
      const mergeBase = execSync(`git merge-base origin/${mainBranch} HEAD`, { encoding: 'utf-8' }).trim()
      const diffOutput = execSync(`git diff --name-only ${mergeBase}`, { encoding: 'utf-8' }).trim()
      changedFiles = diffOutput ? diffOutput.split('\n').map((f) => f.replace(/\\/g, '/')) : []

      const filterMap = fileFilters.split(',').map((f) => f.trim())
      changedFiles = micromatch(changedFiles, filterMap)
      console.log(`Found ${changedFiles.length} changed files since branch creation with ${mainBranch}`)
    } catch (error) {
      console.warn(`Warning: Failed to get changed files via git: ${error}`)
      changedFiles = []
    }

    const reducedCoverage = modifiedCoverage.parse(changedFiles)
    console.log(`Reduced coverage line rate: ${((reducedCoverage['_line-rate'] || 0) * 100).toFixed(1)}%`)
    createMarkdownAndBadges(reducedCoverage, coverageChangeThresholds, true, maxMissingLines, badgeStyle, failAction, outputFn, failFn, logFn)

    if (outputFile) {
      writeOutputFile(outputFile, reducedCoverage, logFn)
    }
  }

  if (outputJson) {
    const dir = outputJson.lastIndexOf('/') > 0 ? outputJson.substring(0, outputJson.lastIndexOf('/')) : ''
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(outputJson, JSON.stringify(outputs, null, 2), 'utf-8')
    console.log(`Output JSON written to: ${outputJson}`)
  } else {
    console.log(JSON.stringify(outputs, null, 2))
  }

  if (failed) {
    process.exit(1)
  }
}

/* istanbul ignore next */
run().catch((err) => {
  console.error(err)
  process.exit(1)
})
