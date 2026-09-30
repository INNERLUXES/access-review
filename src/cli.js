// Command line: access-review --roles roles.json --assignments assignments.csv [--people people.csv] [--rules rules.json]
//               [--format text|markdown|json|csv] [--output file] [--fail-on-findings]

import { readFile, writeFile } from 'node:fs/promises';
import { parseRoles, parseAssignments, parsePeople, parseRules } from './input.js';
import { review, findingCount } from './review.js';
import { toText, toMarkdown, toJson, toCsv } from './report.js';

export const USAGE = `access-review --roles <roles.json> --assignments <assignments.csv> [options]

Reviews who can do what: segregation of duties conflicts, people who left but keep access, accounts nobody knows,
privileged users, roles nobody holds, and roles already covered by another. Nothing is fetched; the tool reads files.

Options
  --roles <file>          JSON: role -> list of permissions (required)
  --assignments <file>    CSV with columns user, role (required)
  --people <file>         CSV with columns user, status (active or left), optional department
  --rules <file>          JSON: { "conflicts": [{ "name", "a": [...], "b": [...] }], "privileged": [...] }
  --format <f>            text (default), markdown, json or csv
  --output <file>         write the report to a file
  --fail-on-findings      exit 1 when there is a conflict, a leaver with access or an unknown account
  --help                  this text

Exit codes: 0 done, 1 findings with --fail-on-findings, 2 wrong usage or invalid input.`;

export function parseArgs(argv) {
  const o = { format: 'text', failOnFindings: false };
  const takes = new Set(['--roles', '--assignments', '--people', '--rules', '--format', '--output']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (a === '--fail-on-findings') { o.failOnFindings = true; continue; }
    if (!takes.has(a)) throw new Error(`unknown option: ${a}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`${a} needs a value`);
    o[a.slice(2)] = argv[++i];
  }
  if (o.help) return o;
  if (!o.roles || !o.assignments) throw new Error('--roles and --assignments are required');
  if (!['text', 'markdown', 'json', 'csv'].includes(o.format)) throw new Error(`unknown format: ${o.format}`);
  return o;
}

async function read(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${file}: ${err.message}`);
  }
}

async function readJson(file) {
  const text = await read(file);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${file} is not valid JSON: ${err.message}`);
  }
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let o, result;
  try {
    o = parseArgs(argv);
    if (o.help) { stdout.write(`${USAGE}\n`); return 0; }
    const roles = parseRoles(await readJson(o.roles));
    const assignments = parseAssignments(await read(o.assignments), roles);
    const people = o.people ? parsePeople(await read(o.people)) : null;
    const rules = o.rules ? parseRules(await readJson(o.rules)) : undefined;
    result = review({ roles, assignments, people, ...(rules ? { rules } : {}) });
  } catch (err) {
    stderr.write(`${err.message}\n\n${USAGE}\n`);
    return 2;
  }
  const text = o.format === 'json' ? toJson(result) : o.format === 'csv' ? toCsv(result)
    : o.format === 'markdown' ? toMarkdown(result) : toText(result);
  if (o.output) await writeFile(o.output, `${text}\n`);
  else stdout.write(`${text}\n`);
  if (o.failOnFindings && findingCount(result) > 0) {
    stderr.write(`${findingCount(result)} finding(s)\n`);
    return 1;
  }
  return 0;
}
