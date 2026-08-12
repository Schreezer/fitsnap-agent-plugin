import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const plugin = JSON.parse(await readFile(path.join(root, 'plugin.json'), 'utf8'));
const mcp = JSON.parse(await readFile(path.join(root, 'mcp.json'), 'utf8'));
const codexPlugin = JSON.parse(
  await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'),
);
const legacyMcp = JSON.parse(await readFile(path.join(root, '.mcp.json'), 'utf8'));

const pluginKeys = new Set([
  '$schema',
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
  'extensions',
]);
for (const key of Object.keys(plugin)) {
  if (!pluginKeys.has(key)) throw new Error(`Unknown plugin.json field: ${key}`);
}
if (plugin.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') {
  throw new Error('plugin.json does not target Agent Plugins v1.0.0.');
}
if (!/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(plugin.name)) {
  throw new Error(`Invalid plugin name: ${plugin.name}`);
}
if (codexPlugin.version !== plugin.version) {
  throw new Error(
    `Codex adapter version ${codexPlugin.version} does not match plugin.json ${plugin.version}.`,
  );
}
if (codexPlugin.mcpServers !== './.mcp.json') {
  throw new Error('Codex adapter must point mcpServers at ./.mcp.json.');
}

if (mcp.$schema !== 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json') {
  throw new Error('mcp.json does not target Agent Plugins v1.0.0.');
}
if (!mcp.mcpServers || typeof mcp.mcpServers !== 'object' || Array.isArray(mcp.mcpServers)) {
  throw new Error('mcp.json must contain an mcpServers object.');
}

const standardServer = mcp.mcpServers.fitsnap;
const legacyServer = legacyMcp.mcpServers?.fitsnap;
if (!standardServer || !legacyServer) {
  throw new Error('Both mcp.json and .mcp.json must define the fitsnap server.');
}
if (standardServer.type !== 'streamable-http') {
  throw new Error(`Unsupported MCP transport for fitsnap: ${standardServer.type}`);
}
if (legacyServer.type !== 'http') {
  throw new Error(`Codex compatibility MCP type must remain "http", got ${legacyServer.type}`);
}
if (standardServer.url !== legacyServer.url) {
  throw new Error('Standard and Codex MCP URLs must match.');
}

for (const [name, server] of Object.entries(mcp.mcpServers)) {
  if (server.type !== 'streamable-http') {
    throw new Error(`Unsupported MCP transport for ${name}: ${server.type}`);
  }
  const url = new URL(server.url);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error(`Unsafe MCP URL for ${name}.`);
  }
}

const requiredSkills = [
  'body-profile-and-recovery',
  'food-logging',
  'workout-logging',
];
const skillsDir = path.join(root, 'skills');
const skillNames = (await readdir(skillsDir)).sort();
if (JSON.stringify(skillNames) !== JSON.stringify(requiredSkills)) {
  throw new Error(`Unexpected skills directory contents: ${skillNames.join(', ')}`);
}
for (const name of skillNames) {
  const skillFile = path.join(skillsDir, name, 'SKILL.md');
  if (!(await stat(skillFile)).isFile()) throw new Error(`Missing skill: ${name}`);
  const content = await readFile(skillFile, 'utf8');
  if (
    !content.startsWith('---\n') ||
    !/^name:\s*\S+/m.test(content) ||
    !/^description:\s*\S+/m.test(content)
  ) {
    throw new Error(`Invalid Agent Skill frontmatter: ${name}`);
  }
  if (
    /bearer\s+token|client_secret|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i.test(
      content,
    )
  ) {
    throw new Error(`Skill contains credential material: ${name}`);
  }
}

const bundleText = [
  await readFile(path.join(root, 'plugin.json'), 'utf8'),
  await readFile(path.join(root, 'mcp.json'), 'utf8'),
  await readFile(path.join(root, '.mcp.json'), 'utf8'),
  await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'),
].join('\n');
if (
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|FITSNAP_RELEASE_PRIVATE_KEY\s*=/i.test(
    bundleText,
  )
) {
  throw new Error('Package manifests must not contain private key material.');
}

console.log(`Validated Agent Plugins package ${plugin.name} ${plugin.version}.`);
