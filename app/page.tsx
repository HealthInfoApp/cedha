'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Home, MessageSquare, Settings, LogOut, User, Shield, Activity } from 'lucide-react';

export default function ClinicalAIChatbot() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const features = [
    {
      icon: '🥗',
      title: 'Personalized Nutrition',
      description: 'Precision meal plans and macronutrient targets tailored to patient profiles',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: '🧬',
      title: 'Nutrigenomics Insights',
      description: 'Translate genetic markers into actionable dietary recommendations',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      icon: '💊',
      title: 'Diet–Drug Interactions',
      description: 'Identify nutrient–medication interactions and contraindications',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: '📑',
      title: 'Clinical Guidelines',
      description: 'Evidence-based protocols for obesity, diabetes, CKD, CVD, and more',
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                <Image src="/dietech.png" alt="DietechAI" width={32} height={32} priority />
              </div>
              <span className="font-bold text-xl text-slate-800">
                DietechAI
              </span>
            </motion.div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/public-chat" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
                Try Now
              </Link>
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium text-sm disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Get Started'}
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 md:hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                      <Image src="/dietech.png" alt="DietechAI" width={32} height={32} priority />
                    </div>
                    <span className="font-bold text-xl text-slate-800">DietechAI</span>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-2">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Home size={20} />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/public-chat"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <MessageSquare size={20} />
                    <span>Try Now</span>
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <User size={20} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Shield size={20} />
                    <span>Sign Up</span>
                  </Link>
                </nav>

                <div className="mt-8 pt-8 border-t border-slate-200">
                  <motion.button
                    onClick={() => {
                      handleGetStarted();
                      setIsSidebarOpen(false);
                    }}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Get Started'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight"
            >
              Your AI
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Clinical Nutrition Partner
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
            >
              DietechAI delivers personalized medicine for nutrition: precision diet therapy, patient-specific counseling, and evidence-based guidance for clinical practice.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button 
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Get Started Free
              </button>
              
              <Link 
                href="/public-chat"
                className="bg-white text-slate-700 px-8 py-4 rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-300 font-semibold text-lg"
              >
                Try Now
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 -right-10 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-20 -left-10 w-72 h-72 bg-cyan-200 rounded-full blur-3xl opacity-30"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Nutrition-Focused Features
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Tools for precision nutrition and clinical dietetics
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 text-lg">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center bg-white">
              <Image src="/dietech.png" alt="DietechAI" width={24} height={24} />
            </div>
            <span className="font-bold text-lg text-slate-800">
              DietechAI
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            AI-powered clinical nutrition support for healthcare professionals and dietitians.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}