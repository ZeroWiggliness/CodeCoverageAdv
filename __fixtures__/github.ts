import type * as github from '@actions/github'
import { jest } from '@jest/globals'

export const getOctokit = jest.fn<typeof github.getOctokit>()
// mock the context object
export const context = {
  repo: {
    owner: 'test-owner',
    repo: 'test-repo'
  },
  eventName: 'pull_request',
  sha: 'test-sha'
} as unknown as github.Context // mock the context object
