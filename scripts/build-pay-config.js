#!/usr/bin/env node
/* ============================================
   Generates js/pay-config.js from the environment.

   Reads PAY_ADMIN_USER / PAY_ADMIN_PASSWORD / PAY_LINK_SECRET
   (from the process environment, or from a local .env file) and writes
   the browser-side config used by the payment pages.

   The admin password itself is never written out - only a PBKDF2 hash.
   The link secret IS written out, because the payment page has to decrypt
   the links in the visitor's browser.

   Run manually:  node scripts/build-pay-config.js
   On Vercel:     set as the project's Build Command.
   ============================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'js', 'pay-config.js');
const PBKDF2_ITERATIONS = 210000;

/* Minimal .env reader - avoids pulling in a dependency for four values. */
function loadDotEnv() {
    for (const name of ['.env.local', '.env']) {
        const file = path.join(ROOT, name);
        if (!fs.existsSync(file)) continue;

        fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(line => {
            const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
            if (!match) return;
            const key = match[1];
            let value = match[2].trim();
            if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
            if (process.env[key] === undefined) process.env[key] = value;
        });
    }
}

function write(config) {
    const banner = [
        '/* ============================================',
        '   GENERATED FILE - DO NOT EDIT, DO NOT COMMIT.',
        '   Produced by scripts/build-pay-config.js from the environment.',
        '   ============================================ */',
        ''
    ].join('\n');

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, banner + 'window.PAY_CONFIG = ' + JSON.stringify(config, null, 4) + ';\n', 'utf8');
}

function main() {
    loadDotEnv();

    const user = (process.env.PAY_ADMIN_USER || '').trim();
    const password = process.env.PAY_ADMIN_PASSWORD || '';
    const secret = process.env.PAY_LINK_SECRET || '';
    const allowPlainParams = process.env.PAY_ALLOW_PLAIN_PARAMS === '1';
    /* Must match CREDIT_CARD_ENVIRONMENT on cars-server, or the embedded
       Grow widget talks to the wrong environment. */
    const growEnvironment = process.env.PAY_GROW_ENVIRONMENT === 'DEV' ? 'DEV' : 'PRODUCTION';

    const missing = [];
    if (!user) missing.push('PAY_ADMIN_USER');
    if (!password) missing.push('PAY_ADMIN_PASSWORD');
    if (!secret) missing.push('PAY_LINK_SECRET');

    if (missing.length) {
        /* Never fail the build over this - the marketing site must still deploy.
           The payment pages detect `configured: false` and say so. */
        console.warn('[pay-config] Missing ' + missing.join(', ') +
            ' - the payment link generator will be disabled. See .env.example.');
        write({ configured: false, allowPlainParams, growEnvironment, version: 1 });
        return;
    }

    /* Random per build: the login hash is recomputed on every deploy anyway. */
    const salt = crypto.randomBytes(16);

    write({
        configured: true,
        version: 1,
        salt: salt.toString('base64'),
        iterations: PBKDF2_ITERATIONS,
        userHash: crypto.createHash('sha256')
            .update(Buffer.concat([salt, Buffer.from(user.toLowerCase(), 'utf8')]))
            .digest('base64'),
        passHash: crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256').toString('base64'),
        linkSecret: secret,
        allowPlainParams,
        growEnvironment
    });

    console.log('[pay-config] Wrote ' + path.relative(ROOT, OUTPUT) +
        (allowPlainParams ? ' (readable /pay params ENABLED)' : ''));
}

main();
