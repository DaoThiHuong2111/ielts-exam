'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import bannerContact from "@public/images/home/banner-contact.jpg"; // Ensure this path is correct
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function SupportFormSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="relative w-full py-6 md:py-56 bg-white h-auto">
      <div className="absolute inset-0 top-0 left-0 w-full z-[1]">
        <Image
          src={bannerContact}
          alt="Support Form"
          fill
          className="w-full h-auto object-cover"
          priority
        />
      </div>
      <div className="container relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2"></div>
        {/* Right: Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 bg-white rounded-xl shadow-md p-6 md:p-8"
        >
          <h2 className="text-xl md:text-2xl font-bold text-[#912f12]">
            Bạn Cần Hỗ Trợ?
          </h2>
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-6">
            Gửi Thông Tin ngay
          </h3>

          {isMounted ? (
            <form className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input placeholder="Nhập họ của bạn" />
                <Input placeholder="Nhập tên của bạn" />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <Input placeholder="Nhập email của bạn" type="email" />
                <Input placeholder="Nhập số điện thoại của bạn" type="tel" />
              </div>
              <Textarea placeholder="Lời nhắn của bạn" rows={4} />

              <Button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold mt-2"
              >
                Gửi ngay →
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="h-9 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="h-9 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="h-24 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded-md animate-pulse w-32"></div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
