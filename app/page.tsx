'use client';

import React from 'react';
import Link from 'next/link';
import { Ship, Wheat, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl w-full relative z-10 flex flex-col items-center text-center">
        {/* Logo & Header */}
        <div className="mb-16">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-xl">
            <Zap size={32} className="text-blue-500 animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight italic">
            SELECT YOUR <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">BUSINESS HUB</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium uppercase tracking-[0.3em] max-w-xl mx-auto">
            High-Performance Management Ecosystem
          </p>
        </div>

        {/* Division Selection Cards */}
        <div className="max-w-2xl w-full">
          {/* Logistics Hub */}
          <Link href="/login?division=logistics" className="group">
            <div className="h-[450px] relative overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900/40 backdrop-blur-2xl p-10 flex flex-col justify-between transition-all duration-500 hover:border-blue-500/50 hover:bg-slate-900/60 hover:translate-y-[-10px] hover:shadow-2xl hover:shadow-blue-500/20">
              {/* Card Background Pattern */}
              <div className="absolute top-0 right-0 p-12 opacity-5 transition-opacity group-hover:opacity-10">
                <Ship size={300} />
              </div>

              <div>
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Ship size={32} className="text-blue-500" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">LOGISTICS HUB</h2>
                <p className="text-slate-400 leading-relaxed text-sm tracking-wide">
                  Comprehensive freight forwarding, job tracking, and automated accounting for global shipping operations.
                </p>
              </div>

              <div className="flex items-center justify-between mt-8">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">LogisticOS Portal</span>
                <div className="p-4 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all group-hover:rotate-[-45deg] group-hover:scale-110">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-20 flex gap-12 text-slate-600">
          <div className="flex items-center gap-2">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Global Operations Ready</span>
          </div>
        </div>
      </div>

      <p className="fixed bottom-8 text-slate-800 text-[10px] font-black uppercase tracking-[0.5em]">
        System Infrastructure v3.0.1 • Integrated Management System
      </p>
    </div>
  );
}