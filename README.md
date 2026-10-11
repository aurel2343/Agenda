# 📅 Agenda ESME — Progressive Web App (PWA)

Application de calendrier scolaire et gestionnaire de tâches pour les étudiants de l'ESME, développée avec **React**, **Vite** et **PWA** (Progressive Web App).  
Installable sur mobile (iOS / Android) et ordinateur (Windows / Mac / Linux), utilisable hors-ligne sans passer par les stores d'applications.

---

## 🚀 Fonctionnalités Clés

1. **Synchronisation d'emploi du temps (.ics)** :
   - Support des liens `webcal://`, `webcals://` et `https://`.
   - Contournement des restrictions CORS via cascade de proxies intégrée (`allorigins`, `codetabs`, `corsproxy`).
   - Parsing avec `ical.js` et attribution d'une couleur stable et unique par matière (gris unifié pour les examens et partiels).
   - Informations complètes : horaires, durée, salle et formateurs.

2. **Affichage du Calendrier** :
   - **Vue Jour** : Grille horaire 8h00 - 20h00 proportionnelle à la durée des cours, centrage automatique sur le cours suivant.
   - **Vue Semaine** : Grille multi-colonnes scrollable horizontalement avec découpage intelligent du titre sur deux lignes.
   - **Support tactile** : Swipe gauche / droite sur **toute la grille** (heures, en-tête des jours, colonnes de cours) et sur la barre de date :
     - en **vue Jour**, il change de jour ;
     - en **vue Semaine**, il change de semaine. Comme la grille défile horizontalement, le swipe change de semaine quand la grille est à son extrémité (gauche pour revenir en arrière, droite pour avancer) ; entre les deux, le geste fait simplement défiler la grille. En changeant de semaine (swipe ou flèches), on arrive sur le **vendredi** de la semaine précédente ou sur le **lundi** de la semaine suivante.
   - **Mode conservé** : ouvrir le détail d'un cours ne change plus de mode, vous restez en vue Jour ou en vue Semaine. Seul un clic sur une zone vide d'une colonne ou sur l'en-tête d'un jour en vue Semaine ouvre ce jour.
   - **Mode Détail en vue Jour** : Affichage compact ou détaillé avec intégration directe des tâches urgentes à l'intérieur du bloc de cours et case à cocher rapide.
   - **Filtres d'affichage** : Option pour masquer les week-ends sans cours, et zoom/échelle de la police personnalisable (0.70x à 2.00x).

3. **Gestionnaire de tâches & Devoirs** :
   - Création et modification de tâches avec 4 niveaux d'importance (Faible, Normale, Haute, Urgente).
   - Mini-calendrier mensuel interactif pour choisir facilement les dates d'échéance.
   - Modals "Toutes les tâches", "Tâches du jour", et sélecteur de matière / catégories personnalisées.
   - Nettoyage automatique des tâches terminées après 12 heures.
   - Notifications de rappels programmées (le jour même à 9h, la veille à 17h, 2 à 4 jours avant).

4. **Expérience PWA & Hors-ligne** :
   - Service Worker pour la mise en cache de l'application : l'agenda reste consultable même sans connexion Internet.
   - Web App Manifest configuré en mode `standalone` (l'application s'ouvre en plein écran sans barre d'adresse de navigateur).

---

## 📂 Structure du Projet

```
agenda-esme-pwa/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Pipeline GitHub Actions (Build & Déploiement auto)
├── public/
│   ├── favicon.svg                 # Favicon vectoriel pour navigateurs web
│   └── icon.svg                    # Icône PWA 512x512 maskable pour smartphone/desktop
├── src/
│   ├── components/
│   │   ├── AllTasksModal.jsx       # Modal listant toutes les tâches (actives et terminées)
│   │   ├── CourseModal.jsx         # Modal de détails d'un cours et de ses devoirs
│   │   ├── CustomCategoryModal.jsx # Saisie d'une catégorie libre pour les tâches
│   │   ├── DayTasksModal.jsx       # Modal listant les tâches d'une journée spécifique
│   │   ├── MiniCalendar.jsx        # Calendrier interactif mensuel
│   │   ├── SettingsView.jsx        # Écran de configuration (ICS, filtres, notifications)
│   │   ├── SubjectPickerModal.jsx  # Sélecteur de matière / cours pour le bouton +
│   │   └── TaskModal.jsx           # Modal de création/édition d'une tâche avec rappels
│   ├── utils/
│   │   ├── icsParser.js            # Téléchargement ICS, cascade de proxies et parsing ICAL
│   │   ├── notifications.js        # Gestionnaire de notifications Web programmées
│   │   └── storage.js              # Abstraction AsyncStorage vers localStorage
│   ├── App.jsx                     # Composant racine : grille horaire, calendrier, navigation
│   ├── index.css                   # Feuille de styles globale (modals, grille, typographie)
│   └── main.jsx                    # Point d'entrée React DOM
├── index.html                      # HTML d'amorce avec balises Apple touch et viewport PWA
├── vite.config.js                  # Configuration Vite avec plugin PWA
└── package.json                    # Dépendances et scripts de build
```

---

## 🛠️ Installation & Démarrage Local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)

### Lancer en développement
```bash
# 1. Cloner ou ouvrir le dossier du projet
cd agenda-esme-pwa

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur local
npm run dev
```
Ouvrez l'adresse indiquée (ex: `http://localhost:5173`) dans votre navigateur.

### Compiler pour la production
```bash
npm run build
npm run preview
```

---

## 📱 Comment installer la PWA sur votre appareil

1. **Sur iPhone (Safari)** :
   - Ouvrez l'URL dans Safari.
   - Appuyez sur l'icône **Partager** (le carré avec une flèche vers le haut).
   - Choisissez **Sur l'écran d'accueil**.
2. **Sur Android (Chrome)** :
   - Ouvrez l'URL dans Chrome.
   - Appuyez sur les **3 points** en haut à droite > **Installer l'application** (ou **Ajouter à l'écran d'accueil**).
3. **Sur Ordinateur (Chrome, Edge, Brave)** :
   - Cliquez sur l'icône d'installation située tout à droite dans la barre d'adresse du navigateur.

---

## 🌐 Déploiement automatique sur GitHub Pages

Le projet inclut un workflow GitHub Actions configuré dans `.github/workflows/deploy.yml`.

Pour déployer :
1. Créez un dépôt sur GitHub et poussez le code (`git push origin main`).
2. Sur GitHub, allez dans **Settings** > **Pages**.
3. Dans **Build and deployment** > **Source**, sélectionnez **GitHub Actions**.
4. Le workflow construira l'application et la déploiera automatiquement sur `https://<votre-pseudo>.github.io/<nom-du-repo>/`.
