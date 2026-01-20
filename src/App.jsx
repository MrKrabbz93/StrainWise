import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, Sparkles } from 'lucide-react';
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
import AdminDashboard from './components/admin/AdminDashboard';
import Notifications from './components/Notifications';
import AgeGate from './components/AgeGate';

import { useUserStore } from './lib/stores/user.store';
import { getRank, awardEarlyAdopter } from './lib/gamification';
import { supabase } from './lib/supabase';
import { PostHogProvider } from './providers/PostHogProvider';
import posthog from './lib/analytics'; // Import direct instance

function App() {
  const [activeTab, setActiveTab] = useState('consult');
  const userStore = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();

  // ... existing state
  const { user, setUser, logout } = userStore;
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
    } else if (['strains', 'dispensaries', 'profile', 'consult', 'contribute', 'privacy', 'terms', 'community', 'admin'].includes(path)) {
      setActiveTab(path);
      if (!hasEntered) setHasEntered(true); // Ensure we are 'in' the app
    }
  }, [location, hasEntered]);

  // Handle Auth Persistence and Profile Hydration
  useEffect(() => {
    // 1. Initial Check
    const hydrateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch full profile (including avatar_url)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const userData = { ...session.user, ...profile };
        setUser(userData);
        userStore.setUser(userData);
      }
    };

    hydrateSession();

    // 2. Listen for Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        const userData = { ...session.user, ...profile };
        setUser(userData);
        userStore.setUser(userData);
      } else {
        setUser(null);
        userStore.logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    setActiveTab('consult');
    navigate('/consult'); // Sync Router
  };

  const handleLoginSuccess = (profile) => {
    setUser(profile);
    setShowAuthModal(false);
    awardEarlyAdopter(profile.id);
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
        // Filter: Ensure visual quality by only showing strains with images
        const validStrains = data.filter(s => s.image_url && s.image_url.length > 10);
        setRecommendations(validStrains);
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
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {(() => {
            if (activeTab === 'strain-detail') return <StrainPage />;

            switch (activeTab) {
              case 'profile': return <UserProfile user={user} onLogout={handleLogout} />;
              case 'strains': return <StrainLibrary userLocation={userLocation} user={user} />;
              case 'dispensaries': return <DispensaryList dispensaries={dispensaries} userLocation={userLocation} />;
              case 'contribute':
                return (
                  <div className="max-w-4xl mx-auto pt-10">
                    <div className="flex justify-center mb-8">
                      <div className="bg-slate-950/50 backdrop-blur-md border border-white/5 rounded-full p-1.5 flex gap-1 shadow-inner">
                        {['strain', 'dispensary'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setContributeMode(mode)}
                            className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${contributeMode === mode
                              ? 'bg-emerald-500 text-slate-950 shadow-lg'
                              : 'text-slate-500 hover:text-white'
                              }`}
                          >
                            Add {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                    {contributeMode === 'strain' ? <SubmitStrainForm user={user} /> : <SubmitDispensaryForm user={user} />}
                  </div>
                );
              case 'journal': return <JournalPage />;
              case 'community': return <CommunityFeed />;
              case 'admin': return <AdminDashboard />;
              case 'privacy': return <PrivacyPolicy />;
              case 'terms': return <TermsOfService />;
              case 'consult':
              default:
                return (
                  <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-20">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Next-Gen Intelligence</span>
                      </motion.div>
                      <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
                        Find Your <br />
                        <span className="premium-gradient-text">Perfect Harmony.</span>
                      </h1>
                      <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-80">
                        AI-powered recommendations tailored to your unique biology and lifestyle.
                      </p>
                    </div>

                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                      <ConsultantInterface onRecommend={handleRecommendations} userLocation={userLocation} />
                    </div>

                    <AnimatePresence>
                      {recommendations.length > 0 && (
                        <motion.div
                          id="recommendations"
                          initial={{ opacity: 0, y: 100 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-32"
                        >
                          <div className="flex items-center gap-6 mb-12">
                            <h2 className="text-4xl font-black text-white tracking-tighter">Recommended</h2>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                          </div>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recommendations.map((strain, index) => (
                              <StrainCard
                                key={strain.id}
                                strain={strain}
                                dispensaries={dispensaries}
                                userLocation={userLocation}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };


  return (
    <PostHogProvider>
      <AgeGate />
      <Notifications />
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
                // Requesting user location
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    // Location found
                    setUserLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    });
                  },
                  (error) => {
                    if (error.code === 1) { /* User denied location services. Defaulting to 'null' (Global/Perth). */ }
                  }
                );
              } else {
                /* Geolocation is not supported by this browser. */
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
