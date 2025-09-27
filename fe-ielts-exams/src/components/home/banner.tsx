'use client'

import deco3 from '@public/images/home/banner-img-1.png'
import imgBanner from '@public/images/home/bnh-bg-2048x813.jpg'
import deco1 from '@public/images/home/decor-banner.png'
import deco2 from '@public/images/home/decor-banner1.png'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function Hero() {
  return (
    <section className="relative overflow-hidden w-full h-full min-h-[34.72vw]">
      <Image
        src={imgBanner}
        alt="Banner Image"
        fill
        style={{ objectFit: 'cover' }}
        className="w-full h-full object-cover pointer-none"
      />
      <Image
        src={deco1}
        alt="Decorative Element 1"
        className="absolute top-0 left-0 w-[230px] h-auto hidden md:block pointer-none"
      />
      <Image
        src={deco2}
        alt="Decorative Element 2"
        className="absolute bottom-0 right-0 w-[250px] h-auto hidden md:block pointer-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute bottom-0 right-0 w-[56%] h-auto hidden lg:block pointer-events-none"
      >
        <Image
          src={deco3}
          alt="Decorative Element 2"
          className="w-full h-auto"
        />
      </motion.div>
      <div className='relative z-10 container'>
        <div className='py-[0] lg:py-[60px] w-full lg:w-[40%]'>
          <div className="py-10 md:py-24 text-left">
            <motion.h1
              className="text-4xl md:text-[54px] font-normal text-white mb-4 leading-[45px] md:leading-[75px] text-left"
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Luyện thi đề gốc - <br />
              Tăng band thần tốc
            </motion.h1>

            <motion.p
              className="text-lg text-white mb-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Trải nghiệm thi thử IELTS trên máy tính với đề thi thật, giao diện chuẩn, chấm điểm tự động và phân tích chi tiết giúp bạn nâng band hiệu quả.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Button asChild size="lg" className='bg-[#F8BF0E] text-black hover:bg-[#F8BF0E]' >
                <Link href="/quiz">Khám phá ngay!</Link>
              </Button>
            </motion.div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full h-auto lg:hidden pointer-events-none"
        >
          <Image
            src={deco3}
            alt="Decorative Element 2"
            className="w-full h-auto"
          />
        </motion.div>
      </div>
    </section>
  )
}