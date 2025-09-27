import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, MessageCircle, Phone } from "lucide-react";

export default function ContactSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="bg-[#f6d500] p-2 w-10 h-10 rounded-xl flex items-center justify-center">
              <MessageCircle className="text-white" size={20} />
            </div>
            <div>
              <p className="font-semibold text-lg">Bộ phận bán hàng</p>
              <p className="text-sm text-muted-foreground">
                Nói chuyện với đội ngũ thân thiện của chúng tôi.
              </p>
            </div>
            <p className="text-primary font-semibold">
              realieltsexams@gmail.com
            </p>
          </div>

          {/* Card 2 */}
          <div className="border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="bg-[#f6d500] p-2 w-10 h-10 rounded-xl flex items-center justify-center">
              <Phone className="text-white" size={20} />
            </div>
            <div>
              <p className="font-semibold text-lg">Gọi cho chúng tôi</p>
              <p className="text-sm text-muted-foreground">
                Thứ Hai – Thứ Sáu từ 8 giờ sáng đến 5 giờ chiều.
              </p>
            </div>
            <p className="text-primary font-semibold">0964879926</p>
          </div>

          {/* Card 3 */}
          <div className="border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="bg-[#f6d500] p-2 w-10 h-10 rounded-xl flex items-center justify-center">
              <Bell className="text-white" size={20} />
            </div>
            <div>
              <p className="font-semibold text-lg">Hỗ trợ 24/7</p>
              <p className="text-sm text-muted-foreground">
                Thứ Hai – Thứ Sáu từ 8 giờ sáng đến 5 giờ chiều.
              </p>
            </div>
            <p className="text-primary font-semibold">
              realieltsexams@gmail.com
            </p>
          </div>

          {/* Card 4 */}
          <div className="border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="bg-[#f6d500] p-2 w-10 h-10 rounded-xl flex items-center justify-center">
              <Bell className="text-white" size={20} />
            </div>
            <div>
              <p className="font-semibold text-lg">Theo dõi chúng tôi trên</p>
              <p className="text-sm text-muted-foreground">
                Cập nhật tin tức mới nhất về chúng tôi
              </p>
            </div>
            <div className="text-black text-xl">🌐</div>
          </div>
        </div>

        {/* Form liên hệ */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-snug">
            Liên hệ với chúng tôi <br /> nếu bạn có bất kỳ câu hỏi nào
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input placeholder="Họ" className="h-14 text-base" />
            <Input placeholder="Tên" className="h-14 text-base" />
            <Input placeholder="Nhập email của bạn" className="h-14 text-base" />
            <Input placeholder="Nhập số điện thoại của bạn" className="h-14 text-base" />
          </div>
          <Textarea
            placeholder="Lời nhắn của bạn"
            className="min-h-[150px] text-base"
          />
          <Button size="lg" className="bg-[#f6d500] hover:bg-[#e5c000] text-black px-8 py-6 text-base">
            Gửi ngay →
          </Button>
        </div>
      </div>
    </section>
  );
}
