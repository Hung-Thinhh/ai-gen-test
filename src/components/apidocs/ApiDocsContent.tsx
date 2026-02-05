"use client";

import { motion } from "framer-motion";
import { Code, Key, Webhook, FileJson, Shield, Clock } from "lucide-react";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/generate",
    description: "Tạo ảnh từ prompt văn bản",
    params: ["prompt", "width", "height", "model"]
  },
  {
    method: "POST",
    path: "/api/v1/img2img",
    description: "Chỉnh sửa ảnh bằng prompt",
    params: ["image", "prompt", "strength"]
  },
  {
    method: "GET",
    path: "/api/v1/credits",
    description: "Kiểm tra số credits còn lại",
    params: []
  },
  {
    method: "GET",
    path: "/api/v1/history",
    description: "Lấy lịch sử tạo ảnh",
    params: ["limit", "offset"]
  }
];

const features = [
  {
    icon: Key,
    title: "API Key",
    description: "Mỗi tài khoản có API key riêng để xác thực. Bảo mật tuyệt đối."
  },
  {
    icon: Clock,
    title: "Rate Limit",
    description: "60 requests/phút cho gói Free, 600/phút cho gói Pro."
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Nhận thông báo real-time khi ảnh tạo xong."
  },
  {
    icon: Shield,
    title: "Bảo mật",
    description: "HTTPS mặc định, xác thực Bearer token."
  }
];

export const ApiDocsContent = () => {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Bắt đầu nhanh</h2>
          <div className="p-6 bg-[#1a1a2e] border border-white/10 rounded-xl">
            <p className="text-neutral-400 mb-4">CURL example:</p>
            <pre className="overflow-x-auto text-sm">
              <code className="text-green-400">
{`curl -X POST https://api.duky.ai/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "professional business portrait",
    "width": 1024,
    "height": 1024
  }'`}
              </code>
            </pre>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl"
            >
              <feature.icon className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-neutral-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-6">API Endpoints</h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-xl"
              >
                <div className="flex items-center gap-4 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-orange-400 font-mono">{endpoint.path}</code>
                </div>
                <p className="text-neutral-400 mb-2">{endpoint.description}</p>
                {endpoint.params.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-neutral-500 text-sm">Params:</span>
                    {endpoint.params.map((param, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-neutral-300 text-sm">
                        {param}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Get API Key CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl text-center"
        >
          <Code className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sẵn sàng tích hợp?</h2>
          <p className="text-neutral-300 mb-6">
            Nhận API key miễn phí và bắt đầu xây dựng với Duky AI
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl"
          >
            Lấy API Key
          </a>
        </motion.div>
      </div>
    </section>
  );
};
