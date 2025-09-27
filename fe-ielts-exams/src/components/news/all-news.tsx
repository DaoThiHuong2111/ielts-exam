'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import img1 from "@public/images/home/1.jpg";
import img2 from "@public/images/home/2.png";
import img3 from "@public/images/home/3.png";
import img4 from "@public/images/home/4.jpg";
import img5 from "@public/images/home/5.png";
import img6 from "@public/images/home/7.jpg";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const news = [
  {
    id: 1,
    title: "Vì Sao Nhiều Người Đang Chọn Học IELTS Ngay Cả Khi Không Du Học?",
    date: "2025-04-19 10:28:14",
    author: "monamedia",
    image: img1,
  },
  {
    id: 2,
    title: "6 Lợi Ích Thực Tiễn Của IELTS Trong Môi Trường Công Sở",
    date: "2025-04-19 10:03:03",
    author: "monamedia",
    image: img2,
  },
  {
    id: 3,
    title: "5 Cách Cải Thiện Kỹ Năng Nghe IELTS Hiệu Quả",
    date: "2025-04-19 09:58:45",
    author: "monamedia",
    image: img3,
  },
  {
    id: 4,
    title: "IELTS đóng vai trò quan trọng trong tuyển dụng và sự nghiệp",
    date: "2025-04-19 09:56:55",
    author: "monamedia",
    image: img4,
  },
  {
    id: 5,
    title: "Cách cải thiện kỹ năng Listening trong IELTS nhanh chóng",
    date: "2025-04-19 09:54:30",
    author: "monamedia",
    image: img5,
  },
  {
    id: 6,
    title: "7 sai lầm phổ biến khiến bạn mãi không cải thiện điểm IELTS",
    date: "2025-04-19 09:51:33",
    author: "monamedia",
    image: img6,
  },
];

export default function NewsGrid() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const pageCount = Math.ceil(news.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const currentNews = news.slice(start, start + itemsPerPage);

  return (
    <div className="container py-10">
      <h2 className="text-center text-3xl md:text-4xl font-semibold mb-10">
        Tất Cả <span className="text-primary underline">Tin Tức</span>
      </h2>

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentNews.map((item) => (
          <Card key={item.id} className="overflow-hidden py-0">
            <Image
              src={item.image}
              alt={item.title}
              width={400}
              height={300}
              className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-300"
            />
            <CardContent className="p-4 pb-6">
              <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <span>📅 {item.date}</span>
                <span>👤 {item.author}</span>
              </div>
              <h3 className="font-semibold text-base leading-snug cursor-pointer hover:text-amber-400">{item.title}</h3>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: pageCount }, (_, i) => (
          <Button
            key={i}
            variant={page === i + 1 ? "default" : "outline"}
            size="icon"
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}
