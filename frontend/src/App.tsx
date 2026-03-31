import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { JournalPage } from './pages/JournalPage';
import { StudyPage } from './pages/StudyPage';
import { SettingsPage } from './pages/SettingsPage';
import { TipsPage } from './pages/TipsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { TopNavbar } from './components/TopNavbar';

function App() {
  return (
    <Router>
      <TopNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/tips" element={<TipsPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
      </Routes>
    </Router>
  );
}

export default App;
