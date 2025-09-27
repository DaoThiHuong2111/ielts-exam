import Hero from "@/components/home/banner";
import SupportFormSection from "@/components/home/contact";
import FeatureTabs from "@/components/home/feature-tab";
import StudentFeedback from "@/components/home/feed-back";
import FAQSection from "@/components/home/fqa";
import WhyChooseSection from "@/components/home/why";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Hero />
      <WhyChooseSection />
      <FeatureTabs />
      <StudentFeedback />
      <FAQSection />
      <SupportFormSection />
    </div>
  );
}
