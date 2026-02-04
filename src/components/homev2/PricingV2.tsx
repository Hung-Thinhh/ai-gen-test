"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CrownIcon, CheckIcon, FireIcon, WalletIcon } from "./icons";

const plans = [
  {
    name: "Miễn phí",
    price: { monthly: 0, yearly: 0 },
    description: "Bắt đầu tạo ảnh AI",
    features: [
      "100 credits mỗi ngày",
      "30+ tools cơ bản",
      "Chất lượng Standard",
      "Watermark nhỏ",
      "Hỗ trợ cộng đồng",
    ],
    cta: "Dùng ngay",
    popular: false,
  },
  {
    name: "Starter",
    price: { monthly: 49000, yearly: 470000 },
    description: "Cho cá nhân",
    features: [
      "500 credits/tháng",
      "Tất cả 30+ tools",
      "Chất lượng HD",
      "Không watermark",
      "Ưu tiên queue",
      "Hỗ trợ email",
    ],
    cta: "Mua ngay",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 149000, yearly: 1430000 },
    description: "Cho chuyên nghiệp",
    features: [
      "2000 credits/tháng",
      "Tất cả 30+ tools",
      "Chất lượng 4K",
      "Không watermark",
      "Priority queue",
      "API access",
      "Hỗ trợ 24/7",
      "Tư vấn 1-1",
    ],
    cta: "Mua ngay",
    popular: true,
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

export const PricingV2 = () => {
  const [isYearly, setIsYearly] = useState(false);
  const router = useRouter();

  return (
    <section className="py-20 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-4">
            <CrownIcon className="w-4 h-4" />
            <span>Chọn gói phù hợp</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bắt đầu miễn phí, nâng cấp khi cần
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-8">
            Hoàn tiền trong 7 ngày nếu không hài lòng.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isYearly ? "text-white" : "text-neutral-500"}`}>
              Tháng
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 bg-neutral-800 rounded-full p-1 cursor-pointer"
            >
              <motion.div
                className="w-5 h-5 bg-orange-500 rounded-full"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${isYearly ? "text-white" : "text-neutral-500"}`}>
              Năm
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                -20%
              </span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: plan.popular ? -20 : -10 }}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "bg-gradient-to-b from-orange-500/20 to-neutral-900 border-2 border-orange-500"
                  : "bg-neutral-900 border border-white/10"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                  <FireIcon className="w-4 h-4" />
                  <span>Phổ biến nhất</span>
                </div>
              )}

              {/* Plan Info */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-neutral-500 text-sm mb-4">{plan.description}</p>

                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price.monthly === 0
                      ? "Miễn phí"
                      : `${formatPrice(
                          isYearly ? plan.price.yearly : plan.price.monthly
                        )}đ`}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-neutral-500">
                      /{isYearly ? "năm" : "tháng"}
                    </span>
                  )}
                </div>

                {isYearly && plan.price.yearly > 0 && (
                  <p className="text-green-400 text-sm mt-2">
                    Tiết kiệm {formatPrice(plan.price.monthly * 12 - plan.price.yearly)}đ
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <CheckIcon className={`w-5 h-5 ${plan.popular ? "text-orange-500" : "text-green-500"}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => router.push("/pricing")}
                className={`w-full py-3 rounded-xl font-semibold transition-all cursor-pointer ${
                  plan.popular
                    ? "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30"
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10 text-neutral-500 text-sm flex items-center justify-center gap-2"
        >
          <WalletIcon className="w-4 h-4" />
          <span>Hoàn tiền 100% trong 7 ngày nếu không hài lòng • Thanh toán qua SePay, Momo, ZaloPay</span>
        </motion.div>
      </div>
    </section>
  );
};
