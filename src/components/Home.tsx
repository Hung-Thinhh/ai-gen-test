/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAppControls, useImageEditor, extractJsonFromPng, type AppConfig } from './uiUtils';
import * as db from '../lib/db';
import { getAllTools } from '../services/storageService'; // Import getAllTools
import { CloudUploadIcon, LayerComposerIcon, EditorIcon, StoryboardIcon } from './icons';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Pagination,
  Dialog,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/system';

const StyledCloudUploadIcon = styled(CloudUploadIcon)(({ theme }) => ({
  fontSize: '4rem',
  color: theme.palette.warning.main,
}));

interface ProcessedAppConfig extends AppConfig {
  title: string;
  description: string;
}

interface HomeProps {
  onSelectApp: (appId: string) => void;
  title: React.ReactNode;
  subtitle: string;
  apps: ProcessedAppConfig[];
}

const Home: React.FC<HomeProps> = ({ onSelectApp, title, subtitle, apps: initialApps }) => { // Rename prop to initialApps
  const { t, language, importSettingsAndNavigate, openLayerComposer, addImagesToGallery, openStoryboardingModal } = useAppControls();
  const { openEmptyImageEditor } = useImageEditor();
  const searchParams = useSearchParams();
  const router = useRouter();

  const getLocalizedText = (content: any, lang: string) => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      return content[lang] || content['en'] || content['vi'] || '';
    }
    return '';
  };

  const [dbTools, setDbTools] = useState<ProcessedAppConfig[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  // Fetch Tools from DB
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const tools = await getAllTools();
        console.log("[Home] tools from DB:", tools);

        const mappedTools = (tools || []).map((t: any) => ({
          // Base AppConfig fields (some might be placeholders)
          id: t.tool_key || t.tool_id?.toString() || '',
          titleKey: t.title_key || t.name,
          descriptionKey: t.description, // using description as key placeholder

          // Processed fields
          title: t.name,
          description: t.description,
          previewImageUrl: t.preview_image_url || 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765978950/pqotah7yias7jtpnwnca.jpg',

          // Original
          ...t
        }));

        const activeTools = mappedTools.filter((t: any) => t.status == 'active');
        setDbTools(activeTools);
      } catch (error) {
        console.error("Error fetching tools in Home:", error);
      } finally {
        setLoadingTools(false);
      }
    };
    fetchTools();
  }, []);

  // Use DB tools if available, else fallback to initialApps
  const apps = dbTools.length > 0 ? dbTools : initialApps;

  // Get page from URL or default to 1
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [showAll, setShowAll] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const APPS_PER_PAGE = 12;
  const totalPages = Math.ceil(apps.length / APPS_PER_PAGE);

  // Sync current page with URL on mount and when URL changes
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    // Adjust logic to reset to 1 if urlPage > totalPages (e.g. data changed)
    const effectiveTotalPages = Math.ceil(apps.length / APPS_PER_PAGE) || 1;

    if (urlPage !== currentPage) {
      if (urlPage >= 1 && urlPage <= effectiveTotalPages) {
        setCurrentPage(urlPage);
      } else if (urlPage > effectiveTotalPages) {
        setCurrentPage(1);
      }
    }
  }, [searchParams, apps.length]); // Add apps.length dependency

  // Update URL when page changes
  const updatePageUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete('page'); // Clean URL for first page
    } else {
      params.set('page', newPage.toString());
    }
    const queryString = params.toString();
    router.push(`/tool${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const displayedApps = showAll
    ? apps
    : apps.slice((currentPage - 1) * APPS_PER_PAGE, currentPage * APPS_PER_PAGE);

  const handleToggleShowAll = () => {
    setShowAll((prev) => !prev);
    if (showAll) {
      setCurrentPage(1);
      updatePageUrl(1);
    }
  };

  const handleOpenEditor = useCallback(() => {
    openEmptyImageEditor((newUrl) => {
      addImagesToGallery([newUrl]);
    });
  }, [openEmptyImageEditor, addImagesToGallery]);

  const handleFile = async (file: File) => {
    let settings: any = null;
    try {
      if (file.type === 'image/png') {
        settings = await extractJsonFromPng(file);
      } else if (file.type === 'application/json') {
        settings = JSON.parse(await file.text());
      }

      if (settings) {
        if (settings.canvasSettings && Array.isArray(settings.layers)) {
          await db.saveCanvasState(settings);
          openLayerComposer();
        } else if (settings.viewId && settings.state) {
          importSettingsAndNavigate(settings);
        } else {
          toast.error('File không hợp lệ hoặc không được nhận dạng.');
        }
      } else {
        toast.error('Không tìm thấy dữ liệu cài đặt trong file.');
      }
    } catch (e) {
      console.error('Failed to process file', e);
      toast.error('Lỗi khi xử lý file. File có thể bị hỏng.');
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        padding: '20px',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >


      <Grid container spacing={2} justifyContent="center">
        {displayedApps.map((app) => (
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
              onClick={() => onSelectApp(app.id)}
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
                  sx={{ marginBottom: 1 }}
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
                  }}
                >
                  {getLocalizedText(app.description, language)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {apps.length > APPS_PER_PAGE && (
        <Box sx={{ marginTop: '20px' }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, page) => {
              setCurrentPage(page);
              updatePageUrl(page);
            }}
            color="primary"
          />
        </Box>
      )}

      <AnimatePresence>
        {isDraggingOver && (
          <Dialog open={isDraggingOver}>
            <Box
              sx={{
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                borderRadius: '16px',
              }}
            >
              <StyledCloudUploadIcon />
              <Typography variant="h6">
                Thả file JSON hoặc ảnh PNG để import cài đặt
              </Typography>
            </Box>
          </Dialog>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Home;