'use client'

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

import img1 from '@public/images/home/z6763811288333_a463eb5a7291030729527dba3ae9605f.jpg';
import img2 from '@public/images/home/z6763811312444_c2c98983d447d74490501a61b14bd964.jpg';
import { default as img3, default as img4 } from '@public/images/home/z6763811318376_5551e46c8d9a68085d6cea777e7f4437-515x1024.jpg';
import img5 from '@public/images/home/z6763811318376_5551e46c8d9a68085d6cea777e7f4437.jpg';
import img6 from '@public/images/home/z6763854967494_d32bfa10aed81f18bd52de099aef50d3.jpg';

const images = [img1, img2, img3, img4, img5, img6];
const columnSpeeds = [180, 200, 190]; // Seconds

const ScrollingColumn = ({ speed, reverse = false }: { speed: number; reverse?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const duplicatedImages = [...images, ...images];

  return (
    <div
      className="relative overflow-hidden h-[600px] w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="flex flex-col gap-4"
        animate={!isHovered ? { y: reverse ? ['-100%', '0%'] : ['0%', '-100%'] } : {}}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {duplicatedImages.map((img, idx) => (
          <div key={idx} className="rounded-xl overflow-hidden shadow-md">
            <Image src={img} alt={`feedback-${idx}`} width={300} height={400} className="w-full h-auto" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default function StudentFeedback() {
  return (
    <section className="py-12 bg-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold">
          Học Viên <span className="text-[#9f3c00] underline decoration-wavy">Nói Gì</span> Về Chúng Tôi
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-6 container md:!px-[100px]">
        <ScrollingColumn speed={columnSpeeds[0]} />
        <ScrollingColumn speed={columnSpeeds[1]} reverse />
        <ScrollingColumn speed={columnSpeeds[2]} />
      </div>
    </section>
  );
}
