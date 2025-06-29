import * as core from '@actions/core'
import * as fs from 'fs'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { CoberturaCoverageData, CoberturaParser } from './cobertura.js'
import micromatch from 'micromatch'

import * as github from '@actions/github'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get inputs from action.yml
    const coberturaFile: string = core.getInput('cobertura-file')
    let outputFile: string | null = core.getInput('output-file')
    const mainBranch: string = core.getInput('main-branch')
    const currentBranch: string = core.getInput('current-branch')
    const fileFilters: string = core.getInput('file-filters')
    const coverageThresholds: string = core.getInput('coverage-threshold')
    const coverageChangeThresholds: string = core.getInput('coverage-changes-threshold')

    const { context } = github
    // For production code
    const { owner, repo } = context.repo

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Reading Cobertura file: ${coberturaFile}`)
    core.debug(`Output file: ${outputFile}`)
    core.debug(`Main branch: ${mainBranch}`)
    core.debug(`Current branch: ${currentBranch}`)
    core.debug(`File filters: ${fileFilters}`)

    // List all files in the current directory
    const files = fs.readdirSync('.')
    //  console.log(`Files in current directory: ${files.join(', ')}`)
    //   console.log(`Current working directory: ${process.cwd()}`)
    //  console.log(`Cobertura file: ${coberturaFile}`)
    core.debug(`Files in current directory: ${files.join(', ')}`)

    // list current directory
    core.debug(`Current working directory: ${process.cwd()}`)

    // output to jest output
    core.debug(`Cobertura file: ${coberturaFile}`)

    // Check if the Cobertura file exists
    if (!fs.existsSync(coberturaFile)) {
      throw new Error(`Cobertura file not found: ${coberturaFile}`)
    }

    // Read the XML file
    const xmlContent = fs.readFileSync(coberturaFile, 'utf-8')
    core.debug(`XML content length: ${xmlContent.length}`)

    // Parse the XML
    const parser = new XMLParser({
      allowBooleanAttributes: true,
      ignoreAttributes: false,
      attributeNamePrefix: '_'
    })
    let xmlDoc: any = null
    try {
      xmlDoc = parser.parse(xmlContent, true)
    } catch {
      throw new Error(`XML parsing error`)
    }

    const modifiedCoverage = new CoberturaParser(xmlDoc)
    const coberuraOriginalCoverage = modifiedCoverage.getOriginalCoverage()
    createMarkdownAndBadges(coberuraOriginalCoverage, coverageThresholds, false)

    core.info(`Original coverage line rate: ${((coberuraOriginalCoverage._lineRate || 0) * 100).toFixed(1)}%`)

    const myToken = core.getInput('github-token', { required: true })
    const octokit = github.getOctokit(myToken)

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});
    let changedFiles = [] as string[]
    core.info(`Context ${context.eventName}`)
    if (context.eventName === 'pull_request') {
      try {
        // Get the current HEAD SHA
        const headSha = context.sha
        core.debug(`headSha ${headSha}`)

        // Get the master/main branch SHA
        const { data: masterBranch } = await octokit.rest.repos.getBranch({
          owner,
          repo,
          branch: mainBranch
        })
        const masterSha = masterBranch.commit.sha

        core.debug(`masterSha ${masterSha}`)
        core.debug(`data ${JSON.stringify(masterBranch)}`)

        // Find the merge base (equivalent to git merge-base HEAD origin/master)
        const { data: mergeBase } = await octokit.rest.repos.compareCommits({
          owner,
          repo,
          base: masterSha,
          head: headSha
        })

        core.debug(`mergeBase ${JSON.stringify(mergeBase)}`)
        // Get the actual merge base SHA
        const mergeBaseSha = mergeBase.merge_base_commit.sha
        core.debug(`mergeBaseSha ${mergeBaseSha}`)

        // Now compare from merge base to HEAD (equivalent to git diff --name-only)
        const { data: comparison } = await octokit.rest.repos.compareCommits({
          owner,
          repo,
          base: mergeBaseSha,
          head: headSha
        })

        core.debug(`comparison ${JSON.stringify(comparison)}`)

        // Extract just the file names
        changedFiles =
          comparison.files?.map((file) => {
            // Change \ to / for consistency
            file.filename = file.filename.replace(/\\/g, '/')
            return file.filename
          }) || []

        // Get a listt of filtered files based on a regex pattern
        const filterMap = fileFilters.split(',').map((f) => f.trim())
        changedFiles = micromatch(changedFiles, filterMap)

        core.info(`Found ${changedFiles.length} changed files since branch creation with ${mainBranch}`)
        core.info(`Changed files: ${changedFiles.join(', ')}`)
      } catch (error) {
        core.warning(`Failed to get changed files: ${error}`)

        // Fallback to empty array or handle differently
        changedFiles = [] as string[]
      }

      // Parse the Cobertura XML and filter based on changed files
      const reducedCoverage = modifiedCoverage.parse(changedFiles)
      core.info(`Reduced coverage line rate: ${((reducedCoverage._lineRate || 0) * 100).toFixed(1)}%`)

      createMarkdownAndBadges(reducedCoverage, coverageChangeThresholds, true)

      if (outputFile != null && outputFile !== '') {
        writeOutputFile(outputFile, reducedCoverage)
      }
    } else {
      if (outputFile !== '') {
        core.warning(`No change coverage file will be generated. Push request not detected.`)
        outputFile = null
      }
    }

    // Set outputs for other workflow steps to use
    //core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

const writeOutputFile = (outputFile: string, reducedCoverage: any): void => {
  const builder = new XMLBuilder({
    suppressBooleanAttributes: false,
    arrayNodeName: 'coverage',
    ignoreAttributes: false,
    attributeNamePrefix: '_',
    format: true
  })
  const outputXml = {
    coverage: reducedCoverage
  }
  outputXml.coverage.sources = reducedCoverage.sources || []

  let output = builder.build(outputXml)
  output = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n' + output

  // Write the modified XML to the output file
  const outputDir = outputFile.substring(0, outputFile.lastIndexOf('/'))
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputFile, output, 'utf-8')
  core.info(`Filtered Cobertura file saved to: ${outputFile}`)
}

function createMarkdownAndBadges(coberuraCoverage: CoberturaCoverageData, coverageThresholds: string, changes: boolean): void {
  // split thresholes by space in to 2 numbers
  const thresholds = coverageThresholds.split(' ').map((t) => parseFloat(t))
  const lineRate = coberuraCoverage._lineRate || 0
  const branchRate = coberuraCoverage._branchRate || 0

  // set health to skull and crossbones if less than thresholds[0], set to amber trafic light if less than thresholds[1], and green traffic light if greater than thresholds[1]
  const healthColor = lineRate >= thresholds[1] * 100 ? 'success' : lineRate >= thresholds[0] * 100 ? 'warning' : 'danger'

  core.setOutput(`coverage${changes ? '-changes' : ''}-badge`, `![Code ${changes ? 'Changes ' : ''}Coverage](https://img.shields.io/badge/Code%20${changes ? 'Changes%20' : ''}Coverage: ${(lineRate * 100).toFixed(1)}%25-${healthColor}?style=${core.getInput('badge-style')})`)

  // Markdown table header
  let markdown = `## Code Coverage Summary\n\n`
  markdown += `| Package | Line Rate | Branch Rate | Health |\n`
  markdown += `| ------- | --------- | ----------- | ------ |\n`

  // Always assume packages is an array
  for (const pkg of coberuraCoverage.packages.package) {
    const pkgLineRate = pkg._lineRate ?? 0
    const pkgBranchRate = pkg._branchRate ?? 0
    const pkgHealthIcon = pkgLineRate * 100 >= thresholds[1] ? '✔' : pkgLineRate * 100 >= thresholds[0] ? '🔶' : '☠'

    markdown += `| ${pkg._name || 'N/A'} | ${(pkgLineRate * 100).toFixed(1)}% | ${(pkgBranchRate * 100).toFixed(1)}% | ${pkgHealthIcon} |\n`
  }

  // Summary row
  const healthIcon = lineRate * 100 >= thresholds[1] ? '✔' : lineRate * 100 >= thresholds[1] ? '🔶' : '☠'
  markdown += `| **Summary** | **${(lineRate * 100).toFixed(1)}%** (${coberuraCoverage._linesCovered} / ${coberuraCoverage._linesValid}) | **${(branchRate * 100).toFixed(1)}%** (${coberuraCoverage._branchesCovered} / ${coberuraCoverage._branchesValid}) | **${healthIcon}** |\n\n`
  markdown += `_Minimum pass threshold is \`${thresholds[0].toFixed(1)}%\`_`

  core.setOutput(`coverage${changes ? '-changes' : ''}-markdown`, markdown)
  core.setOutput(`coverage${changes ? '-changes' : ''}-passrate`, `${(lineRate * 100).toFixed(1)}%`)
  core.setOutput(`coverage${changes ? '-changes' : ''}-failed`, `${lineRate < thresholds[0] * 100}`)

  const failAction = core.getInput('fail-action') === 'true'
  if (failAction && lineRate * 100 < thresholds[0]) {
    core.setFailed(`${changes ? 'Changed ' : ''}Code coverage is below the threshold of ${thresholds[0]}%. Current line rate is ${(lineRate * 100).toFixed(1)}%`)
  } else {
    core.info(`Code coverage is above the threshold of ${thresholds[0]}%. Current line rate is ${(lineRate * 100).toFixed(1)}%`)
  }
}

/*

![Code Coverage](https://img.shields.io/badge/Code%20Coverage-89%25-success?style=flat)

Package | Line Rate | Branch Rate | Complexity | Health
-------- | --------- | ----------- | ---------- | ------
Api | 89% | 100% | NaN | ✔
**Summary** | **89%** (5217 / 5860) | **100%** (0 / 0) | **NaN** | ✔

_Minimum allowed line rate is `75%`_
*/
