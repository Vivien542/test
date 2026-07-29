'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Store, publicUser, validateName } = require('./store');

const DEFAULT_WEB_DIR = path.join(__dirname, '..', '..', 'app', 'dist');

/**
 * Construit l'application Express.
 * @param {{store?: Store, webDir?: string}} options
 */
function createApp({ store = new Store(), webDir = process.env.WEB_DIR || DEFAULT_WEB_DIR } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '16kb' }));

  /** Lit le token « Authorization: Bearer <token> » et attache l'utilisateur à la requête. */
  function authenticate(req, res, next) {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const user = store.findByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session inconnue ou expirée.' });
    }
    req.user = user;
    return next();
  }

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, users: store.listUsers().length });
  });

  // Inscription : un nom suffit, le token renvoyé tient lieu de session permanente.
  app.post('/api/users', (req, res) => {
    const result = validateName(req.body && req.body.name);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    if (store.findByName(result.value)) {
      return res.status(409).json({ error: 'Ce nom est déjà pris, essayez-en un autre.' });
    }
    const user = store.createUser(result.value);
    return res.status(201).json({ user: publicUser(user), token: user.token });
  });

  app.get('/api/users', (req, res) => {
    res.json({ users: store.listUsers() });
  });

  app.get('/api/me', authenticate, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  // Renommage : pratique pour corriger une faute de frappe sans perdre le compte.
  app.patch('/api/me', authenticate, (req, res) => {
    const result = validateName(req.body && req.body.name);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    const existing = store.findByName(result.value);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ error: 'Ce nom est déjà pris, essayez-en un autre.' });
    }
    const user = store.renameUser(req.user.id, result.value);
    return res.json({ user: publicUser(user) });
  });

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Route inconnue.' });
  });

  // Version web de l'application, si elle a ete exportee (npm run build a la racine).
  // Elle est alors servie sur la meme origine que l'API : une seule URL a ouvrir.
  const indexFile = path.join(webDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    app.use(express.static(webDir));
    app.get(/.*/, (req, res) => res.sendFile(indexFile));
  } else {
    app.use((req, res) => {
      res.status(404).json({ error: 'Route inconnue.' });
    });
  }

  // eslint-disable-next-line no-unused-vars -- Express identifie le handler d'erreur par son arité.
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: status === 400 ? 'Requête invalide.' : 'Erreur serveur.' });
  });

  return app;
}

module.exports = { createApp };
