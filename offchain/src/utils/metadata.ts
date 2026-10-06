// The optional bounty details file (`openbounty.metadata.v1`): types, the builder used by
// the create form, a strict parser for files fetched from anywhere, and a size- and
// time-limited loader. Everything read from a file is untrusted: it is shown as plain
// text, links must end up https, and the chain always wins over what the file says.

import { parseAddress } from "./address";
import { placeLabel } from "./format";

export const METADATA_SCHEMA = "openbounty.metadata.v1";
export const METADATA_MAX_BYTES = 256 * 1024;
export const METADATA_TIMEOUT_MS = 5000;

// Longest text kept from a file (and allowed in the builder)
export const METADATA_LIMITS = {
  name: 120,
  description: 5000,
  hackathonName: 120,
  judgeName: 60,
  tierLabel: 60,
  linkLabel: 60,
  url: 500,
  judges: 16,
  tiers: 16,
  links: 5,
} as const;

export interface MetadataLink {
  label: string;
  url: string;    // https, ipfs:// or ar:// as written; use metadataGatewayUrl to open it
}

export interface MetadataJudge {
  address: string;
  name?: string;
}

export interface MetadataTier {
  index: number;
  label: string;
}

export interface BountyMetadata {
  schema: typeof METADATA_SCHEMA;
  name?: string;
  description?: string;
  hackathon?: { name: string; url?: string };
  tiers: MetadataTier[];
  judges: MetadataJudge[];
  links: MetadataLink[];
}

// The builder's own fields, next to the create form
export interface MetadataBuilderFields {
  name: string;
  description: string;
  hackathonName: string;
  hackathonUrl: string;
  judgeNames: Record<string, string>;  // judge address -> display name
  prizeLabels: string[];               // by prize index
  links: MetadataLink[];
}

export type MetadataBuilderErrors = Partial<Record<"hackathonName" | "hackathonUrl", string>> & {
  links?: (string | undefined)[];
};

// The part of the create form the builder reads (blank rows already removed)
export interface MetadataFormValues {
  judges: string[];
  tierAmounts: string[];
}

export const EMPTY_BUILDER_FIELDS: MetadataBuilderFields = {
  name: "",
  description: "",
  hackathonName: "",
  hackathonUrl: "",
  judgeNames: {},
  prizeLabels: [],
  links: [],
};

// "ipfs://<cid>/file.json" -> gateway + "<cid>/file.json"; null when there's no id
function gatewayPath(gateway: string, rest: string): string | null {
  const path = rest.replace(/^\/+/, "");
  return path ? gateway + path : null;
}

// ipfs:// and ar:// -> their https gateway; https stays. Anything else is null.
export function metadataGatewayUrl(uri: string): string | null {
  const text = uri.trim();
  if (text.length > METADATA_LIMITS.url) return null;
  let candidate: string | null = null;
  if (text.startsWith("ipfs://")) candidate = gatewayPath("https://ipfs.io/ipfs/", text.slice("ipfs://".length));
  else if (text.startsWith("ar://")) candidate = gatewayPath("https://arweave.net/", text.slice("ar://".length));
  else if (text.startsWith("https://")) candidate = text;
  if (candidate === null) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) return null;
    return url.href;
  } catch {
    return null;
  }
}

// Remove control characters (keeping newlines and tabs when `multiline`) and trim
function cleanText(text: string, max: number, multiline = false): string {
  const pattern = multiline ? /[\u0000-\u0008\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]+/g;
  const cleaned = text.replace(pattern, multiline ? "" : " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max).trimEnd() : cleaned;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Thrown inside parseMetadata when a field has the wrong type: the whole file is rejected
class WrongType extends Error {}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new WrongType();
  return value;
}

function optionalArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new WrongType();
  return value;
}

function objectItem(value: unknown): Record<string, unknown> {
  if (!isObject(value)) throw new WrongType();
  return value;
}

// Keeps a link only when it can be opened over https
function safeLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  return metadataGatewayUrl(trimmed) ? trimmed : undefined;
}

function parseTiers(value: unknown): MetadataTier[] {
  const tiers: MetadataTier[] = [];
  for (const raw of optionalArray(value).slice(0, METADATA_LIMITS.tiers)) {
    const item = objectItem(raw);
    if (typeof item.index !== "number" || !Number.isInteger(item.index) || item.index < 0) throw new WrongType();
    const label = cleanText(optionalString(item.label) ?? "", METADATA_LIMITS.tierLabel);
    tiers.push({ index: item.index, label });
  }
  return tiers;
}

function parseJudges(value: unknown): MetadataJudge[] {
  const judges: MetadataJudge[] = [];
  for (const raw of optionalArray(value).slice(0, METADATA_LIMITS.judges)) {
    const item = objectItem(raw);
    const address = parseAddress(optionalString(item.address) ?? "");
    const name = cleanText(optionalString(item.name) ?? "", METADATA_LIMITS.judgeName);
    if (!address) continue; // not a Solana address: nothing to match it with
    judges.push(name ? { address, name } : { address });
  }
  return judges;
}

function parseLinks(value: unknown): MetadataLink[] {
  const links: MetadataLink[] = [];
  for (const raw of optionalArray(value)) {
    const item = objectItem(raw);
    const label = cleanText(optionalString(item.label) ?? "", METADATA_LIMITS.linkLabel);
    const url = safeLink(optionalString(item.url));
    if (!url || links.length >= METADATA_LIMITS.links) continue;
    links.push({ label: label || "Link", url });
  }
  return links;
}

// JSON (already parsed) -> metadata, or null when it isn't a valid v1 file.
// Wrong field types reject the whole file; unsafe links are dropped; long text is cut.
export function parseMetadata(json: unknown): BountyMetadata | null {
  if (!isObject(json) || json.schema !== METADATA_SCHEMA) return null;
  try {
    const name = cleanText(optionalString(json.name) ?? "", METADATA_LIMITS.name);
    const description = cleanText(optionalString(json.description) ?? "", METADATA_LIMITS.description, true);

    let hackathon: BountyMetadata["hackathon"];
    if (json.hackathon !== undefined && json.hackathon !== null) {
      const item = objectItem(json.hackathon);
      const hackName = cleanText(optionalString(item.name) ?? "", METADATA_LIMITS.hackathonName);
      const url = safeLink(optionalString(item.url));
      if (hackName) hackathon = url ? { name: hackName, url } : { name: hackName };
    }

    const metadata: BountyMetadata = {
      schema: METADATA_SCHEMA,
      tiers: parseTiers(json.tiers),
      judges: parseJudges(json.judges),
      links: parseLinks(json.links),
    };
    if (name) metadata.name = name;
    if (description) metadata.description = description;
    if (hackathon) metadata.hackathon = hackathon;
    return metadata;
  } catch (err) {
    if (err instanceof WrongType) return null;
    throw err;
  }
}

// Builder errors: a link or hackathon URL that can't be opened over https
export function validateBuilderFields(fields: MetadataBuilderFields): MetadataBuilderErrors {
  const errors: MetadataBuilderErrors = {};
  const badUrl = "Use an https://, ipfs:// or ar:// link.";
  if (fields.hackathonUrl.trim() && !metadataGatewayUrl(fields.hackathonUrl)) errors.hackathonUrl = badUrl;
  if (fields.hackathonUrl.trim() && !fields.hackathonName.trim()) errors.hackathonName = "Add the hackathon's name.";

  const linkErrors = fields.links.map((link) => {
    if (!link.url.trim()) return link.label.trim() ? "Add the link." : undefined;
    return metadataGatewayUrl(link.url) ? undefined : badUrl;
  });
  if (linkErrors.some(Boolean)) errors.links = linkErrors;
  return errors;
}

export function hasBuilderErrors(errors: MetadataBuilderErrors): boolean {
  return Object.keys(errors).length > 0;
}

// The form's judge rows that are real addresses, trimmed and without repeats
export function builderJudges(judges: string[]): string[] {
  const valid = judges.map((judge) => judge.trim()).filter((judge) => parseAddress(judge) !== null);
  return [...new Set(valid)];
}

// The create form's judges and prizes plus the builder fields -> a v1 file.
// Judges and prize count always follow the form, so the file matches the chain.
export function buildMetadata(values: MetadataFormValues, fields: MetadataBuilderFields): BountyMetadata {
  const metadata: BountyMetadata = { schema: METADATA_SCHEMA, tiers: [], judges: [], links: [] };
  const name = cleanText(fields.name, METADATA_LIMITS.name);
  const description = cleanText(fields.description, METADATA_LIMITS.description, true);
  const hackathonName = cleanText(fields.hackathonName, METADATA_LIMITS.hackathonName);
  const hackathonUrl = safeLink(fields.hackathonUrl);
  if (name) metadata.name = name;
  if (description) metadata.description = description;
  if (hackathonName) metadata.hackathon = hackathonUrl ? { name: hackathonName, url: hackathonUrl } : { name: hackathonName };

  // One label per prize, "1st prize" when left blank, so the count matches the chain
  metadata.tiers = values.tierAmounts.map((_, index) => ({
    index,
    label: cleanText(fields.prizeLabels[index] ?? "", METADATA_LIMITS.tierLabel) || placeLabel(index),
  }));

  metadata.judges = builderJudges(values.judges).map((address) => {
    const judgeName = cleanText(fields.judgeNames[address] ?? "", METADATA_LIMITS.judgeName);
    return judgeName ? { address, name: judgeName } : { address };
  });

  for (const link of fields.links) {
    const url = safeLink(link.url);
    if (!url || metadata.links.length >= METADATA_LIMITS.links) continue;
    metadata.links.push({ label: cleanText(link.label, METADATA_LIMITS.linkLabel) || "Link", url });
  }
  return metadata;
}

// What differs from the chain: listed judges must be exactly the chain's judges, and
// listed prize labels must be one per chain prize.
export function metadataMismatch(
  metadata: BountyMetadata,
  chain: { judges: string[]; tierCount: number },
): { judges: boolean; tiers: boolean } {
  const listed = new Set(metadata.judges.map((judge) => judge.address));
  const judges = listed.size > 0 && (listed.size !== chain.judges.length || chain.judges.some((j) => !listed.has(j)));
  const indexes = new Set(metadata.tiers.map((tier) => tier.index));
  const tiers = metadata.tiers.length > 0
    && (metadata.tiers.length !== chain.tierCount || indexes.size !== chain.tierCount
      || metadata.tiers.some((tier) => tier.index >= chain.tierCount));
  return { judges, tiers };
}

// Display names for the chain's judges only
export function judgeNameMap(metadata: BountyMetadata | null, chainJudges: string[]): Record<string, string> {
  const names: Record<string, string> = {};
  if (!metadata) return names;
  for (const judge of metadata.judges) {
    if (judge.name && chainJudges.includes(judge.address)) names[judge.address] = judge.name;
  }
  return names;
}

// A label for each chain prize, or null when the file has none for it
export function tierLabels(metadata: BountyMetadata, tierCount: number): (string | null)[] {
  return Array.from({ length: tierCount }, (_, index) => {
    const tier = metadata.tiers.find((t) => t.index === index && t.label !== "");
    return tier ? tier.label : null;
  });
}

// Content types besides *json that some hosts use for .json files
const READABLE_TYPES = ["text/plain", "application/octet-stream", "binary/octet-stream"];

class TooLarge extends Error {
  constructor() {
    super("The details file is too large.");
  }
}

// Reads at most `maxBytes` of a response body; throws TooLarge when there's more
async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (declared > maxBytes) throw new TooLarge();
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new TooLarge();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

// Fetches and parses the file behind a details link. Resolves null when the link
// isn't a v1 JSON file (a normal web page, or a site that doesn't allow reading it);
// rejects only on a timeout, an HTTP error or a JSON file over the size limit.
export async function fetchMetadata(uri: string): Promise<BountyMetadata | null> {
  const url = metadataGatewayUrl(uri);
  if (!url) return null;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(METADATA_TIMEOUT_MS),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    // A TypeError is a blocked (CORS) or failed request: most web pages end up here
    if (err instanceof TypeError) return null;
    throw err;
  }
  if (!response.ok) throw new Error(`The details file couldn't be loaded (HTTP ${response.status}).`);

  // Only bodies that could be JSON are read; a page, PDF or image link is just not a details file
  const type = (response.headers.get("content-type") ?? "").toLowerCase();
  const declaredJson = type.includes("json");
  if (type && !declaredJson && !READABLE_TYPES.some((readable) => type.startsWith(readable))) {
    await response.body?.cancel();
    return null;
  }

  let text: string;
  try {
    text = await readLimited(response, METADATA_MAX_BYTES);
  } catch (err) {
    // Too large: an error for a JSON file, otherwise just not a details file
    if (err instanceof TooLarge && !declaredJson) return null;
    throw err;
  }
  try {
    return parseMetadata(JSON.parse(text));
  } catch {
    return null;
  }
}
