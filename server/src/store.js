'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'db.json');

const NAME_MIN = 2;
const NAME_MAX = 24;

/**
 * Petite base de données sur fichier JSON.
 * Suffisant pour cette application : peu d'écritures, pas de concurrence forte.
 */
class Store {
  constructor(file = process.env.DB_FILE || DEFAULT_FILE) {
    this.file = file;
    this.users = [];
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.file, 'utf8');
      const parsed = JSON.parse(raw);
      this.users = Array.isArray(parsed.users) ? parsed.users : [];
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      this.users = [];
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ users: this.users }, null, 2));
    fs.renameSync(tmp, this.file);
  }

  listUsers() {
    return [...this.users]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(publicUser);
  }

  findByToken(token) {
    if (!token) return null;
    return this.users.find((user) => user.token === token) || null;
  }

  findByName(name) {
    const key = normalizeName(name);
    return this.users.find((user) => normalizeName(user.name) === key) || null;
  }

  createUser(name) {
    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      token: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.save();
    return user;
  }

  renameUser(id, name) {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) return null;
    user.name = name.trim();
    this.save();
    return user;
  }
}

/** Retire le token : il ne doit jamais sortir en dehors de la réponse d'inscription. */
function publicUser(user) {
  return { id: user.id, name: user.name, createdAt: user.createdAt };
}

/** Comparaison insensible à la casse et aux accents, pour l'unicité des pseudos. */
function normalizeName(name) {
  return String(name)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** @returns {{ok: true, value: string} | {ok: false, error: string}} */
function validateName(input) {
  if (typeof input !== 'string') {
    return { ok: false, error: 'Le nom est obligatoire.' };
  }
  const value = input.trim().replace(/\s+/g, ' ');
  if (value.length < NAME_MIN) {
    return { ok: false, error: `Le nom doit faire au moins ${NAME_MIN} caractères.` };
  }
  if (value.length > NAME_MAX) {
    return { ok: false, error: `Le nom doit faire au plus ${NAME_MAX} caractères.` };
  }
  if (!/^[\p{L}\p{N} '._-]+$/u.test(value)) {
    return { ok: false, error: 'Le nom contient des caractères non autorisés.' };
  }
  return { ok: true, value };
}

module.exports = { Store, publicUser, normalizeName, validateName, NAME_MIN, NAME_MAX };
