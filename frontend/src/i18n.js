import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Dashboard
      dashboard: 'Dashboard',
      welcome: 'Welcome back',
      readyToStudy: 'Ready to study?',
      uploadNotes: 'Upload Notes',
      myNotes: 'My Notes',
      takeQuiz: 'Take Quiz',
      myResults: 'My Results',
      mathSolver: 'Math Solver',
      studyGroups: 'Study Groups',
      examCountdown: 'Exam Countdown',
      upgradePro: 'Upgrade to Pro',
      profile: 'Profile',
      signOut: 'Sign Out',
      notesUploaded: 'Notes Uploaded',
      quizzesTaken: 'Quizzes Taken',
      averageScore: 'Average Score',
      studyStreak: 'Study Streak',
      mySubjects: 'My Subjects',
      quickActions: 'Quick Actions',
      recentNotes: 'Recent Notes',
      viewAll: 'View All',
      noNotesYet: 'No notes yet. Upload your first note!',
      uploadNotesNow: 'Upload Notes Now',
      keepPushing: 'Keep Pushing',
      // Login
      welcomeBack: 'Welcome Back!',
      signInToContinue: 'Sign in to continue studying',
      emailAddress: 'Email Address',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      signIn: 'Sign In',
      noAccount: "Don't have an account?",
      createAccount: 'Create Account',
      // Register
      createYourAccount: 'Create Account',
      fillDetails: 'Fill in your details to get started',
      fullName: 'Full Name',
      university: 'University Name',
      confirmPassword: 'Confirm Password',
      alreadyHaveAccount: 'Already have an account?',
    }
  },
  fr: {
    translation: {
      // Dashboard
      dashboard: 'Tableau de bord',
      welcome: 'Bon retour',
      readyToStudy: 'Prêt à étudier?',
      uploadNotes: 'Télécharger des notes',
      myNotes: 'Mes notes',
      takeQuiz: 'Faire un quiz',
      myResults: 'Mes résultats',
      mathSolver: 'Solveur mathématique',
      studyGroups: "Groupes d'étude",
      examCountdown: "Compte à rebours d'examen",
      upgradePro: 'Passer au Pro',
      profile: 'Profil',
      signOut: 'Se déconnecter',
      notesUploaded: 'Notes téléchargées',
      quizzesTaken: 'Quiz effectués',
      averageScore: 'Score moyen',
      studyStreak: "Série d'étude",
      mySubjects: 'Mes matières',
      quickActions: 'Actions rapides',
      recentNotes: 'Notes récentes',
      viewAll: 'Voir tout',
      noNotesYet: 'Aucune note. Téléchargez votre première note!',
      uploadNotesNow: 'Télécharger maintenant',
      keepPushing: 'Continuez à avancer',
      // Login
      welcomeBack: 'Bon retour!',
      signInToContinue: 'Connectez-vous pour continuer',
      emailAddress: 'Adresse e-mail',
      password: 'Mot de passe',
      forgotPassword: 'Mot de passe oublié?',
      signIn: 'Se connecter',
      noAccount: "Vous n'avez pas de compte?",
      createAccount: 'Créer un compte',
      // Register
      createYourAccount: 'Créer un compte',
      fillDetails: 'Remplissez vos informations',
      fullName: 'Nom complet',
      university: "Nom de l'université",
      confirmPassword: 'Confirmer le mot de passe',
      alreadyHaveAccount: 'Vous avez déjà un compte?',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;