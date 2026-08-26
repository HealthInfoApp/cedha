'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Salad,
  Dna,
  Pill,
  ClipboardList,
  Menu,
  X,
  Home,
  MessageSquare,
  User,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const features = [
  {
    icon: Salad,
    title: 'Personalized Nutrition',
    description: 'Precision meal plans and macronutrient targets tailored to patient profiles.',
  },
  {
    icon: Dna,
    title: 'Nutrigenomics Insights',
    description: 'Translate genetic markers into actionable dietary recommendations.',
  },
  {
    icon: Pill,
    title: 'Diet–Drug Interactions',
    description: 'Identify nutrient–medication interactions and contraindications.',
  },
  {
    icon: ClipboardList,
    title: 'Clinical Guidelines',
    description: 'Evidence-based protocols for obesity, diabetes, CKD, CVD, and more.',
  },
];

export default function ClinicalAIChatbot() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = '/login';
    }, 400);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white">
              <Image src="/dietech.png" alt="DietechAI" width={32} height={32} priority />
            </div>
            <span className="font-display text-xl font-semibold">DietechAI</span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/public-chat"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Try Now
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <ThemeToggle />
            <Button size="sm" onClick={handleGetStarted} loading={isLoading}>
              Get Started
            </Button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted transition-colors hover:bg-elevated hover:text-foreground"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-surface p-4 md:hidden"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white">
                    <Image src="/dietech.png" alt="DietechAI" width={32} height={32} />
                  </div>
                  <span className="font-display text-lg font-semibold">DietechAI</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-elevated"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-1">
                {[
                  { href: '/', label: 'Home', icon: Home },
                  { href: '/public-chat', label: 'Try Now', icon: MessageSquare },
                  { href: '/login', label: 'Sign In', icon: User },
                  { href: '/signup', label: 'Sign Up', icon: Shield },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-elevated hover:text-foreground"
                  >
                    <Icon size={19} />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="mt-8 border-t border-border pt-6">
                <Button
                  className="w-full"
                  loading={isLoading}
                  onClick={() => {
                    handleGetStarted();
                    setIsSidebarOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8">
          <div className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted shadow-soft">
            <Sparkles size={14} className="text-primary" />
            AI-powered clinical nutrition
          </div>

          <h1
            style={{ animationDelay: '0.05s' }}
            className="animate-fade-up font-display text-4xl font-bold leading-tight md:text-6xl"
          >
            Your AI
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              Clinical Nutrition Partner
            </span>
          </h1>

          <p
            style={{ animationDelay: '0.1s' }}
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-muted"
          >
            DietechAI delivers personalized medicine for nutrition: precision diet therapy,
            patient-specific counseling, and evidence-based guidance for clinical practice.
          </p>

          <div
            style={{ animationDelay: '0.15s' }}
            className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={handleGetStarted} loading={isLoading}>
              Get Started Free
              <ArrowRight size={18} />
            </Button>
            <Link href="/public-chat">
              <Button size="lg" variant="outline">
                Try Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-up mx-auto mb-14 max-w-xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Nutrition-Focused Features</h2>
            <p className="mt-3 text-muted">Tools for precision nutrition and clinical dietetics.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                style={{ animationDelay: `${index * 0.08}s` }}
                className="group animate-fade-up rounded-2xl border border-border bg-background p-6 shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft transition-transform group-hover:scale-105">
                  <feature.icon size={22} />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded bg-white">
              <Image src="/dietech.png" alt="DietechAI" width={24} height={24} />
            </div>
            <span className="font-display text-lg font-semibold">DietechAI</span>
          </div>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted">
            AI-powered clinical nutrition support for healthcare professionals and dietitians.
          </p>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-subtle">
            <a href="#" className="transition-colors hover:text-primary">Privacy</a>
            <a href="#" className="transition-colors hover:text-primary">Terms</a>
            <a href="#" className="transition-colors hover:text-primary">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
