// Turns the program's IDL (../idl/openbounty_v2.json) into a typed TypeScript
// client in src/generated/openbounty. Run `npm run generate:client` after every
// `git pull` that changed idl/. Never edit the generated files by hand.
import { readFileSync } from 'node:fs';
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';

const idlUrl = new URL('../../idl/openbounty_v2.json', import.meta.url);
const idl = JSON.parse(readFileSync(idlUrl, 'utf8'));

await createFromRoot(rootNodeFromAnchor(idl)).accept(
  renderVisitor('.', { generatedFolder: 'src/generated/openbounty', syncPackageJson: false }),
);
console.log(`Generated src/generated/openbounty from idl/openbounty_v2.json (IDL version ${idl.metadata.version})`);
