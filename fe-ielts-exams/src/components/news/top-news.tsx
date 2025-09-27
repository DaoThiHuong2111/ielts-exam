'use client';

import { Button } from "@/components/ui/button";
import img2 from "@public/images/home/abi-gal-4.jpg";
import img1 from "@public/images/home/people-business-meeting-high-angle-scaled-1-2048x1367.jpg";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const news = [
  {
    title: "6 bí quyết lập thời gian biểu tự học IELTS hiệu quả",
    image: img1,
    link: "#"
  },
  {
    title: "Tổng hợp đề thi IELTS mới nhất 2025",
    image: img2,
    link: "#"
  },
  {
    title: "Phân tích chiến lược Writing Task 2 band 8+",
    image: img1,
    link: "#"
  }
];

export default function FeaturedNewsSlider() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<any>(null);

  const next = () => setIndex((prev) => (prev + 1) % news.length);
  const prev = () => setIndex((prev) => (prev - 1 + news.length) % news.length);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => next(), 5000);
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  return (
    <div className="w-full container py-10 md:py-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">
          Tin Tức <span className="text-yellow-500 underline decoration-4 decoration-brown">Nổi Bật</span>
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={prev}
            size="icon"
            className="rounded-full bg-yellow-400 hover:bg-yellow-500"
          >
            <ChevronLeft className="text-white" />
          </Button>
          <Button
            onClick={next}
            size="icon"
            className="rounded-full bg-yellow-400 hover:bg-yellow-500"
          >
            <ChevronRight className="text-white" />
          </Button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-[500px]"
          >
            <Image
              src={news[index].image}
              alt={news[index].title}
              fill
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-[#642B16] bg-opacity-95 text-white p-6 flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-semibold max-w-xl">
                {news[index].title}
              </h3>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
                Đọc tiếp <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
