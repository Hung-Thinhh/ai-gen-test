"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Clock, Activity } from "lucide-react";

const services = [
  { name: "API", status: "operational", uptime: "99.99%" },
  { name: "Image Generation", status: "operational", uptime: "99.95%" },
  { name: "Payment System", status: "operational", uptime: "99.99%" },
  { name: "User Dashboard", status: "operational", uptime: "100%" },
  { name: "CDN", status: "operational", uptime: "99.99%" },
];

const incidents = [
  {
    date: "2026-02-01",
    title: "Degraded Performance",
    status: "resolved",
    description: "Slow response times on image generation. Resolved within 15 minutes."
  }
];

export const StatusContent = () => {
  const allOperational = services.every(s => s.status === "operational");

  return (
    <section className="py-16 bg-black">
      <div className="max-w-4xl mx-auto px-4">
        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 rounded-2xl text-center mb-12 ${
            allOperational
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-yellow-500/10 border border-yellow-500/30"
          }`}
        >
          {allOperational ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          )}
          <h2 className={`text-2xl font-bold mb-2 ${allOperational ? "text-green-400" : "text-yellow-400"}`}>
            {allOperational ? "Tất cả hệ thống hoạt động bình thường" : "Một số dịch vụ gặp sự cố"}
          </h2>
          <p className="text-neutral-400">
            Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
          </p>
        </motion.div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold text-white mb-6">Trạng thái dịch vụ</h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === "operational" ? "bg-green-500" : "bg-yellow-500"
                  }`} />
                  <span className="text-white font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-neutral-500 text-sm">Uptime: {service.uptime}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    service.status === "operational"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {service.status === "operational" ? "Hoạt động" : "Gián đoạn"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Uptime Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold text-white mb-6">Uptime 30 ngày qua</h2>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-end gap-1 h-32">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-green-500/50 hover:bg-green-400 transition-colors rounded-t"
                  style={{ height: `${95 + Math.random() * 5}%` }}
                  title={`Ngày ${i + 1}: 99.${Math.floor(Math.random() * 99)}%`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-neutral-500 text-sm">
              <span>30 ngày trước</span>
              <span>Hôm nay</span>
            </div>
          </div>
        </motion.div>

        {/* Incident History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-white mb-6">Lịch sử sự cố</h2>
          {incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <div key={index} className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-orange-500" />
                    <span className="text-white font-medium">{incident.title}</span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      {incident.status}
                    </span>
                  </div>
                  <p className="text-neutral-400 text-sm mb-1">{incident.description}</p>
                  <p className="text-neutral-500 text-xs">{incident.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-neutral-400">Không có sự cố nào trong 30 ngày qua</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
