'use client';

import { Button } from "@/components/ui/button";
import imgHuman from '@public/images/home/abre.png';
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Image from "next/image";

export default function BenefitsSection() {
  const benefits = [
    {
      id: 1,
      text: "Thi thật tại nhà, giống kỳ thi chính thức\nTrải nghiệm thi hoàn toàn giống với kỳ thi IELTS chính thức với giao diện được tái hiện chính xác, giúp bạn làm quen với môi trường thi thật.",
    },
    {
      id: 2,
      text: "Đề thi gốc từ ngân hàng đề chính thức\nLàm quen với dạng đề thi gốc được biên soạn từ đội ngũ chuyên gia IELTS, mang đến trải nghiệm thi thật nhất có thể",
    },
    {
      id: 3,
      text: "Tăng khả năng trúng tủ, nâng band hiệu quả\nLàm quen với nhiều dạng đề, câu hỏi và chủ đề thường gặp, giúp bạn tăng khả năng \"trúng tủ\" và đạt điểm cao trong kỳ thi thật.",
    },
    {
      id: 4,
      text: "Hệ thống thi IELTS trên máy được phát triển bởi đội ngũ Real IELTS\nChúng tôi cung cấp nền tảng giúp bạn luyện thi IELTS trên máy tính với đề thi gốc, tái hiện chính xác môi trường thi thật, giúp bạn tự tin đạt được điểm số mong muốn.",
    },
  ];

  return (
    <section className="bg-white py-8 md:py-20">
      <div className="container grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: item.id * 0.1 }}
              viewport={{ once: true }}
              className="border rounded-xl p-5 md:p-8 flex flex-col gap-3 md:gap-6 bg-white shadow-sm"
            >
              <CheckCircle className="text-green-500 mt-1 shrink-0" />
              <p className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative rounded-xl bg-yellow-400 px-6 py-10 text-white flex flex-col items-start justify-between"
        >
          <div>
            <h2 className="text-4xl font-bold leading-tight text-white/90 mb-3">Lợi ích</h2>
            <p className="text-lg font-semibold mb-6 max-w-[250px]">
              học viên nhận được sau khi làm bài thi
            </p>
            <Button variant="secondary" className="bg-white text-black">
              Thi thử ngay →
            </Button>
          </div>
          <Image
            src={imgHuman}
            alt="Girl holding notebook"
            width={300}
            height={400}
            className="absolute bottom-0 right-0 translate-x-1/4 hidden lg:block"
          />
        </motion.div>
      </div>
    </section>
  );
}
