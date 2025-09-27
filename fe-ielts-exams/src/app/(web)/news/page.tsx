import Hero from "@/components/home/banner";
import NewsGrid from "@/components/news/all-news";
import FeaturedNewsSlider from "@/components/news/top-news";

export default function News() {
  return (
    <div className="min-h-dvh">
      <Hero />
      <FeaturedNewsSlider />
      <NewsGrid />
    </div>
  );
}