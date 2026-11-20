/** JSON-RPC handler for the Claude connector (MCP over Streamable HTTP, JSON responses). */
const { MCP_SERVER_NAME, MCP_SERVER_VERSION, PROTOCOL_VERSIONS } = require('./config');
const { audit } = require('./store');
const { redact, redactArgs } = require('./redact');
const { ToolError } = require('./errors');
const { allTools } = require('./tools');

const INSTRUCTIONS = `You manage the Jaipurio online shop (Jaipur handicrafts, home decor, textiles) through its admin database.
Call site_info first. Read before you write: get the record, then change only what was asked.
Pages, blogs and city pages are created as drafts; publish only when the owner asks.
Prices, stock, variants, orders, payments and customer details are locked: you cannot change them and contact details are hidden.
Use only real facts from the database or the owner. Never invent prices, reviews, ratings or claims.
Meta titles 50-60 characters, descriptions 140-160, one H1 per page. Never change a slug that is already live without a 301 redirect.
Every call is logged.`;

const listing = (abilities) =>
  allTools()
    .filter((t) => abilities.includes(t.ability))
    .map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema || { type: 'object', properties: {} },
      annotations: {
        readOnlyHint: t.ability === 'read',
        destructiveHint: t.ability === 'delete',
      },
    }));

const result = (id, res) => ({ jsonrpc: '2.0', id, result: res });
const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

const asContent = (value) => {
  const clean = redact(value);
  let text = typeof clean === 'string' ? clean : JSON.stringify(clean, null, 2);
  if (text.length > 200_000) text = `${text.slice(0, 200_000)}\n…[truncated]`;
  const out = { content: [{ type: 'text', text }] };
  if (clean && typeof clean === 'object' && !Array.isArray(clean)) out.structuredContent = clean;
  return out;
};

const callTool = async (params, ctx) => {
  const name = params?.name;
  const args = params?.arguments || {};
  const tool = allTools().find((t) => t.name === name);
  const started = Date.now();
  const base = {
    user: ctx.user.email,
    token: ctx.jti,
    tool: name,
    collectionName: args.collection,
    docId: args.id ? String(args.id) : undefined,
    ip: ctx.ip,
    args: redactArgs(args),
  };
  if (!tool) return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  if (!ctx.abilities.includes(tool.ability)) {
    await audit({ ...base, ok: false, error: `missing ${tool.ability} permission`, ms: 0 });
    return {
      content: [{ type: 'text', text: `This connection does not have the "${tool.ability}" permission. Reconnect and tick it.` }],
      isError: true,
    };
  }
  try {
    const value = await tool.run(args, ctx);
    await audit({ ...base, ok: true, ms: Date.now() - started });
    return asContent(value);
  } catch (e) {
    const msg = e instanceof ToolError ? e.message : `Tool failed: ${e.message}`;
    await audit({ ...base, ok: false, error: msg.slice(0, 500), ms: Date.now() - started });
    if (!(e instanceof ToolError)) console.error(`[mcp] ${name}`, e);
    return { content: [{ type: 'text', text: e.details ? `${msg}\n${JSON.stringify(e.details)}` : msg }], isError: true };
  }
};

/** Handle one JSON-RPC message. Returns a response object, or null for notifications. */
const handleRpc = async (msg, ctx) => {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(msg?.id, -32600, 'Invalid request');
  }
  const isNotification = msg.id === undefined || msg.id === null;
  if (isNotification) return null;
  switch (msg.method) {
    case 'initialize': {
      const asked = msg.params?.protocolVersion;
      return result(msg.id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return result(msg.id, {});
    case 'tools/list':
      return result(msg.id, { tools: listing(ctx.abilities) });
    case 'resources/list':
      return result(msg.id, { resources: [] });
    case 'prompts/list':
      return result(msg.id, { prompts: [] });
    case 'tools/call':
      return result(msg.id, await callTool(msg.params, ctx));
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
};

module.exports = { handleRpc, listing, INSTRUCTIONS };
