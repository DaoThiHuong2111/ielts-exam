'use client';

import { Button } from "@/components/ui/button";
import imgIntro from '@public/images/home/abintro.jpg';
import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutUsSection() {
  return (
    <section className="relative bg-white py-8 md:py-20 px-4">
      <div className="container text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Chúng Tôi Là Ai?</h2>
        <p className="text-muted-foreground text-base md:text-lg  mb-6">
          Mang đến kho đề thi phong phú, bám sát cấu trúc bài thi thực tế, giúp rèn luyện kỹ năng mỗi ngày một cách hiệu quả.
          luyện tập và kiểm tra trình độ liên tục, giúp quá trình học tập trở nên hiệu quả và dễ dàng
        </p>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2">
          Liên hệ ngay →
        </Button>
      </div>

      <div className="mt-12 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Image
            src={imgIntro}
            alt="Group photo"
            width={1000}
            height={500}
            className="rounded-2xl object-cover w-full"
          />
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-[url('/images/home/abintro-bg.png')] bg-no-repeat bg-cover opacity-5 pointer-events-none" />
    </section>
  );
}
