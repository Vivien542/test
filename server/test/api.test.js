'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createApp } = require('../src/app');
const { Store } = require('../src/store');

/** Démarre l'API sur un port libre et renvoie un client fetch simplifié. */
async function withServer(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'users-api-'));
  const store = new Store(path.join(dir, 'db.json'));
  const server = createApp({ store }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, url, { body, token } = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  };

  try {
    await run({ call, store, dir });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("crée un compte à partir d'un simple nom", async () => {
  await withServer(async ({ call }) => {
    const res = await call('POST', '/api/users', { body: { name: '  Alice  ' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.name, 'Alice');
    assert.ok(res.body.token);
    assert.equal(res.body.user.token, undefined);
  });
});

test('refuse un nom trop court ou invalide', async () => {
  await withServer(async ({ call }) => {
    assert.equal((await call('POST', '/api/users', { body: { name: 'a' } })).status, 400);
    assert.equal((await call('POST', '/api/users', { body: { name: 'a<b>' } })).status, 400);
    assert.equal((await call('POST', '/api/users', { body: {} })).status, 400);
  });
});

test('refuse un nom déjà pris, même avec une casse ou des accents différents', async () => {
  await withServer(async ({ call }) => {
    await call('POST', '/api/users', { body: { name: 'Eloise' } });
    const res = await call('POST', '/api/users', { body: { name: 'éloïse' } });
    assert.equal(res.status, 409);
  });
});

test('liste tous les utilisateurs sans exposer les tokens', async () => {
  await withServer(async ({ call }) => {
    await call('POST', '/api/users', { body: { name: 'Alice' } });
    await call('POST', '/api/users', { body: { name: 'Bob' } });
    const res = await call('GET', '/api/users');
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.users.map((user) => user.name),
      ['Alice', 'Bob'],
    );
    assert.ok(res.body.users.every((user) => user.token === undefined));
  });
});

test("le token identifie l'utilisateur, sans mot de passe", async () => {
  await withServer(async ({ call }) => {
    const created = await call('POST', '/api/users', { body: { name: 'Alice' } });
    const me = await call('GET', '/api/me', { token: created.body.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.id, created.body.user.id);
    assert.equal((await call('GET', '/api/me', { token: 'faux' })).status, 401);
    assert.equal((await call('GET', '/api/me')).status, 401);
  });
});

test('permet de se renommer mais pas de voler un nom existant', async () => {
  await withServer(async ({ call }) => {
    const alice = await call('POST', '/api/users', { body: { name: 'Alice' } });
    await call('POST', '/api/users', { body: { name: 'Bob' } });

    const renamed = await call('PATCH', '/api/me', {
      token: alice.body.token,
      body: { name: 'Alicia' },
    });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.user.name, 'Alicia');

    const stolen = await call('PATCH', '/api/me', {
      token: alice.body.token,
      body: { name: 'bob' },
    });
    assert.equal(stolen.status, 409);
  });
});

test('les comptes survivent au redémarrage du serveur', async () => {
  await withServer(async ({ call, store }) => {
    await call('POST', '/api/users', { body: { name: 'Alice' } });
    const reloaded = new Store(store.file);
    assert.deepEqual(
      reloaded.listUsers().map((user) => user.name),
      ['Alice'],
    );
  });
});
