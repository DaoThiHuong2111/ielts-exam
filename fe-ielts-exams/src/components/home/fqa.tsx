'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqItems = [
  {
    question: "Tôi nên bắt đầu học IELTS từ đâu?",
    answer:
      "Bạn nên bắt đầu bằng cách đánh giá trình độ hiện tại và chọn lộ trình phù hợp theo kỹ năng yếu nhất.",
  },
  {
    question: "IELTS là gì và tại sao nên học IELTS?",
    answer:
      "IELTS là bài kiểm tra đánh giá năng lực tiếng Anh quốc tế, cần thiết cho du học, định cư, việc làm.",
  },
  {
    question: "Làm sao để tạo tài khoản học trên website?",
    answer:
      "Bạn có thể nhấn vào nút Đăng ký, điền thông tin, sau đó xác thực email là xong.",
  },
  {
    question: "Tôi quên mật khẩu, phải làm sao?",
    answer:
      "Bạn có thể nhấn vào 'Quên mật khẩu' để đặt lại thông qua email đã đăng ký.",
  },
  {
    question: "Thông tin cá nhân của tôi có được bảo mật không?",
    answer:
      "Chúng tôi cam kết bảo vệ và không chia sẻ dữ liệu cá nhân dưới bất kỳ hình thức nào.",
  },
];

export default function FAQSection() {
  return (
    <section className="w-full py-16 bg-[#f9f9f9]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center container"
      >
        <h2 className="text-[#912f12] text-xl md:text-2xl font-bold">
          Giải Đáp Ngay!
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10">
          Tất Tần Tật Về Bộ Đề
        </h3>

        <Accordion type="single" collapsible className="w-full text-left space-y-5">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border rounded-xl bg-white shadow-sm"
            >
              <AccordionTrigger className="px-4 py-4 md:py-6 font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-1 pb-6  text-gray-700">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
