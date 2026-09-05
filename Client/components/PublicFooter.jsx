// src/components/Footer.jsx

import React, { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { SiGithub } from "react-icons/si";
import { IconTicket } from "@tabler/icons-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const handleScroll = () => {
      if (!footerRef.current || !textRef.current) return;
      
      const rect = footerRef.current.getBoundingClientRect();
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const distanceToBottom = window.innerHeight - rect.bottom;
        const yOffset = distanceToBottom * 0.3; 
        textRef.current.style.transform = `translate(-50%, ${yOffset}px)`;
      }
    };

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll);
    handleScroll(); 

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <footer 
      ref={footerRef} 
      className="relative bg-[#0F1115] font-['Inter',_sans-serif] overflow-hidden border-t border-[#2A2D34] pt-20"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 px-[5%] max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-24 md:mb-32">
        <div className="flex flex-col items-start">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-xl text-white mb-4 group font-semibold"
          >
            <div className="w-5 h-5 rounded-[6px] bg-[#5B6B8C] flex items-center justify-center">
              <IconTicket size={12} color="white" />
            </div>
            ResolvHQ
          </NavLink>
          <p className="text-[14px] text-zinc-400 max-w-[320px] font-medium">
            One shared queue, no dropped tickets. Built for modern support teams.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/your-username"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="group relative w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-400 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <SiGithub size={16} className="relative z-10 transition-colors duration-300 group-hover:text-white" />
          </a>
        </div>
      </div>

      <div 
        ref={textRef}
        className="absolute bottom-[60px] left-1/2 w-full flex justify-center pointer-events-none z-0"
        style={{ transform: "translate(-50%, 300px)" }}
      >
        <span className="text-[18vw] leading-[0.8] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white/[0.04] to-transparent tracking-tighter whitespace-nowrap select-none">
          ResolvHQ
        </span>
      </div>

      <div className="relative z-20 border-t border-[#2A2D34] bg-[#0F1115]/80 backdrop-blur-xl">
        <div className="px-[5%] py-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-zinc-500 font-medium">
            © {currentYear} ResolvHQ · All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                All systems operational
              </span>
            </div>

            <p className="text-[13px] text-zinc-500 font-medium">
              Built with ❤️ for Support Teams
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;