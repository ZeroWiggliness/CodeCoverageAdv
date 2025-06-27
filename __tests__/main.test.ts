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

import { Octokit } from '@octokit/core';

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
              return Promise.resolve(JSON.parse('{"name":"main","commit":{"sha":"83219c6bb93b1dd25af0db49df2cd32fbadf5f58","node_id":"C_kwDOPAsf-9oAKDgzMjE5YzZiYjkzYjFkZDI1YWYwZGI0OWRmMmNkMzJmYmFkZjVmNTg","commit":{"author":{"name":"Darren Vine","email":"darren.vine@googlemail.com","date":"2025-06-23T21:58:25Z"},"committer":{"name":"GitHub","email":"noreply@github.com","date":"2025-06-23T21:58:25Z"},"message":"Initial commit","tree":{"sha":"0fed120b06c60e55bfcc98226b7ebf6f68ad6cc8","url":"https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/git/trees/0fed120b06c60e55bfcc98226b7ebf6f68ad6cc8"},"url":"https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/git/commits/83219c6bb93b1dd25af0db49df2cd32fbadf5f58","comment_count":0,"verification":{"verified":true,"reason":"valid","signature":"-----BEGIN PGP SIGNATURE-----\n\nwsFcBAABCAAQBQJoWc4BCRC1aQ7uu5UhlAAA05wQAHTmx7MobVyazPWMPCrP0Jfm\nF57d5Nep27iUX53n+8N6yU+kfmxEuyqKXKro6PIad3wSzYNtcl4a5IympSBn982E\nVq2CcKkfhm83GXTVufN3qBrugMVbEwwEtN0VMLwWBPAmmYuDsSINqHZ6pIsS73Z3\nEHzxpVvGS/1FXdmVRnLfINTfDqRikn12EOoDXRgg7oLjj0AMyLYBqMrwF5xTYuPK\nuHeDuERBgdGBemJR5+wpIJAIuMNG3vWMm7RDn5ExF34EgeJI9Qc6otNcgO44TDXB\nJHklt/J8culNHBAkKDaI4+8IOkYbIEqDL7eHvxl89uxa3OehwQusGBrh8aIZ7+cL\n3sdnE/eCAe0rwLVhEDhed4YXODNS++XNvM7UqdPZ5TMGR1tNLFKxFp/3obsupb83\nQlj+T67lHS1d16bWv1n53SpPSYzTzUU5BZGzUERcQ75zvezyPso0oX61Lri/QxLR\nK3fpUivYVGS6BzYEREYGdkYP+VrpafpGIciK0e8OgdF67428ieQ/DaDAs7ZYNYJ3\npwxjhhWdFm930ahwDO2boTw1SoS3J9E0bZ4MjMXxCl79DAPEh6UINknGjYDxFS5U\n3ffeJjNPLYP/7uOJGv9ukd/dSau9Panogb7bKrL38+oD3XfdOTv+aU3BHJ2gGNY/\nas55ed6J0AeMWjGy6YVj\n=1A6I\n-----END PGP SIGNATURE-----\n","payload":"tree 0fed120b06c60e55bfcc98226b7ebf6f68ad6cc8\nauthor Darren Vine <darren.vine@googlemail.com> 1750715905 +0200\ncommitter GitHub <noreply@github.com> 1750715905 +0200\n\nInitial commit","verified_at":"2025-06-23T21:58:26Z"}},"url":"https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/commits/83219c6bb93b1dd25af0db49df2cd32fbadf5f58","html_url":"https://github.com/ZeroWiggliness/CoberturaChangeOnly/commit/83219c6bb93b1dd25af0db49df2cd32fbadf5f58","comments_url":"https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/commits/83219c6bb93b1dd25af0db49df2cd32fbadf5f58/comments","author":{"login":"ZeroWiggliness","id":19473339,"node_id":"MDQ6VXNlcjE5NDczMzM5","avatar_url":"https://avatars.githubusercontent.com/u/19473339?v=4","gravatar_id":"","url":"https://api.github.com/users/ZeroWiggliness","html_url":"https://github.com/ZeroWiggliness","followers_url":"https://api.github.com/users/ZeroWiggliness/followers","following_url":"https://api.github.com/users/ZeroWiggliness/following{/other_user}","gists_url":"https://api.github.com/users/ZeroWiggliness/gists{/gist_id}","starred_url":"https://api.github.com/users/ZeroWiggliness/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/ZeroWiggliness/subscriptions","organizations_url":"https://api.github.com/users/ZeroWiggliness/orgs","repos_url":"https://api.github.com/users/ZeroWiggliness/repos","events_url":"https://api.github.com/users/ZeroWiggliness/events{/privacy}","received_events_url":"https://api.github.com/users/ZeroWiggliness/received_events","type":"User","user_view_type":"public","site_admin":false},"committer":{"login":"web-flow","id":19864447,"node_id":"MDQ6VXNlcjE5ODY0NDQ3","avatar_url":"https://avatars.githubusercontent.com/u/19864447?v=4","gravatar_id":"","url":"https://api.github.com/users/web-flow","html_url":"https://github.com/web-flow","followers_url":"https://api.github.com/users/web-flow/followers","following_url":"https://api.github.com/users/web-flow/following{/other_user}","gists_url":"https://api.github.com/users/web-flow/gists{/gist_id}","starred_url":"https://api.github.com/users/web-flow/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/web-flow/subscriptions","organizations_url":"https://api.github.com/users/web-flow/orgs","repos_url":"https://api.github.com/users/web-flow/repos","events_url":"https://api.github.com/users/web-flow/events{/privacy}","received_events_url":"https://api.github.com/users/web-flow/received_events","type":"User","user_view_type":"public","site_admin":false},"parents":[]},"_links":{"self":"https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/branches/main","html":"https://github.com/ZeroWiggliness/CoberturaChangeOnly/tree/main"},"protected":false,"protection":{"enabled":false,"required_status_checks":{"enforcement_level":"off","contexts":[],"checks":[]}},"protection_url":"https://api.github.com/repos/ZeroWiggliness/CoberturaChangeOnly/branches/main/protection"}'))
            } else {
              return Promise.resolve({
                status: 200,
                data: { files: [{ filename: 'file2.js', status: 'added' }] }
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

  it('should process coverage file successfully', async () => {
    await run()

    // Verify outputs were set
    // expect(core.setOutput).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })
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
