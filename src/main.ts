import * as core from '@actions/core'
import * as fs from 'fs'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { CoberturaParser } from './cobertura.js'

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

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Reading Cobertura file: ${coberturaFile}`)
    core.debug(`Output file: ${outputFile}`)
    core.debug(`Main branch: ${mainBranch}`)
    core.debug(`Current branch: ${currentBranch}`)
    core.debug(`File filters: ${fileFilters}`)

    // List all files in the current directory
    const files = fs.readdirSync('.')
    console.log(`Files in current directory: ${files.join(', ')}`)
    console.log(`Current working directory: ${process.cwd()}`)
    console.log(`Cobertura file: ${coberturaFile}`)
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
    } catch (error) {
      throw new Error(`XML parsing error`)
    }

    console.log(`Parsed XML:`)
    console.log(xmlDoc)

    // Log the root element
    const modifiedCoverage = new CoberturaParser(xmlDoc)
    const reducedCoverage = modifiedCoverage.parse()

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
