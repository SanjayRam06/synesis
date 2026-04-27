import React from 'react';
import { Sparkles, Brain, Target, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface InsightsProps {
  insights: string[];
  prediction: string;
  healthScore: number;
}

export default function Insights({ insights, prediction, healthScore }: InsightsProps) {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-primary">AI Insights</h2>
        <p className="text-secondary mt-1">Personalized financial advice powered by Gemini.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Health Score */}
        <div className="lg:col-span-1 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * healthScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold text-primary">{healthScore}</span>
              <span className="text-xs text-secondary font-medium uppercase tracking-wider">Score</span>
            </div>
          </div>
          <p className="text-secondary text-sm">Your financial health is {healthScore > 80 ? 'Excellent' : healthScore > 50 ? 'Good' : 'Needs Work'}.</p>
        </div>

        {/* Prediction */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-bold">Predictive Forecast</h3>
            </div>
            <p className="text-lg text-blue-50 leading-relaxed italic">
              " {prediction} "
            </p>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-blue-100">
            <ShieldCheck size={16} />
            <span>Based on your recent spending habits.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((insight, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-accent hover:shadow-md transition-all group"
          >
            <div className="p-2.5 bg-accent/10 text-accent rounded-xl group-hover:bg-accent group-hover:text-white transition-colors">
              <Sparkles size={20} />
            </div>
            <p className="text-sm font-medium text-gray-700 leading-relaxed">{insight}</p>
          </motion.div>
        ))}
        {insights.length === 0 && (
          <div className="col-span-3 p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-secondary">Upload transactions to unlock AI insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}
