'use client'

import { cn } from "@/lib/utils";
import sideBySideImage from '@public/images/home/ctrolh-2048x1179.jpg';
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { FileText, Layers, Sparkles } from "lucide-react";
import Image from "next/image";


export default function FeatureTabs() {
  return (
    <section className="py-12 px-4 bg-white">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 leading-tight">
        Các Tính Năng Bài Test <span className="text-[#9f3c00] underline">Nổi Bật</span>
      </h2>

      <Tabs.Root defaultValue="grading" className="w-full max-w-6xl mx-auto">
        <Tabs.List
          className={cn(
            "flex flex-wrap sm:flex-nowrap justify-center gap-3 sm:gap-4 mb-6",
            "sm:space-x-0"
          )}
        >
          <TabTrigger value="explain" icon={<FileText size={20} />}>
            IELTS Locate and Explain
          </TabTrigger>
          <TabTrigger value="side" icon={<Layers size={20} />}>
            IELTS Side by Side
          </TabTrigger>
          <TabTrigger value="grading" icon={<Sparkles size={20} />} highlight>
            Automatic grading
          </TabTrigger>
        </Tabs.List>

        <div className="relative bg-white rounded-xl shadow-md overflow-hidden h-auto transition-all">
          <Tabs.Content value="explain" className="p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center"
            >
              <div className="w-full">
                <Image
                  src={sideBySideImage}
                  alt="IELTS Side by Side"
                  className="w-full h-auto rounded-xl border shadow-sm"
                  priority
                />
              </div>
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="side" className="p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center"
            >
              <div className="w-full">
                <Image
                  src={sideBySideImage}
                  alt="IELTS Side by Side"
                  className="w-full h-auto rounded-xl border shadow-sm"
                  priority
                />
              </div>
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="grading" className="p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center"
            >
              <div className="w-full">
                <Image
                  src={sideBySideImage}
                  alt="IELTS Side by Side"
                  className="w-full h-auto rounded-xl border shadow-sm"
                  priority
                />
              </div>
            </motion.div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </section>
  );
}

function TabTrigger({
  value,
  children,
  icon,
  highlight = false,
}: {
  value: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "flex-1 sm:flex-none min-w-[180px] sm:min-w-[200px]",
        "inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border",
        "text-xs sm:text-sm font-medium transition-all duration-300 text-center text-wrap",
        "hover:bg-[#fef4df] hover:text-[#9f3c00]",
        "data-[state=active]:bg-[#fef4df] data-[state=active]:text-[#9f3c00] data-[state=active]:shadow-sm",
        highlight && "font-bold"
      )}
    >
      {icon}
      {children}
    </Tabs.Trigger>
  );
}
