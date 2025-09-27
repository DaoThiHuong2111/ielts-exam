'use client';

import { Button } from "@/components/ui/button";
import imgWhy from "@public/images/home/infoh.jpg";
import { motion } from "framer-motion";
import Image from "next/image";

export default function WhyChooseSection() {
  return (
    <section className="w-full container py-10 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-[#fff8f5] to-[#edf2ff] rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row items-center"
      >
        {/* Left: Text */}
        <div className="w-full md:w-1/2 px-6 py-10 md:py-16 md:px-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            <span className="text-[#912f12] underline underline-offset-4">Vì Sao?</span><br />
            Nên Chọn<br />
            Real IELTS
          </h2>
          <p className="text-gray-700 text-sm md:text-base mb-6 leading-relaxed">
            Mang đến kho đề thi phong phú, bám sát cấu trúc bài thi thực tế,
            giúp rèn luyện kỹ năng mỗi ngày một cách hiệu quả. Luyện tập và kiểm tra
            trình độ liên tục, giúp quá trình học tập trở nên hiệu quả và dễ dàng.
          </p>

          <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
            Tìm hiểu thêm <span className="ml-2">→</span>
          </Button>
        </div>

        {/* Right: Image */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2"
        >
          <Image
            src={imgWhy} 
            alt="Real IELTS Study Group"
            width={700}
            height={500}
            className="w-full h-auto object-cover"
            priority
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
