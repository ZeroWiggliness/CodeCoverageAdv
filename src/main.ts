import * as core from '@actions/core'
import * as fs from 'fs'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { CoberturaParser } from './cobertura.js'

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
    const outputFile: string = core.getInput('output-file')
    const mainBranch: string = core.getInput('main-branch')
    const currentBranch: string = core.getInput('current-branch')
    const fileFilters: string = core.getInput('file-filters')

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
    core.info(`Cobertura file: ${coberturaFile}`)

    // Check if the Cobertura file exists
    if (!fs.existsSync(coberturaFile)) {
      throw new Error(`Cobertura file not found: ${coberturaFile}`)
    }

    // Read the XML file
    const xmlContent = fs.readFileSync(coberturaFile, 'utf-8')
    core.debug(`XML content length: ${xmlContent.length}`)

    // Parse the XML
    const parser = new XMLParser({
      allowBooleanAttributes: true
    })
    let xmlDoc: any = null
    try {
      xmlDoc = parser.parse(xmlContent, true)
    } catch {
      throw new Error(`XML parsing error`)
    }

    // console.log(`Parsed XML:`)
    //console.log(xmlDoc)

    const myToken = core.getInput('github-token', { required: true })

    const octokit = github.getOctokit(myToken)

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

    if (context.eventName === 'pull_request') {
      let changedFiles: string[] = []
      try {
        // Get the current HEAD SHA
        const headSha = context.sha
        core.info(`headSha ${headSha}`)

        // Get the master/main branch SHA
        const { data: masterBranch } = await octokit.rest.repos.getBranch({
          owner,
          repo,
          branch: mainBranch
        })
        const masterSha = masterBranch.commit.sha

        core.info(`masterSha ${masterSha}`)
        core.info(`data ${JSON.stringify(masterBranch)}`)

        // Find the merge base (equivalent to git merge-base HEAD origin/master)
        const { data: mergeBase } = await octokit.rest.repos.compareCommits({
          owner,
          repo,
          base: masterSha,
          head: headSha
        })

        core.info(`mergeBase ${JSON.stringify(mergeBase)}`)
        // Get the actual merge base SHA
        const mergeBaseSha = mergeBase.merge_base_commit.sha
        core.info(`mergeBaseSha ${mergeBaseSha}`)

        // Now compare from merge base to HEAD (equivalent to git diff --name-only)
        const { data: comparison } = await octokit.rest.repos.compareCommits({
          owner,
          repo,
          base: mergeBaseSha,
          head: headSha
        })

        core.info(`comparison ${JSON.stringify(comparison)}`)

        // Extract just the file names
        changedFiles = comparison.files?.map((file) => file.filename) || []

        core.info(
          `Found ${changedFiles.length} changed files since merge base with ${mainBranch || 'master'}`
        )
        core.info(`Changed files: ${changedFiles.join(', ')}`)
      } catch (error) {
        core.warning(`Failed to get changed files: ${error}`)
        console.log(`Failed to get changed files: ${error}`)

        // Fallback to empty array or handle differently
        changedFiles = []
      }
    }

    // Log the root element
    const modifiedCoverage = new CoberturaParser(xmlDoc)
    const reducedCoverage = modifiedCoverage.parse([], '*.*')

    const builder = new XMLBuilder({
      arrayNodeName: 'car'
    })
    const output = builder.build(reducedCoverage)

    // Write the modified XML to the output file
    const outputDir = outputFile.substring(0, outputFile.lastIndexOf('/'))
    if (outputDir && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputFile, output, 'utf-8')
    core.info(`Filtered Cobertura file saved to: ${outputFile}`)

    // Set outputs for other workflow steps to use
    //core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
