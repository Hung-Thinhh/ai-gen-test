"use client";

import { motion } from "framer-motion";
import { MailIcon, PhoneIcon, MapPinIcon, UsersIcon } from "./icons";

const contactMethods = [
  {
    icon: MailIcon,
    title: "Email",
    value: "support@duky.ai",
    description: "Phản hồi trong 24 giờ",
    href: "mailto:support@duky.ai",
  },
  {
    icon: PhoneIcon,
    title: "Hotline",
    value: "1900-xxxx",
    description: "9:00 - 21:00, Thứ 2 - Thứ 7",
    href: "tel:1900xxxx",
  },
  {
    icon: MapPinIcon,
    title: "Địa chỉ",
    value: "TP. Cần Thơ",
    description: "Việt Nam",
    href: "#",
  },
];

export const ContactInfo = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Contact Methods */}
      <div className="space-y-4">
        {contactMethods.map((method, index) => (
          <motion.a
            key={method.title}
            href={method.href}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-start gap-4 p-4 rounded-xl bg-neutral-900 border border-white/10 hover:border-orange-500/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/20 transition-colors">
              <method.icon className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{method.title}</h3>
              <p className="text-orange-400">{method.value}</p>
              <p className="text-neutral-500 text-sm">{method.description}</p>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Team Card */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-white font-semibold">Đội ngũ hỗ trợ</h3>
        </div>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Đội ngũ hỗ trợ khách hàng của chúng tôi luôn sẵn sàng giúp đỡ bạn.
          Thờii gian phản hồi trung bình là dưới 2 giờ trong giờ làm việc.
        </p>
      </div>
    </motion.div>
  );
};
