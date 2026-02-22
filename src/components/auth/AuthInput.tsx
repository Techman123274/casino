"use client";

import { useState, forwardRef, type InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  valid?: boolean;
  isPassword?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput(
    { label, icon: Icon, error, valid, isPassword, className, type, ...props },
    ref
  ) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const resolvedType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : type;

    return (
      <div className="relative">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-white/25">
          {label}
        </label>
        <div
          className={`
            group relative flex items-center overflow-hidden rounded-xl border
            bg-white/[0.02] transition-all duration-300
            ${error
              ? "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.08)]"
              : focused
                ? "border-gold/30 shadow-[0_0_20px_rgba(255,215,0,0.06)]"
                : "border-white/[0.06] hover:border-white/[0.1]"
            }
            ${valid && !error ? "border-matrix/20" : ""}
          `}
        >
          {Icon && (
            <div className="flex h-full items-center pl-4 pr-1">
              <Icon
                className={`h-4 w-4 transition-colors duration-300 ${
                  focused ? "text-gold/60" : "text-white/15"
                }`}
              />
            </div>
          )}

          <input
            ref={ref}
            type={resolvedType}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`
              w-full bg-transparent py-3.5 text-sm text-white/80
              placeholder:text-white/15 outline-none
              ${Icon ? "pl-2 pr-4" : "px-4"}
              ${isPassword ? "pr-16" : valid ? "pr-12" : "pr-4"}
              ${className ?? ""}
            `}
            {...props}
          />

          {/* Success checkmark */}
          <AnimatePresence>
            {valid && !error && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-matrix/15"
              >
                <Check className="h-3 w-3 text-matrix" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className={`absolute right-3 p-1 text-white/15 transition-colors hover:text-white/40 ${
                valid && !error ? "right-10" : "right-3"
              }`}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Focus glow line at bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: focused ? 1 : 0,
              opacity: focused ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="mt-1.5 text-[11px] text-red-400/80"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
