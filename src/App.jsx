import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import ConsultantInterface from './components/ConsultantInterface';
import StrainCard from './components/StrainCard';
import LandingPage from './components/LandingPage';
import StrainLibrary from './components/StrainLibrary';
import DispensaryList from './components/DispensaryList';
import Background from './components/Background';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import SettingsModal from './components/SettingsModal';
import TutorialOverlay from './components/TutorialOverlay';
import SubmitStrainForm from './components/SubmitStrainForm';
import SubmitDispensaryForm from './components/SubmitDispensaryForm';
import TermsAndConditionsModal from './components/TermsAndConditionsModal'; // Add Import
import { supabase } from './lib/supabase';
import strainsData from './data/strains.json';

function App() {
  const [activeTab, setActiveTab] = useState('consult');
  // ... existing state
  const [contributeMode, setContributeMode] = useState('strain');
  const [recommendations, setRecommendations] = useState([]);
  const [dispensaries, setDispensaries] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false); // Add State

  useEffect(() => {
    // Check for user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab('consult');
  };

  const handleLoginSuccess = (user) => {
    setUser(user);
    setShowAuthModal(false);
  };

  const handleRecommendations = (recs) => {
    setRecommendations(recs);
    // Auto-scroll to recommendations
    setTimeout(() => {
      const element = document.getElementById('recommendations');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleResetTutorial = () => {
    localStorage.removeItem('strainwise_tutorial_seen');
    setShowTutorial(true);
    setShowSettingsModal(false);
  };

  const handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfile user={user} onLogout={handleLogout} />;
      case 'strains':
        return <StrainLibrary />;
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
    <AnimatePresence mode="wait">
      {!hasEntered ? (
        <motion.div
          key="landing"
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <LandingPage onEnter={() => {
            setHasEntered(true);
            // Request Location
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
                  // Optional: Set default to Perth if denied explicitly, though 'null' handles it in Map component.
                  // But setting it here ensures "Nearby" logic uses Perth if desired.
                  if (error.code === 1) console.warn("User denied location services. Defaulting to 'null' (Global/Perth).");
                }
              );
            } else {
              console.warn("Geolocation is not supported by this browser.");
            }
            // Check if tutorial was already seen in this session or local storage
            const seen = localStorage.getItem('strainwise_tutorial_seen');
            if (!seen) {
              setTimeout(() => setShowTutorial(true), 500); // Slight delay for effect
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
            onTabChange={setActiveTab}
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

          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            onResetTutorial={handleResetTutorial}
            onClearCache={handleClearCache}
            onOpenTerms={() => {
              setShowSettingsModal(false); // Close settings to show terms
              setShowTermsModal(true);
            }}
          />

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
  );
}

export default App;
// StrainWise v1.1.1 - Force Deploy
