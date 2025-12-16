import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ConsultantInterface from './components/ConsultantInterface';
import StrainCard from './components/StrainCard';
import LandingPage from './components/LandingPage';
import StrainLibrary from './components/StrainLibrary';
import DispensaryList from './components/DispensaryList';
import Background from './components/Background';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import AppSettings from './components/AppSettings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import JournalPage from './pages/JournalPage';
import StrainPage from './pages/StrainPage'; // NEW
import TermsAndConditionsModal from './components/TermsAndConditionsModal';
import TutorialOverlay from './components/TutorialOverlay';
import SubmitStrainForm from './components/SubmitStrainForm';
import SubmitDispensaryForm from './components/SubmitDispensaryForm';
import CommunityFeed from './components/CommunityFeed';

import { useUserStore } from './lib/stores/user.store';
import { supabase } from './lib/supabase';
import { PostHogProvider } from './providers/PostHogProvider';
import posthog from './lib/analytics'; // Import direct instance

function App() {
  const [activeTab, setActiveTab] = useState('consult');
  const userStore = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();

  // ... existing state
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [dispensaries, setDispensaries] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [contributeMode, setContributeMode] = useState('strain');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Sync Router Location to State
  useEffect(() => {
    const path = location.pathname.substring(1); // remove slash

    // Analytics: Track Pageview
    posthog.capture('$pageview');

    if (path.startsWith('strain/')) {
      setActiveTab('strain-detail');
      setHasEntered(true);
    } else if (path === 'welcome') {
      setHasEntered(false); // Go to Landing
    } else if (['strains', 'dispensaries', 'profile', 'consult', 'contribute', 'privacy', 'terms'].includes(path)) {
      setActiveTab(path);
      if (!hasEntered) setHasEntered(true); // Ensure we are 'in' the app
    }
  }, [location, hasEntered]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    userStore.logout();
    setActiveTab('consult');
    navigate('/consult'); // Sync Router
  };

  const handleLoginSuccess = (user) => {
    setUser(user);
    setShowAuthModal(false);
  };

  const handleResetTutorial = () => {
    // Legacy handler, now handled by AppSettings internally mostly, 
    // but if AppSettings calls navigate('/welcome'), the useEffect handles it.
    localStorage.removeItem('strainwise_tutorial_seen');
    setShowTutorial(true);
    setShowSettingsModal(false);
  };

  const handleRecommendations = async (strainNames) => {
    // 1. Resolve Strain Names to Objects
    try {
      if (!strainNames || strainNames.length === 0) {
        setRecommendations([]);
        return;
      }

      const { data, error } = await supabase
        .from('strains')
        .select('*')
        .in('name', strainNames);

      if (error) throw error;

      if (data && data.length > 0) {
        setRecommendations(data);
        setTimeout(() => {
          const element = document.getElementById('recommendations');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        console.warn("Recommendations found no matching strains in DB.");
        setRecommendations([]);
      }
    } catch (err) {
      console.error("Error fetching recommendation details:", err);
      // Fallback? No, just don't crash.
    }
  };

  const renderContent = () => {
    // Intercept for Detail Pages
    if (activeTab === 'strain-detail') {
      return <StrainPage />;
    }

    switch (activeTab) {
      case 'profile':
        return <UserProfile user={user} onLogout={handleLogout} />;
      case 'strains':
        return user ? <StrainLibrary userLocation={userLocation} /> : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 rounded-3xl border border-white/5 mt-12">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">The Archive is Locked</h2>
            <p className="text-slate-400 mb-6 max-w-md">Sign in to access the 3D Strain Encyclopedia and AI Research Lab.</p>
            <button onClick={() => setShowAuthModal(true)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors">
              Access Archives
            </button>
          </div>
        );
      case 'dispensaries':
        return <DispensaryList dispensaries={dispensaries} userLocation={userLocation} />;
      case 'contribute':
        return (
          <div className="max-w-4xl mx-auto pt-10">
            {/* Toggle Switch */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-full p-1 flex gap-1">
                <button
                  onClick={() => setContributeMode('strain')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${contributeMode === 'strain'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Add Strain
                </button>
                <button
                  onClick={() => setContributeMode('dispensary')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${contributeMode === 'dispensary'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Add Dispensary
                </button>
              </div>
            </div>

            {contributeMode === 'strain' ? (
              <SubmitStrainForm
                user={user}
                onSuccess={(strain) => {
                  console.log("Strain added:", strain);
                  // Optional
                }}
              />
            ) : (
              <SubmitDispensaryForm
                user={user}
                onSuccess={(dispensary) => {
                  console.log("Dispensary added:", dispensary);
                }}
              />
            )}
          </div>
        );

      case 'journal':
        return <JournalPage />;
      case 'community':
        return <CommunityFeed />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService />;
      case 'consult':
      default:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-6 bg-[length:200%_auto] animate-gradient"
              >
                Find Your Perfect Strain
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto"
              >
                AI-powered recommendations tailored to your unique needs and lifestyle.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <ConsultantInterface onRecommend={handleRecommendations} userLocation={userLocation} />
            </motion.div>

            <AnimatePresence>
              {recommendations.length > 0 && (
                <motion.div
                  id="recommendations"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.6 }}
                  className="mt-20"
                >
                  <h2 className="text-3xl font-bold text-slate-100 mb-8 flex items-center gap-3">
                    <span className="w-10 h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></span>
                    Recommended for You
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {recommendations.map((strain, index) => (
                      <motion.div
                        key={strain.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        <StrainCard
                          strain={strain}
                          dispensaries={dispensaries}
                          userLocation={userLocation}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
    }
  };

  return (
    <PostHogProvider>
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <motion.div
            key="landing"
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <LandingPage onEnter={() => {
              setHasEntered(true);
              navigate('/consult');
              if (navigator.geolocation) {
                console.log("Requesting user location...");
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    console.log("Location found:", position.coords);
                    setUserLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    });
                  },
                  (error) => {
                    console.warn("Location access denied or error:", error);
                    if (error.code === 1) console.warn("User denied location services. Defaulting to 'null' (Global/Perth).");
                  }
                );
              } else {
                console.warn("Geolocation is not supported by this browser.");
              }
              const seen = localStorage.getItem('strainwise_tutorial_seen');
              if (!seen) {
                setTimeout(() => setShowTutorial(true), 500);
              }
            }} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30"
          >
            <Background />
            <Layout
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                navigate(`/${tab}`);
              }}
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onSettingsClick={() => setShowSettingsModal(true)}
              onOpenTerms={() => setShowTermsModal(true)}
            >
              {renderContent()}
            </Layout>

            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onLoginSuccess={handleLoginSuccess}
            />

            {showSettingsModal && (
              <AppSettings onClose={() => setShowSettingsModal(false)} />
            )}

            <TermsAndConditionsModal
              isOpen={showTermsModal}
              onClose={() => setShowTermsModal(false)}
            />

            <AnimatePresence>
              {showTutorial && (
                <TutorialOverlay onComplete={() => {
                  setShowTutorial(false);
                  localStorage.setItem('strainwise_tutorial_seen', 'true');
                }} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PostHogProvider>
  );
}

export default App;
