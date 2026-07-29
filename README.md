# Membres — application React Native

Une application mobile où l'on crée son compte en entrant simplement son nom : pas de mot de
passe, pas d'e-mail. La session reste enregistrée sur l'appareil, donc on reste connecté.
L'écran principal affiche la liste de tous les utilisateurs inscrits.

```
.
├── app/      application React Native (Expo, TypeScript)
└── server/   API HTTP (Node.js + Express), stockage dans un fichier JSON
```

Le serveur est nécessaire : la liste des utilisateurs est partagée entre tous les appareils,
elle ne peut donc pas vivre uniquement dans le téléphone.

## Ouvrir l'application depuis un téléphone, sans ordinateur

L'API sert aussi la version web de l'application : une fois déployée, **une seule URL** suffit,
à ouvrir dans le navigateur du téléphone (menu ⋮ → « Ajouter à l'écran d'accueil » pour avoir
une icône).

Depuis le navigateur du téléphone :

1. Aller sur [render.com](https://render.com) et créer un compte avec GitHub (offre gratuite,
   pas de carte bancaire).
2. **New** → **Blueprint**, choisir ce dépôt. Render lit `render.yaml` et propose le service
   `membres`. Valider avec **Apply**.
3. Attendre la fin du build (quelques minutes : installation puis export web).
4. Ouvrir l'URL fournie, du type `https://membres-xxxx.onrender.com`. C'est l'application.

À savoir sur l'offre gratuite : le service s'endort après 15 minutes sans visite, le réveil
prend une trentaine de secondes ; et le disque est effacé à chaque redéploiement, donc les
comptes créés disparaissent. Pour les garder, il faut un disque persistant (offre payante) et
pointer `DB_FILE` dessus, ou brancher une vraie base de données.

Le même déploiement fonctionne sur Railway, Koyeb ou Fly.io : commande de build `npm run build`,
commande de démarrage `npm start`.

### Une vraie application Android (APK)

La version web couvre le besoin. Pour une application installable, il faut passer par
[EAS Build](https://docs.expo.dev/build/setup/), qui compile dans le cloud et se déclenche
depuis expo.dev — donc aussi depuis un téléphone. Il faut alors renseigner
`EXPO_PUBLIC_API_URL` avec l'URL du serveur déployé, puisque l'APK n'est plus servi par lui.

## Démarrer en développement

Deux terminaux.

**1. L'API**

```bash
cd server
npm install
npm start          # écoute sur http://localhost:3000
```

Le serveur affiche aussi son adresse sur le réseau local, utile pour un vrai téléphone.

**2. L'application**

```bash
cd app
npm install
npm start          # puis « a » pour Android, « i » pour iOS, « w » pour le navigateur
```

Scannez le QR code avec Expo Go pour lancer l'application sur un téléphone.

### Adresse de l'API côté application

L'application trouve l'API toute seule dans les cas courants :

| Contexte | Adresse utilisée |
| --- | --- |
| Application web déployée | la même origine que la page (rien à configurer) |
| Téléphone via Expo Go | l'IP de la machine qui sert le bundle, port 3000 |
| Émulateur Android | `http://10.0.2.2:3000` |
| iOS / navigateur en développement | `http://localhost:3000` |

Pour pointer ailleurs (serveur distant, port différent), définissez la variable d'environnement
avant `npm start` :

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 npm start
```

L'adresse réellement utilisée est affichée en bas de l'onglet **Profil**.

## Comment ça marche

1. Au premier lancement, l'application demande un nom et appelle `POST /api/users`.
2. Le serveur crée le compte et renvoie un **token** permanent.
3. Le token est stocké sur l'appareil avec AsyncStorage. À chaque lancement, il est relu :
   l'utilisateur est donc connecté à vie, sans mot de passe.
4. Si le serveur est injoignable au démarrage, la session locale est conservée (mode hors ligne).
   Le compte n'est effacé que si le serveur rejette explicitement le token.

Les noms sont uniques (comparaison insensible à la casse et aux accents) et font 2 à 24
caractères.

## API

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | État du serveur et nombre de comptes |
| `POST` | `/api/users` | Crée un compte à partir d'un nom, renvoie l'utilisateur et son token |
| `GET` | `/api/users` | Liste tous les utilisateurs (sans les tokens) |
| `GET` | `/api/me` | Utilisateur courant, identifié par `Authorization: Bearer <token>` |
| `PATCH` | `/api/me` | Renomme l'utilisateur courant |

Les comptes sont stockés dans `server/data/db.json`, créé au premier compte.

## Tests

```bash
npm test                   # 9 tests sur l'API, le stockage et le service de la version web
cd app && npm run typecheck
```

## Build web

```bash
npm run build              # installe tout et exporte app/dist
npm start                  # http://localhost:3000 sert l'API et l'application
```

## Écrans

- **Utilisateurs** — liste de tous les membres, avec la date d'inscription et un badge sur soi.
  Tirez vers le bas pour rafraîchir.
- **Profil** — avatar, date d'inscription, changement de nom, déconnexion.

## Limites connues

Le token tient lieu d'authentification : quiconque le possède est l'utilisateur. C'est le
compromis assumé d'un accès sans mot de passe. Les données sont dans un fichier JSON, ce qui
convient à un petit nombre de comptes ; au-delà, il faudrait une vraie base de données.
