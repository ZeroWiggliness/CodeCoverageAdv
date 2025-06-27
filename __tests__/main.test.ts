/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { wait } from '../__fixtures__/wait.js'

// Mock modules before importing
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/wait.js', () => ({ wait }))

const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Set default input values
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'cobertura-file':
          return '__tests__/cobertura.xml'
        case 'output-file':
          return 'coverage/cobertura.out.xml'
        default:
          return ''
      }
    })
  })

  it('should process coverage file successfully', async () => {
    await run()

    // Verify outputs were set
    // expect(core.setOutput).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('should handle missing coverage file', async () => {
    core.getInput.mockImplementation((name: string) =>
      name === 'cobertura-file' ? 'nonexistent.xml' : '500'
    )

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('file not found')
    )
  })

  it('should handle invalid input', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'cobertura-file':
          return '__tests__/invalid.xml'
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('XML parsing error')
    )
  })
})
