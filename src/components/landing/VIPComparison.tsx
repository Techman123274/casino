"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X, Zap } from "lucide-react";

interface ComparisonRow {
  feature: string;
  rapid: string | boolean;
  others: string | boolean;
  highlight?: boolean;
}

const comparisonData: ComparisonRow[] = [
  { feature: "Withdrawal Speed", rapid: "Instant", others: "24-72 hours", highlight: true },
  { feature: "House Edge", rapid: "1%", others: "3-5%" },
  { feature: "Provably Fair", rapid: true, others: false, highlight: true },
  { feature: "KYC Required", rapid: "Optional", others: "Mandatory" },
  { feature: "Crypto Native", rapid: true, others: false },
  { feature: "VIP Cashback", rapid: "Up to 25%", others: "Up to 10%", highlight: true },
  { feature: "Open Source Games", rapid: true, others: false },
  { feature: "Live Win Feed", rapid: true, others: false },
];

function CellValue({ value, isRapid }: { value: string | boolean; isRapid: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-matrix/10">
        <Check className="h-3.5 w-3.5 text-matrix" />
      </span>
    ) : (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.04]">
        <X className="h-3.5 w-3.5 text-white/15" />
      </span>
    );
  }
  return (
    <span className={isRapid ? "font-semibold text-gold" : "text-white/30"}>
      {value}
    </span>
  );
}

export function VIPComparison() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="compare"
      className="relative flex min-h-[100svh] items-center px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/10 to-transparent" />

      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/15 bg-gold/[0.04] px-3 py-1 backdrop-blur-sm">
            <Zap className="h-3 w-3 text-gold/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold/60">
              The Difference
            </span>
          </div>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Rapid <span className="text-gradient-gold">vs.</span> The Rest
          </h2>
          <p className="mx-auto max-w-md text-sm text-white/30">
            We built what the industry refused to. Here&apos;s the proof.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
        >
          {/* Table header */}
          <div className="grid grid-cols-3 border-b border-white/[0.06] px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
            <span className="text-white/20">Feature</span>
            <span className="text-center text-gold">RAPID ROLE</span>
            <span className="text-center text-white/20">Others</span>
          </div>

          {/* Rows */}
          {comparisonData.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              className={`grid grid-cols-3 items-center px-5 py-3.5 text-[13px] transition-colors ${
                row.highlight
                  ? "bg-gold/[0.02]"
                  : ""
              } ${i < comparisonData.length - 1 ? "border-b border-white/[0.03]" : ""}`}
            >
              <span className="text-white/50">{row.feature}</span>
              <span className="flex justify-center">
                <CellValue value={row.rapid} isRapid />
              </span>
              <span className="flex justify-center">
                <CellValue value={row.others} isRapid={false} />
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-[11px] text-white/15"
        >
          Data compared against industry averages as of 2026. Results may vary.
        </motion.p>
      </div>
    </section>
  );
}
