"use client";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";
import CareersHeader from "./_components/CareersHeader";

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="sticky top-0 z-20 bg-white/10 dark:bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
            <div className="flex flex-col gap-6">
              <CareersHeader />
            </div>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto">{children}</div>
      </motion.div>
    </AuroraBackground>
  );
} 