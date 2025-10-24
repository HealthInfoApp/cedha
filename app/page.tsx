'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ClinicalAIChatbot() {
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: '🧠',
      title: 'Smart Diagnosis',
      description: 'AI-powered differential diagnosis and clinical decision support',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      icon: '📚',
      title: 'Medical Learning',
      description: 'Interactive case studies and anatomy visualization',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      icon: '💊',
      title: 'Drug Database',
      description: 'Comprehensive medication information and interactions',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: '🔬',
      title: 'Research Assistant',
      description: 'Latest medical literature and clinical guidelines',
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚕️</span>
              </div>
              <span className="font-bold text-xl text-slate-800">
                MediAI
              </span>
            </motion.div>
            
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
        </div>
      </nav>

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
                Clinical Partner
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
            >
              Advanced AI assistant for healthcare professionals. Enhance diagnostics, streamline workflows, and accelerate medical learning.
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
                href="/login"
                className="bg-white text-slate-700 px-8 py-4 rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-300 font-semibold text-lg"
              >
                Sign In
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
              Powerful Features
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Everything you need for modern clinical practice
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
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚕️</span>
            </div>
            <span className="font-bold text-lg text-slate-800">
              MediAI
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            AI-powered clinical support for healthcare professionals and medical students.
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