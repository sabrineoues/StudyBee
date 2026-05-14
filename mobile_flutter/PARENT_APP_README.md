# StudyBee Parent Mobile App

Application Flutter pour le suivi du parcours éducatif des enfants par les parents.

## Structure du Projet

```
lib/
├── main.dart                 # Point d'entrée de l'application
├── models/                   # Modèles de données
│   ├── parent.dart          # Profil parent
│   └── auth_response.dart   # Réponse d'authentification
├── services/                # Services API
│   └── api_service.dart     # Service de communication avec le backend
├── screens/                 # Écrans de l'application
│   ├── signin_screen.dart   # Écran de connexion
│   └── signup_screen.dart   # Écran d'inscription
├── providers/               # State Management (Provider)
│   └── auth_provider.dart   # Gestion de l'authentification
├── widgets/                 # Widgets réutilisables
│   ├── custom_button.dart   # Bouton personnalisé
│   └── custom_text_field.dart # Champ de texte personnalisé
└── utils/                   # Utilitaires
    ├── constants.dart       # Constantes et URLs
    └── app_theme.dart       # Thème de l'application
```

## Fonctionnalités Implémentées

### 1. Authentification
- ✅ Sign In pour les parents
- ✅ Sign Up pour les parents
- ✅ Stockage sécurisé des tokens (Flutter Secure Storage)
- ✅ Gestion de session
- ✅ Validation des formulaires

### 2. UI/UX
- ✅ Design cohérent avec les maquettes
- ✅ Thème personnalisé avec couleurs StudyBee
- ✅ Validation en temps réel
- ✅ Messages d'erreur clairs
- ✅ État de chargement

### 3. State Management
- ✅ Provider pour la gestion d'état
- ✅ Persistence des données de session

## Dépendances

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  http: ^1.1.0                    # Requêtes HTTP
  provider: ^6.0.0                # State Management
  flutter_secure_storage: ^9.0.0  # Stockage sécurisé
  form_validator: ^2.0.0          # Validation
  intl: ^0.19.0                   # Localisation et dates
```

## Installation et Démarrage

### Prérequis
- Flutter SDK >= 3.11.5
- Dart SDK

### Étapes

1. **Cloner le projet**
```bash
git clone <repository-url>
cd mobile_flutter
```

2. **Installer les dépendances**
```bash
flutter pub get
```

3. **Configurer l'URL du backend**
Modifier `lib/utils/constants.dart`:
```dart
static const String baseUrl = 'http://votre-backend-url.com';
```

4. **Lancer l'application**
```bash
flutter run
```

## Configuration du Backend

L'application attend les endpoints suivants:

### Sign Up
```
POST /api/parents/signup/
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "password",
  "password_confirm": "password",
  "first_name": "John",
  "last_name": "Doe"
}

Response (201):
{
  "access": "token_access",
  "refresh": "token_refresh",
  "parent": {
    "id": 1,
    "email": "parent@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Sign In
```
POST /api/parents/signin/
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "password"
}

Response (200):
{
  "access": "token_access",
  "refresh": "token_refresh",
  "parent": {
    "id": 1,
    "email": "parent@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

## Validation des Formulaires

### Sign In
- Email: Requis, format email valide
- Password: Requis, min 8 caractères

### Sign Up
- Full Name: Requis, lettres uniquement
- Email: Requis, format email valide
- Password: Requis, min 8 caractères
- Confirm Password: Doit correspondre à Password
- Terms: Doit être accepté

## Stockage des Données

Les tokens sont stockés de manière sécurisée via `flutter_secure_storage`:
- `access_token`: Token d'accès JWT
- `refresh_token`: Token pour rafraîchir l'accès

## Prochaines Étapes

1. **Dashboard Parent**
   - Liste des enfants
   - Statistiques d'apprentissage
   - Historique des sessions

2. **Profil Enfant**
   - Détails du profil
   - Résumé des performances
   - Évaluations

3. **Notifications**
   - Notifications push
   - Alertes importantes

4. **Paramètres**
   - Gestion du profil
   - Paramètres de notification
   - Langue

## Tests

### Tests d'authentification
```bash
flutter test
```

## Déploiement

### Android
```bash
flutter build apk
```

### iOS
```bash
flutter build ios
```

## Dépannage

### Erreur de connexion
- Vérifier l'URL du backend dans `constants.dart`
- Vérifier que le backend est en cours d'exécution
- Vérifier la connectivité réseau

### Erreurs de validation
- Vérifier les règles de validation dans les champs
- Consulter les messages d'erreur affichés

## Support

Pour toute question ou problème, contactez l'équipe de développement.

## Licence

Ce projet est sous licence MIT.
