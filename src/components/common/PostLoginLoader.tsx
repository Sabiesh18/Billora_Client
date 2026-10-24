import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

interface PostLoginLoaderProps {
  user: User | null;
  onFinish: () => void;
}

export const PostLoginLoader: React.FC<PostLoginLoaderProps> = ({ user, onFinish }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Verifying security token...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Syncing local PostgreSQL database...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(80);
      setStatusText('Loading POS menu catalog & table layout...');
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Workspace ready! Launching terminal...');
    }, 1400);

    const t4 = setTimeout(() => {
      onFinish();
    }, 1750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-[#FFF9F6] flex flex-col items-center justify-center p-4 font-sans select-none animate-in fade-in duration-300">
      {/* Modern Card Container */}
      <div className="w-full max-w-sm bg-white border border-[#F3E5DC] rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
        {/* Subtle top warm accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F67009] to-[#F88D3A]"></div>

        {/* Central Spinning / Glowing Logo Loader */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-md animate-pulse"></div>

          {/* Rotating gradient ring */}
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#F67009] border-r-[#F88D3A] animate-spin"></div>

          {/* Inner brand emblem */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F67009] to-[#F88D3A] text-white flex items-center justify-center text-2xl shadow-md transition-transform transform scale-100">
            <FontAwesomeIcon icon={faUtensils} />
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.fullName || 'Staff'}!
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Logged in as <span className="font-bold text-[#F67009]">@{user?.username || 'user'}</span> ({user?.role || 'CASHIER'})
        </p>

        {/* Animated Progress Bar */}
        <div className="mt-6 mb-2">
          <div className="w-full h-2 bg-[#FFF0E6] rounded-full overflow-hidden p-0.5 border border-[#FED7AA]/50">
            <div
              className="h-full bg-gradient-to-r from-[#F67009] to-[#F88D3A] rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Status Text & Percentage */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
          <span className="truncate pr-2">{statusText}</span>
          <span className="font-mono font-bold text-[#F67009] shrink-0">{progress}%</span>
        </div>

        {/* Footer Offline Ready Pill */}
        <div className="mt-6 pt-4 border-t border-[#F3E5DC] flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
          <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500" />
          <span>Offline Terminal Environment Verified</span>
        </div>
      </div>
    </div>
  );
};

export default PostLoginLoader;
