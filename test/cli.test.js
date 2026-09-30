import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, main } from '../src/cli.js';
import { roles, assignments, people, rules } from './fixtures.js';

const EX = join(fileURLToPath(import.meta.url), '..', '..', 'examples');

function sink() {
  let data = '';
  return { write(s) { data += s; }, get text() { return data; } };
}

async function files(t) {
  const d = await mkdtemp(join(tmpdir(), 'ar-'));
  t.after(() => rm(d, { recursive: true, force: true }));
  await writeFile(join(d, 'roles.json'), JSON.stringify(roles()));
  await writeFile(join(d, 'a.csv'), assignments());
  await writeFile(join(d, 'p.csv'), people());
  await writeFile(join(d, 'rules.json'), JSON.stringify(rules()));
  return d;
}

test('parseArgs', () => {
  const o = parseArgs(['--roles', 'r.json', '--assignments', 'a.csv', '--format', 'csv', '--fail-on-findings']);
  assert.equal(o.roles, 'r.json');
  assert.equal(o.failOnFindings, true);
  assert.throws(() => parseArgs(['--roles', 'r.json']), /are required/);
  assert.throws(() => parseArgs(['--roles', 'r', '--assignments', 'a', '--format', 'xml']), /unknown format/);
  assert.throws(() => parseArgs(['--roles']), /needs a value/);
  assert.throws(() => parseArgs(['--nope', 'x']), /unknown option/);
  assert.equal(parseArgs(['--help']).help, true);
});

test('help', async () => {
  const out = sink();
  assert.equal(await main(['--help'], { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /Nothing is fetched/);
});

test('full review, and --fail-on-findings', async (t) => {
  const d = await files(t);
  const args = ['--roles', join(d, 'roles.json'), '--assignments', join(d, 'a.csv'), '--people', join(d, 'p.csv'), '--rules', join(d, 'rules.json')];
  const out = sink();
  assert.equal(await main(args, { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /Segregation of duties conflicts: 2/);
  const err = sink();
  assert.equal(await main([...args, '--fail-on-findings'], { stdout: sink(), stderr: err }), 1);
  assert.match(err.text, /4 finding\(s\)/);
});

test('markdown to a file', async (t) => {
  const d = await files(t);
  const target = join(d, 'out.md');
  assert.equal(await main(['--roles', join(d, 'roles.json'), '--assignments', join(d, 'a.csv'), '--format', 'markdown', '--output', target], { stdout: sink(), stderr: sink() }), 0);
  assert.match(await readFile(target, 'utf8'), /^## Access review/);
});

test('bad input exits 2 with the reason', async (t) => {
  const d = await files(t);
  await writeFile(join(d, 'bad.json'), '{ nope');
  const err = sink();
  assert.equal(await main(['--roles', join(d, 'bad.json'), '--assignments', join(d, 'a.csv')], { stdout: sink(), stderr: err }), 2);
  assert.match(err.text, /not valid JSON/);
  const err2 = sink();
  assert.equal(await main(['--roles', join(d, 'missing.json'), '--assignments', join(d, 'a.csv')], { stdout: sink(), stderr: err2 }), 2);
  assert.match(err2.text, /cannot read/);
});

test('the example files run', async () => {
  const out = sink();
  const code = await main(['--roles', join(EX, 'roles.json'), '--assignments', join(EX, 'assignments.csv'),
    '--people', join(EX, 'people.csv'), '--rules', join(EX, 'rules.json')], { stdout: out, stderr: sink() });
  assert.equal(code, 0);
  assert.match(out.text, /Segregation of duties conflicts/);
});
