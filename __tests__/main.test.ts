/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import mockCompareCommitsResponse from './mockCompareCommitsResponse.js'
import mockCompareCommitsResponseDiff from './mockCompareCommitsResponseDiff.js'

// Mock modules before importing
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

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
        case 'main-branch':
          return 'main'
        case 'current-branch':
          return 'feature-branch'
        case 'file-filters':
          return 'src/**,lib/**'
        default:
          return ''
      }
    })

    // mocck all 3 octokit.rest.repos.getBranch calls in main.ts
    let compareCommitsCallCount = 0

    github.getOctokit.mockImplementation(() => ({
      rest: {
        repos: {
          getBranch: jest.fn().mockResolvedValue({
            status: 200,
            data: {
              name: 'main',
              commit: {
                sha: '83219c6bb93b1dd25af0db49df2cd32fbadf5f58',
                commit: {
                  author: {
                    name: 'Darren Vine',
                    email: 'darren.vine@googlemail.com',
                    date: '2025-06-23T21:58:25Z'
                  },
                  committer: {
                    name: 'GitHub',
                    email: 'noreply@github.com',
                    date: '2025-06-23T21:58:25Z'
                  },
                  message: 'Initial commit',
                  tree: {
                    sha: '0fed120b06c60e55bfcc98226b7ebf6f68ad6cc8',
                    url: 'https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/git/trees/0fed120b06c60e55bfcc98226b7ebf6f68ad6cc8'
                  },
                  url: 'https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/git/commits/83219c6bb93b1dd25af0db49df2cd32fbadf5f58',
                  comment_count: 0,
                  verification: {
                    verified: true,
                    reason: 'valid',
                    signature: 'mock-signature',
                    payload: 'mock-payload',
                    verified_at: '2025-06-23T21:58:26Z'
                  }
                }
              }
            }
          } as Octokit.Response<any>),
          compareCommits: jest.fn().mockImplementation(() => {
            compareCommitsCallCount++
            if (compareCommitsCallCount === 1) {
              return Promise.resolve({
                status: 200,
                data: mockCompareCommitsResponse
              })
            } else {
              return Promise.resolve({
                status: 200,
                data: mockCompareCommitsResponseDiff
              })
            }
          })
        }
      }
    }))

    //const getOctokit = jest.fn<typeof github.getOctokit>()
    /*
    github.getOctokit.mockImplementation(() => ({
      rest: {
        repos: {
          getBranch: jest.fn().mockImplementation(requestGetBranch), 
      },),
    ); */

    // Mock the createCommitComment method

    /*
    github.getOctokit.mockImplementation  (() => ({
      rest: { 
        repos: { 
          createCommitComment: jest.fn() } }
    })) */
  })

  it('should not write a file when not specified', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'cobertura-file':
          return '__tests__/cobertura.xml'
        case 'output-file':
          return null
        case 'main-branch':
          return 'main'
        case 'current-branch':
          return 'feature/branch'
        case 'file-filters':
          return 'src/**,lib/**'
        default:
          return ''
      }
    })

    await run()

    // Verify outputs were set
    //expect(core.setOutput).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  /* it('should process coverage file successfully', async () => {
    await run()

    // Verify outputs were set
    // expect(core.setOutput).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })*/
  /*
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
  })*/
})
