"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { SettingsIcon, ArrowRightIcon } from "./icons";
import { getAllTools } from "../../services/storageService";
import { useAppControls, AppConfig } from "../uiUtils";
import {
  CircularProgress,
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import Grid from '@mui/material/Grid';

interface ProcessedAppConfig extends AppConfig {
  title: string;
  description: string;
}

export const ToolsShowcaseV2 = () => {
  const router = useRouter();
  const { language } = useAppControls();
  const [dbTools, setDbTools] = useState<ProcessedAppConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get localized text
  const getLocalizedText = (content: any, lang: string) => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      return content[lang] || content['en'] || content['vi'] || '';
    }
    return '';
  };

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const tools = await getAllTools();
        const mappedTools = (tools || []).map((t: any) => ({
          id: t.tool_key || t.tool_id?.toString() || '',
          titleKey: t.title_key || t.name,
          descriptionKey: t.description,
          title: t.name,
          description: t.description,
          previewImageUrl: t.preview_image_url || 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765978950/pqotah7yias7jtpnwnca.jpg',
          ...t
        }));

        const activeTools = mappedTools.filter((t: any) => t.is_active === true);

        // Sort by sort_order
        activeTools.sort((a: any, b: any) => {
          const orderA = a.sort_order || 0;
          const orderB = b.sort_order || 0;
          if (orderA === 0 && orderB === 0) return 0;
          if (orderA === 0) return 1;
          if (orderB === 0) return -1;
          return orderA - orderB;
        });

        // Take top 8
        setDbTools(activeTools.slice(0, 8));
      } catch (error) {
        console.error("Error fetching tools in ToolsShowcaseV2:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, []);

  const handleSelectApp = (appId: string) => {
    if (appId === 'studio') {
      router.push('/studio');
    } else {
      router.push(`/tool/${appId}`);
    }
  };

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-4">
            <SettingsIcon className="w-4 h-4" />
            <span>30+ Công cụ AI</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text leading-[1.2] text-transparent">
            Đa dạng công cụ cho mọi nhu cầu
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Từ chân dung, sản phẩm đến marketing - tất cả trong một nền tảng
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="mb-10 min-h-[400px]">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#f97316' }} />
            </Box>
          ) : (
            <Grid container spacing={2} justifyContent="center">
              {dbTools.map((app) => (
                <Grid size={{ xs: 6, sm: 6, md: 3 }} key={app.id}>
                  <Card
                    className="themed-card"
                    sx={{
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '16px',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                    onClick={() => handleSelectApp(app.id)}
                  >
                    {app.previewImageUrl && (
                      <CardMedia
                        component="img"
                        sx={{ aspectRatio: '1/1', objectFit: 'cover' }}
                        image={app.previewImageUrl}
                        alt={`Preview for ${app.title}`}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="div"
                        className="themed-text"
                        sx={{ marginBottom: 1, fontWeight: 700 }}
                      >
                        {getLocalizedText(app.title, language)}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="themed-text-tertiary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          opacity: 0.85
                        }}
                      >
                        {getLocalizedText(app.description, language)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <button
            onClick={() => router.push("/generators")}
            className="px-6 py-3 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10 hover:border-orange-500/50 flex items-center gap-2 mx-auto cursor-pointer"
          >
            Xem tất cả công cụ
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
