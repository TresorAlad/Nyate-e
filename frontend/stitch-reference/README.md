# Références Stitch (Web Desktop)

Projet source : [Stitch Nyatefe](https://stitch.withgoogle.com/projects/17818269635994070137)

- **Landing (Accueil)** : écran `web_standard` sans sidebar, porté dans `src/views/LandingView.tsx` + `src/components/landing/`.
- **App connectée** : écrans `web_dashboard` avec sidebar (`AppShell`).

L'interface React reprend le **design system** et la **navigation** des écrans Web Desktop Stitch :

| Route app | Écran Stitch | ID écran |
|-----------|--------------|----------|
| Accueil | Nyatefe - Accueil Web Desktop | `a41972d33380448bbde42becfd87bc1c` |
| Tableau de bord | Nyatefe - Tableau de bord Web Desktop | `b69ef4f01c834fa7af13b3594068d398` |
| Assistant | Nyatefe - Assistant Juridique Web Desktop | `e666d8616a3f4d94a8e1aaf066627c24` |
| Bibliothèque | Nyatefe - Bibliothèque Juridique Web Desktop | `ed057a15e1314e8585170ad9fc68c31b` |

Les HTML exportés Stitch peuvent être re-téléchargés via le MCP `download_file` (agent Cursor).

Couleurs : primary `#561618`, background `#f6fed5`, polices **Newsreader** + **Sora**.
