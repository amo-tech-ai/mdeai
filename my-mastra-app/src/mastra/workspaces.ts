/**
 * Mastra Workspace — [Creating a workspace](https://mastra.ai/docs/workspace/overview#creating-a-workspace).
 *
 * `basePath` is anchored to the package root (`MDE_MASTRA_WORKSPACE` optional) — see repo history for cwd caveat.
 *
 * Concierge MVP: **read-only filesystem + skills** only. No `LocalSandbox`, so shell / process workspace tools are
 * never registered ([filesystem-only pattern](https://mastra.ai/docs/workspace/overview)).
 * Mutation tools disabled explicitly ([tool configuration](https://mastra.ai/docs/workspace/overview)).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Workspace, LocalFilesystem, WORKSPACE_TOOLS } from '@mastra/core/workspace';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const workspaceBasePath =
  process.env.MDE_MASTRA_WORKSPACE ?? join(packageRoot, 'workspace');

export const workspace = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: workspaceBasePath,
  }),
  skills: ['skills'],
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: { enabled: false },
    [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: { enabled: false },
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: { enabled: false },
    [WORKSPACE_TOOLS.FILESYSTEM.MKDIR]: { enabled: false },
    [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: { enabled: false },
  },
});
