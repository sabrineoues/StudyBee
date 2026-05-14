import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/locale_provider.dart';

class AppLocalizations {
  final Locale locale;

  const AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    final provider = context.watch<LocaleProvider>();
    return AppLocalizations(provider.locale);
  }

  bool get isFrench => locale.languageCode == 'fr';

  String _t(String en, String fr) => isFrench ? fr : en;

  String get appName => _t('StudyBee', 'StudyBee');
  String get welcomeBack => _t('WELCOME BACK', 'BIENVENUE');
  String get signInTitle => _t('Sign in to your nest.', 'Connectez-vous à votre nid.');
  String get signInTitleLine1 => _t('Sign in to', 'Connectez-vous à');
  String get signInTitleLine2 => _t('your nest.', 'votre nid.');
  String get signInSubtitle => _t(
        "Access your family dashboard and track your child's learning journey.",
        'Accédez à votre tableau de bord familial et suivez le parcours scolaire de votre enfant.',
      );
  String get emailAddress => _t('Email Address', 'Adresse e-mail');
  String get password => _t('Password', 'Mot de passe');
  String get forgotPassword => _t('Forgot Password?', 'Mot de passe oublié ?');
  String get signInToDashboard => _t('Sign In to Dashboard', 'Se connecter au tableau de bord');
  String get createFamilyAccount => _t('Create Family Account', 'Créer un compte famille');
  String get joinTheFamily => _t('JOIN THE FAMILY', 'REJOIGNEZ LA FAMILLE');
  String get createYourFamilyAccount => _t('Create your family account.', 'Créez votre compte famille.');
  String get createYourFamilyAccountLine1 => _t('Create your', 'Créez votre');
  String get createYourFamilyAccountLine2 => _t('family account.', 'compte famille.');
  String get createYourFamilyAccountSubtitle => _t(
        "Start tracking progress and supporting your child's learning journey today.",
        "Commencez à suivre les progrès et à accompagner le parcours scolaire de votre enfant dès aujourd'hui.",
      );
  String get fullName => _t('Full Name', 'Nom complet');
  String get enterYourName => _t('Enter your name', 'Saisissez votre nom');
  String get createPassword => _t('Create a password', 'Créez un mot de passe');
  String get confirmPassword => _t('Confirm Password', 'Confirmer le mot de passe');
  String get repeatPassword => _t('Repeat password', 'Répétez le mot de passe');
  String get agreedToTerms => _t('I agree to the Terms of Service and Privacy Policy', 'J’accepte les conditions d’utilisation et la politique de confidentialité');
  String get createAccount => _t('Create Account', 'Créer un compte');
  String get alreadyHaveAccount => _t('Already have an account? ', 'Vous avez déjà un compte ? ');
  String get signIn => _t('Sign In', 'Se connecter');
  String get securityNoteTitle => _t('SECURITY NOTE', 'NOTE DE SÉCURITÉ');
  String get securityNoteBody => _t('Your data is encrypted and only visible to authorized family members.', 'Vos données sont chiffrées et visibles uniquement par les membres autorisés de la famille.');
  String get needHelp => _t('Need help? ', 'Besoin d’aide ? ');
  String get contactSupport => _t('Contact Support', 'Contacter le support');
  String get profile => _t('Profile', 'Profil');
  String get familyDashboard => _t('Family Dashboard', 'Tableau de bord familial');
  String get dashboard => _t('Dashboard', 'Tableau de bord');
  String get progress => _t('Progress', 'Suivi');
  String get settings => _t('Settings', 'Paramètres');
  String get help => _t('Help', 'Aide');
  String get logout => _t('Logout', 'Déconnexion');
  String get maFamille => _t('My Family', 'Ma Famille');
  String get addChild => _t('Add a child', 'Ajouter un enfant');
  String get noChildren => _t('No child linked yet.', 'Aucun enfant associé pour le moment.');
  String get assistanceCenter => _t("Help Center", "Centre d'assistance");
  String get aboutStudyBee => _t('About StudyBee', 'À propos de StudyBee');
  String get aboutStudyBeeDescription => _t(
        'StudyBee is a family-focused learning companion that helps track study sessions, progress, and goals for children. We prioritize privacy and provide simple insights to support learning at home.',
        "StudyBee est un compagnon d’apprentissage axé sur la famille qui aide à suivre les sessions d’étude, les progrès et les objectifs des enfants. Nous privilégions la confidentialité et fournissons des aperçus simples pour soutenir l’apprentissage à la maison.",
      );
  String get viewTracking => _t('View tracking', 'Voir le suivi');
  String get gallery => _t('Gallery', 'Galerie');
  String get camera => _t('Camera', 'Caméra');
  String get avatarUpdated => _t('Profile photo updated', 'Photo de profil mise à jour');
  String get avatarUpdateFailed => _t('Failed to update photo', 'Échec de la mise à jour de la photo');
  String get connectedParent => _t('Parent connected', 'Parent connecté');
  String get userId => _t('User ID', 'ID utilisateur');
  String get versionLabel => _t('Version 2.4.1 - "The Nest" Release', 'Version 2.4.1 - version "The Nest"');
  String get languageEnglish => _t('EN', 'EN');
  String get languageFrench => _t('FR', 'FR');
  String get switchLanguage => _t('Switch language', 'Changer de langue');
  String get dashboardSubtitle => _t(
        "Your child account is ready. Here you can track progress and review updates for one child.",
        "Le compte de votre enfant est prêt. Ici, vous pouvez suivre les progrès et consulter les mises à jour pour un enfant.",
      );
  String get quickStats => _t('Quick stats', 'Statistiques rapides');
  String get sessionsLabel => _t('Sessions', 'Sessions');
  String get progressLabel => progress;
  String get childLabel => _t('Child', 'Enfant');
  String get goalsLabel => _t('Goals', 'Objectifs');
  String get myChild => _t('My child', 'Mon enfant');
  String get recentActivity => _t('Recent activity', 'Activité récente');
  String get studySessionCompleted => _t('Study session completed', 'Session d’étude terminée');
  String get studySessionSubtitle => _t('45 minutes on mathematics and reading.', '45 minutes en mathématiques et lecture.');
  String get newUpdateReceived => _t('New update received', 'Nouvelle mise à jour reçue');
  String get newUpdateSubtitle => _t('A new progress note has been added by the tutor.', 'Une nouvelle note de progression a été ajoutée par le tuteur.');
  String get openChildProgress => _t('Open Child Progress', 'Ouvrir le suivi de l’enfant');

  // Child progress screen
  String get academicInsights => _t('ACADEMIC INSIGHTS', 'APERÇUS ACADÉMIQUES');
  String get learningGrowth => _t('Deep dive into \nlearning growth.', 'Approfondissement\ndu progrès d’apprentissage.');
  String get realTimeAnalytics => _t('Real-time analytics on study patterns and subject mastery.', 'Analyses en temps réel des habitudes d’étude et de la maîtrise des matières.');
  String get totalStudy => _t('TOTAL STUDY', 'ÉTUDE TOTALE');
  String get avgFocus => _t('AVG FOCUS', 'FOCUS MOYEN');
  String get tasksDone => _t('TASKS DONE', 'TÂCHES TERMINÉES');
  String get classRank => _t('CLASS RANK', 'RANG EN CLASSE');
  String get weeklyFocus => _t('Weekly Focus', 'Focus hebdomadaire');
  String get subjectMastery => _t('Subject mastery', 'Maîtrise des matières');
  String get addNote => _t('Add note', 'Ajouter une note');
  String get exportLabel => _t('Export', 'Exporter');
  String get studyStreakFooter => _t('Study streak is strongest on weekdays. Focus is highest between 10 AM and 12 PM.', "La série d’étude est la plus forte en semaine. Le focus est le plus élevé entre 10h et 12h.");
  String get passwordsMismatch => _t('Passwords do not match', 'Les mots de passe ne correspondent pas');
}