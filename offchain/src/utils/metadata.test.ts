import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeDetailsUrl } from './address';
import {
  EMPTY_BUILDER_FIELDS,
  METADATA_MAX_BYTES,
  buildMetadata,
  fetchMetadata,
  judgeNameMap,
  metadataGatewayUrl,
  metadataMismatch,
  parseMetadata,
  tierLabels,
  validateBuilderFields,
  type BountyMetadata,
} from './metadata';

const JUDGE_A = 'Ad5NzuNtFGG5GfWkSA4fkF3yViQiefv96BeESSMURwqk';
const JUDGE_B = 'GmsZy79Gc9hrSWYBNtKjJzmJw5givGuQqfJMhXjFcJqL';
const JUDGE_C = 'Gvhdkgjg1yonAbdNJ92jFttaFJ9qEo71pwG73GbJ13Ps';

const VALID = {
  schema: 'openbounty.metadata.v1',
  name: 'Longer display name',
  description: 'Line one\n\nLine two',
  hackathon: { name: 'Example Hack 2026', url: 'https://example.org' },
  tiers: [{ index: 0, label: '1st place' }, { index: 1, label: 'Best UI' }],
  judges: [{ address: JUDGE_A, name: 'Alice' }, { address: JUDGE_B, name: 'Bob' }],
  links: [{ label: 'Rules', url: 'https://example.org/rules' }],
};

describe('metadataGatewayUrl', () => {
  it('turns ipfs:// and ar:// into https gateway links', () => {
    expect(metadataGatewayUrl('ipfs://bafyabc/meta.json')).toBe('https://ipfs.io/ipfs/bafyabc/meta.json');
    expect(metadataGatewayUrl('  ar://TxId123 ')).toBe('https://arweave.net/TxId123');
  });

  it('keeps https and rejects everything else', () => {
    expect(metadataGatewayUrl('https://example.org/a.json')).toBe('https://example.org/a.json');
    expect(metadataGatewayUrl('http://example.org/a.json')).toBeNull();
    expect(metadataGatewayUrl('javascript:alert(1)')).toBeNull();
    expect(metadataGatewayUrl('data:text/html,hi')).toBeNull();
    expect(metadataGatewayUrl('ipfs://')).toBeNull();
    expect(metadataGatewayUrl('ar://')).toBeNull();
    expect(metadataGatewayUrl('https://user:pw@example.org')).toBeNull();
    expect(metadataGatewayUrl('')).toBeNull();
  });
});

describe('safeDetailsUrl', () => {
  it('accepts ar:// as well as ipfs:// and http(s)', () => {
    expect(safeDetailsUrl('ar://TxId123')).toBe('https://arweave.net/TxId123');
    expect(safeDetailsUrl('ipfs://cid')).toBe('https://ipfs.io/ipfs/cid');
    expect(safeDetailsUrl('https://a.org')).toBe('https://a.org');
    expect(safeDetailsUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('parseMetadata', () => {
  it('reads a valid v1 file', () => {
    const meta = parseMetadata(VALID);
    expect(meta).not.toBeNull();
    expect(meta?.name).toBe('Longer display name');
    expect(meta?.description).toBe('Line one\n\nLine two');
    expect(meta?.hackathon).toEqual({ name: 'Example Hack 2026', url: 'https://example.org' });
    expect(meta?.tiers).toHaveLength(2);
    expect(meta?.judges).toEqual([{ address: JUDGE_A, name: 'Alice' }, { address: JUDGE_B, name: 'Bob' }]);
    expect(meta?.links).toEqual([{ label: 'Rules', url: 'https://example.org/rules' }]);
  });

  it('rejects other schemas and non-objects', () => {
    expect(parseMetadata({ ...VALID, schema: 'openbounty.metadata.v2' })).toBeNull();
    expect(parseMetadata({ ...VALID, schema: undefined })).toBeNull();
    expect(parseMetadata(null)).toBeNull();
    expect(parseMetadata([VALID])).toBeNull();
    expect(parseMetadata('openbounty.metadata.v1')).toBeNull();
  });

  it('rejects wrong field types', () => {
    expect(parseMetadata({ ...VALID, name: 42 })).toBeNull();
    expect(parseMetadata({ ...VALID, description: { html: '<b>x</b>' } })).toBeNull();
    expect(parseMetadata({ ...VALID, tiers: 'first' })).toBeNull();
    expect(parseMetadata({ ...VALID, tiers: [{ index: '0', label: 'x' }] })).toBeNull();
    expect(parseMetadata({ ...VALID, tiers: [{ index: 1.5, label: 'x' }] })).toBeNull();
    expect(parseMetadata({ ...VALID, judges: [JUDGE_A] })).toBeNull();
    expect(parseMetadata({ ...VALID, links: [{ label: 'x', url: 7 }] })).toBeNull();
    expect(parseMetadata({ ...VALID, hackathon: 'Hack' })).toBeNull();
  });

  it('drops unsafe links and keeps ipfs and ar ones', () => {
    const meta = parseMetadata({
      ...VALID,
      hackathon: { name: 'Hack', url: 'javascript:alert(1)' },
      links: [
        { label: 'Bad', url: 'javascript:alert(1)' },
        { label: 'Plain http', url: 'http://example.org' },
        { label: 'IPFS', url: 'ipfs://cid/rules.pdf' },
        { label: '', url: 'ar://TxId' },
      ],
    });
    expect(meta?.hackathon).toEqual({ name: 'Hack' });
    expect(meta?.links).toEqual([
      { label: 'IPFS', url: 'ipfs://cid/rules.pdf' },
      { label: 'Link', url: 'ar://TxId' },
    ]);
  });

  it('trims long strings, strips control characters and drops invalid judge addresses', () => {
    const meta = parseMetadata({
      ...VALID,
      name: `  ${'n'.repeat(500)}  `,
      description: 'd'.repeat(20_000),
      judges: [{ address: 'not-an-address', name: 'Eve' }, { address: JUDGE_C, name: 'Carol\u0000\u001b[31m' }],
    });
    expect(meta?.name).toHaveLength(120);
    expect(meta?.description).toHaveLength(5000);
    expect(meta?.judges).toEqual([{ address: JUDGE_C, name: 'Carol [31m' }]);
  });

  it('caps the number of links', () => {
    const links = Array.from({ length: 12 }, (_, i) => ({ label: `L${i}`, url: `https://e.org/${i}` }));
    expect(parseMetadata({ ...VALID, links })?.links).toHaveLength(5);
  });

  it('accepts a file with only the schema', () => {
    expect(parseMetadata({ schema: 'openbounty.metadata.v1' })).toEqual({
      schema: 'openbounty.metadata.v1', tiers: [], judges: [], links: [],
    });
  });
});

describe('buildMetadata', () => {
  it('builds a v1 file that parses back the same', () => {
    const meta = buildMetadata(
      { judges: [JUDGE_A, ` ${JUDGE_B} `], tierAmounts: ['2', '1', '0.5'] },
      {
        ...EMPTY_BUILDER_FIELDS,
        name: ' Big hack ',
        description: 'Build things.\nShip them.',
        hackathonName: 'Example Hack',
        hackathonUrl: 'https://example.org',
        judgeNames: { [JUDGE_A]: 'Alice' },
        prizeLabels: ['Grand prize', ''],
        links: [{ label: 'Rules', url: 'ipfs://cid' }, { label: 'Bad', url: 'ftp://x' }],
      },
    );
    expect(meta.name).toBe('Big hack');
    expect(meta.tiers).toEqual([
      { index: 0, label: 'Grand prize' },
      { index: 1, label: '2nd prize' },
      { index: 2, label: '3rd prize' },
    ]);
    expect(meta.judges).toEqual([{ address: JUDGE_A, name: 'Alice' }, { address: JUDGE_B }]);
    expect(meta.links).toEqual([{ label: 'Rules', url: 'ipfs://cid' }]);
    expect(parseMetadata(JSON.parse(JSON.stringify(meta)))).toEqual(meta);
  });

  it('leaves out empty optional fields', () => {
    const meta = buildMetadata({ judges: [], tierAmounts: [] }, EMPTY_BUILDER_FIELDS);
    expect(meta).toEqual({ schema: 'openbounty.metadata.v1', tiers: [], judges: [], links: [] });
  });
});

describe('validateBuilderFields', () => {
  it('flags links that cannot be opened over https', () => {
    const errors = validateBuilderFields({
      ...EMPTY_BUILDER_FIELDS,
      hackathonUrl: 'example.org',
      links: [{ label: 'ok', url: 'https://a.org' }, { label: 'bad', url: 'http://a.org' }, { label: 'x', url: '' }],
    });
    expect(errors.hackathonUrl).toBeDefined();
    expect(errors.hackathonName).toBeDefined();
    expect(errors.links?.[0]).toBeUndefined();
    expect(errors.links?.[1]).toBeDefined();
    expect(errors.links?.[2]).toBeDefined();
    expect(validateBuilderFields(EMPTY_BUILDER_FIELDS)).toEqual({});
  });
});

describe('chain comparison', () => {
  const meta = parseMetadata(VALID) as BountyMetadata;

  it('matches when judges and prize count agree', () => {
    expect(metadataMismatch(meta, { judges: [JUDGE_B, JUDGE_A], tierCount: 2 })).toEqual({ judges: false, tiers: false });
  });

  it('flags different judges or a different number of prizes', () => {
    expect(metadataMismatch(meta, { judges: [JUDGE_A, JUDGE_C], tierCount: 2 }).judges).toBe(true);
    expect(metadataMismatch(meta, { judges: [JUDGE_A], tierCount: 2 }).judges).toBe(true);
    expect(metadataMismatch(meta, { judges: [JUDGE_A, JUDGE_B], tierCount: 3 }).tiers).toBe(true);
    expect(metadataMismatch(meta, { judges: [JUDGE_A, JUDGE_B], tierCount: 1 }).tiers).toBe(true);
  });

  it("doesn't flag a file that lists no judges or prizes", () => {
    const bare = parseMetadata({ schema: 'openbounty.metadata.v1' }) as BountyMetadata;
    expect(metadataMismatch(bare, { judges: [JUDGE_A], tierCount: 4 })).toEqual({ judges: false, tiers: false });
  });

  it('names only the chain judges and labels only chain prizes', () => {
    expect(judgeNameMap(meta, [JUDGE_A, JUDGE_C])).toEqual({ [JUDGE_A]: 'Alice' });
    expect(judgeNameMap(null, [JUDGE_A])).toEqual({});
    expect(tierLabels(meta, 3)).toEqual(['1st place', 'Best UI', null]);
    expect(tierLabels(meta, 1)).toEqual(['1st place']);
  });
});

describe('fetchMetadata', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(response: Response | Error) {
    const fn = vi.fn(async () => {
      if (response instanceof Error) throw response;
      return response;
    });
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it('loads and parses a v1 file through the gateway', async () => {
    const fn = stubFetch(new Response(JSON.stringify(VALID), { headers: { 'content-type': 'application/json' } }));
    const meta = await fetchMetadata('ipfs://cid');
    expect(meta?.name).toBe('Longer display name');
    expect(fn).toHaveBeenCalledWith('https://ipfs.io/ipfs/cid', expect.objectContaining({ credentials: 'omit' }));
  });

  it('quietly returns null for web pages, other JSON and blocked requests', async () => {
    stubFetch(new Response('<html></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } }));
    expect(await fetchMetadata('https://example.org')).toBeNull();
    stubFetch(new Response('not json', { headers: { 'content-type': 'text/plain' } }));
    expect(await fetchMetadata('https://example.org/a.txt')).toBeNull();
    stubFetch(new Response(JSON.stringify({ hello: 'world' })));
    expect(await fetchMetadata('https://example.org/a.json')).toBeNull();
    stubFetch(new TypeError('Failed to fetch'));
    expect(await fetchMetadata('https://example.org/a.json')).toBeNull();
  });

  it("doesn't fetch links that aren't https, ipfs or ar", async () => {
    const fn = stubFetch(new Response('{}'));
    expect(await fetchMetadata('http://example.org/a.json')).toBeNull();
    expect(fn).not.toHaveBeenCalled();
  });

  it('reads JSON served as text/plain or octet-stream', async () => {
    stubFetch(new Response(JSON.stringify(VALID), { headers: { 'content-type': 'application/octet-stream' } }));
    expect((await fetchMetadata('ar://TxId'))?.name).toBe('Longer display name');
    stubFetch(new Response(JSON.stringify(VALID)));
    expect((await fetchMetadata('https://example.org/a.json'))?.name).toBe('Longer display name');
  });

  it('ignores PDFs, images and large non-JSON files', async () => {
    stubFetch(new Response('%PDF-1.7', { headers: { 'content-type': 'application/pdf' } }));
    expect(await fetchMetadata('https://example.org/brief.pdf')).toBeNull();
    const blob = 'x'.repeat(METADATA_MAX_BYTES + 1);
    stubFetch(new Response(blob, { headers: { 'content-type': 'application/octet-stream' } }));
    expect(await fetchMetadata('https://example.org/blob')).toBeNull();
  });

  it('rejects JSON files over the size limit and HTTP errors', async () => {
    const json = { 'content-type': 'application/json' };
    const big = JSON.stringify({ ...VALID, description: 'x'.repeat(METADATA_MAX_BYTES) });
    stubFetch(new Response(big, { headers: json }));
    await expect(fetchMetadata('https://example.org/big.json')).rejects.toThrow(/too large/);
    stubFetch(new Response('{}', { headers: { ...json, 'content-length': String(METADATA_MAX_BYTES + 1) } }));
    await expect(fetchMetadata('https://example.org/big.json')).rejects.toThrow(/too large/);
    stubFetch(new Response('missing', { status: 404 }));
    await expect(fetchMetadata('https://example.org/missing.json')).rejects.toThrow(/404/);
  });
});
