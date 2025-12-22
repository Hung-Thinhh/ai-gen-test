/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { ChangeEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateKhmerImage } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    useMediaQuery,
    AppScreenHeader,
    ResultsView,
    type KhmerPhotoMergeState,
    handleFileUpload,
    useLightbox,
    useVideoGeneration,
    useAppControls,
    embedJsonInPng,
} from './uiUtils';

interface KhmerPhotoMergeProps {
    mainTitle: string;
    subtitle: string;
    uploaderCaption: string;
    uploaderDescription: string;
    addImagesToGallery: (images: string[]) => void;
    appState: KhmerPhotoMergeState;
    onStateChange: (newState: KhmerPhotoMergeState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        tool_id?: number;
        credits_used?: number;
        api_model_used?: string;
        generation_time_ms?: number;
        error_message?: string;
        output_images?: any;
        generation_count?: number;
    }) => void;
    useSmartTitleWrapping?: boolean;
    smartTitleWrapWords?: number;
}

const TEMPLATES = [
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765883087/yjszilec12cyhn3t5fw8.jpg',
        prompt: 'Để biến đổi ảnh gốc thành ảnh kết quả, hãy thay thế hoàn toàn trang phục của nhân vật nữ thành bộ trang phục truyền thống người Khmer màu vàng kim, họa tiết tinh xảo; thêm một chiếc ô truyền thống màu nâu vàng được cầm tay. phông nền là một kiến trúc đền chùa/chùa chiền khmer truyền thống rực rỡ sắc màu, chi tiết, dưới ánh sáng hoàng hôn ấm áp, với tông màu cam hồng trên bầu trời và một cây hoa màu hồng nhẹ ở tiền cảnh. Điều chỉnh tư thế của nhân vật nữ từ ngồi thành đứng, đối diện máy ảnh, trong khi vẫn duy trì biểu cảm khuôn mặt dịu dàng và tạo kiểu tóc búi truyền thống. Áp dụng hiệu ứng ánh sáng hoàng hôn mềm mại, khuếch tán, tạo ra các điểm nhấn vàng ấm và đổ bóng nhẹ nhàng trên kiến trúc, đồng thời làm nổi bật màu sắc phong phú của trang phục và phông nền.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765881380/ivhltootd8z8svfcfv8s.png',
        prompt: 'hãy chuyển đổi trang phục của nhân vật nữ thành bộ trang phục hoàng gia truyền thống Đông Nam Á, bao gồm vương miện vàng phức tạp, trang sức vàng lộng lẫy (vòng cổ, hoa tai, vòng tay, vòng tay bắp tay, nhẫn) và một chiếc váy truyền thống màu đỏ vàng thêu kim tuyến tỉ mỉ kiểu Chut Thai. Thay đổi kiểu tóc hiện đại thành búi tóc cao truyền thống tinh xảo với các chi tiết trang trí bằng vàng, và áp dụng lối trang điểm hoàng gia tinh tế nhấn vào mắt và môi. Bỏ chiếc cúp Mnet Asian Music Awards khỏi tay nhân vật và điều chỉnh tư thế của nhân vật từ ngồi sang đứng thẳng, trang nghiêm, hai tay chắp trước ngực theo phong thái cung đình. Thay đổi phông nền trắng trơn thành nội thất cung điện hoặc đền thờ truyền thống Đông Nam Á lộng lẫy, dát vàng, với các cột trụ trang trí công phu, kiến trúc chạm khắc tinh xảo, các bình hoa trắng đối xứng và một vài nhân vật phụ mờ nhạt ở hậu cảnh, tất cả đều được chiếu sáng bằng ánh sáng ấm áp, khuếch tán, màu vàng óng, mô phỏng ánh sáng trong nhà từ các ngọn đèn treo cổ điển và ánh sáng tự nhiên mềm mại. Đảm bảo chất lượng hình ảnh là nhiếp ảnh chân thực, độ phân giải cao, nhấn mạnh các chi tiết tinh xảo và kết cấu sang trọng của trang phục, trang sức và kiến trúc hoàng gia, tạo bầu không khí trang trọng và linh thiêng.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765883723/hanh-trinh-review-chua-botum-vong-sa-som-rong-cung-co-nang-xinh-dep-3-1664797655_sil4qd.jpg',
        prompt: 'hãy thay đổi tư thế của nhân vật nữ thành đang đứng với hai tay chắp trước ngực trong tư thế "chào wai" và loại bỏ vật thể đang cầm. Thay đổi trang phục của nhân vật thành áo dài ren trắng kết hợp với váy sarong xanh họa tiết truyền thống, bổ sung phụ kiện tóc và khuyên tai đặc trưng. Thay thế hoàn toàn phông nền trắng bằng một bối cảnh ngoài trời rộng lớn, với tượng Phật nằm ở chùa Botum khổng lồ làm trọng tâm hậu cảnh, bầu trời xanh thẳm có ánh mặt trời chói chang tạo hiệu ứng lóe sáng (lens flare) mạnh mẽ từ phía trên bên trái, và mặt đất lát bê tông. Điều chỉnh góc chụp thành góc rộng, ngang tầm mắt hoặc hơi thấp, để nhấn mạnh quy mô kiến trúc và vị trí của nhân vật trong không gian. Áp dụng hệ thống chiếu sáng tự nhiên, mạnh mẽ từ mặt trời với độ tương phản cao, bóng đổ rõ nét, và tăng cường độ bão hòa màu sắc tổng thể để tạo nên một hình ảnh rực rỡ, sống động.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765883993/CHAU-CHAU-38-510x765_bpxmbn.jpg',
        prompt: 'hãy điều chỉnh bố cục và góc nhìn của chủ thể sang tư thế ngồi thư thái trên tấm chiếu dệt đặt trên thảm cỏ xanh mướt, với ánh mắt dịu dàng hướng xuống vật thể trong tay và góc quay ba phần tư nghiêng nhẹ. Thay đổi hoàn toàn ánh sáng studio phẳng, rực rỡ thành ánh sáng tự nhiên, ấm áp của buổi chiều hoàng hôn hoặc chạng vạng, tạo ra các vùng bóng mềm mại, tăng cường độ ấm và độ bão hòa thấp hơn một cách tự nhiên. Chuyển đổi bảng màu tổng thể từ các tông màu đỏ tươi và trắng chủ đạo sang gam màu đất dịu nhẹ, xanh lá cây tự nhiên của cây cối, và các sắc tím, hồng pastel hài hòa, giảm độ tương phản tổng thể để mang lại cảm giác nhẹ nhàng. Thay thế trang phục hiện đại bằng bộ trang phục truyền thống Thái Lan (pha nung và sabai) với họa tiết tinh xảo và tông màu trầm ấm, đồng thời loại bỏ vật phẩm đang cầm và thay thế bằng một chuỗi vòng hoa nhài trắng truyền thống (phuang malai) được kết tỉ mỉ. Đồng thời, thay thế bông hoa cài tóc bằng một bông hoa truyền thống nhỏ màu hồng nhạt hoặc trắng. Biến đổi phông nền studio trắng trơn thành một khu vườn nhiệt đới xanh mướt, mờ ảo với kiến trúc nhà gỗ truyền thống Thái Lan ở hậu cảnh và bổ sung các yếu tố văn hóa như một giỏ trái cây tươi và các vật phẩm trang trí truyền thống khác trên tấm chiếu để hoàn thiện bối cảnh.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765884182/download_l5eova.jpg',
        prompt: ' thay đổi trang phục của nhân vật từ chiếc váy hoa đỏ hai dây thành bộ trang phục truyền thống Thái Lan hoặc Lào, bao gồm áo dệt kim tuyến màu hồng pastel quấn ngang ngực, tấm vải choàng màu xanh lam nhạt drap qua vai, và chiếc váy họa tiết sọc màu tím đậm, được tô điểm bằng thắt lưng, vòng tay, nhẫn và các phụ kiện trang sức vàng truyền thống phức tạp. Loại bỏ hoàn toàn chiếc cúp Mnet đang được cầm trên tay. Điều chỉnh kiểu tóc từ búi cao gọn gàng với một bông hoa lớn màu đỏ rực rỡ thành kiểu tóc dài buông xõa nhẹ nhàng, được trang trí bằng một bông hoa nhỏ màu trắng tinh tế cài bên tai. Thay đổi tư thế của nhân vật từ ngồi và hai tay đan chéo ôm vật thể thành đứng thẳng với hai tay chắp nhẹ nhàng phía trước. Chuyển đổi hoàn toàn phông nền trắng studio sang một bối cảnh tự nhiên, mờ ảo, ấm áp với cây xanh, tán lá rủ và cấu trúc gỗ, áp dụng ánh sáng môi trường vàng dịu, có điểm nhấn và tạo hiệu ứng bokeh mềm mại để làm nổi bật chủ thể, đồng thời điều chỉnh tông màu tổng thể để tạo cảm giác ấm cúng, sang trọng và chiều sâu cho hình ảnh.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765883865/f1ebf24b2dce452a48cb940335881e7f_uvzpog.jpg',
        prompt: 'thay đổi nội dung đối tượng chính thành một phụ nữ Campuchia trẻ tuổi, đúng với gương mặt được đưa vào của tôi, khoác lên mình trang phục truyền thống Apsara bằng lụa màu vàng đồng và nâu đất, điểm xuyết trang sức vàng tinh xảo bao gồm khuyên tai, vòng tay và hoa cài tóc truyền thống, đồng thời tay cầm một vòng hoa tươi trắng. Thay đổi bố cục và phối cảnh từ cận cảnh nửa thân người thành toàn thân, áp dụng góc máy hơi thấp để tôn vinh sự uy nghi của nhân vật và kiến trúc. Thay thế hoàn toàn phông nền trắng bằng một ngôi đền đá cổ kính theo kiến trúc Khmer đồ sộ, phức tạp với các họa tiết chạm khắc tinh xảo, xung quanh là cây xanh tươi tốt. Điều chỉnh ánh sáng thành ánh sáng hoàng hôn hoặc bình minh mềm mại, ấm áp, tạo ra các tông màu vàng hồng và tím pastel trên bầu trời. Tăng cường độ tương phản tự nhiên và chi tiết sắc nét trên trang phục và kiến trúc, duy trì một phong cách nhiếp ảnh chân thực, thanh lịch, với độ sâu trường ảnh nông làm nổi bật nhân vật chính trước hậu cảnh đền thờ.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765884299/download_mtjdx2.jpg',
        prompt: 'Thay thế hoàn toàn trang phục hiện tại của nam nhân vật bằng một bộ lễ phục truyền thống gồm áo khoác trắng cổ đứng, thắt lưng bản rộng màu vàng kim, và quần chong kraben màu cam đất với họa tiết thêu hoặc dệt vàng. Chuyển đổi tư thế từ ngồi, hai tay ôm vật thể sang đứng thẳng với hai bàn tay chắp lại trước ngực trong tư thế "wai" trang nghiêm. Thay đổi hoàn toàn bối cảnh từ phông nền trắng studio thành kiến trúc đền thờ Khmer hoặc Thái Lan cổ kính, với các tầng bậc thang đá cao, lan can điêu khắc hình rắn naga, và nhiều ngọn tháp chóp nhọn, phức tạp. Bầu trời nên là màu xám mây mù, tạo hiệu ứng ánh sáng khuếch tán, mềm mại. Điều chỉnh tông màu tổng thể thành lạnh hơn, hơi khử bão hòa để phù hợp với bầu không khí trang trọng và kiến trúc đá. Thêm chi tiết một chiếc bát vàng nhỏ đặt trên bậc thang thấp bên phải.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765884448/dc623b12dd20356d44212d63645bb1a4_n3zlig.jpg',
        prompt: 'Để biến đổi ảnh gốc thành ảnh kết quả,Thay thế trang phục hiện tại bằng bộ quần áo truyền thống Thái Lan màu xanh dương có hoa văn, bao gồm áo dài tay, thắt lưng bản rộng trang trí phức tạp, khăn choàng thắt eo nhiều màu sắc và quần hoa văn, đồng thời bổ sung một mặt dây chuyền vàng lớn. Chỉnh sửa tư thế của đối tượng thành tư thế đứng thẳng, hai tay chắp trước ngực theo cử chỉ "Wai" truyền thống Thái Lan. Thay đổi hoàn toàn bối cảnh phía sau từ bức tường nội thất thành một con đường có hàng cây xanh mờ ảo, sử dụng hiệu ứng xóa phông nông (shallow depth of field) để làm nổi bật đối tượng. Áp dụng ánh sáng tự nhiên dịu nhẹ, khuếch tán, với tông màu hơi ấm, tăng cường độ bão hòa màu sắc của trang phục truyền thống để tạo nên một bức chân dung văn hóa trang trọng và thanh lịch.'
    },
    {
        url: 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765884577/b1510ee578a56788fda997fa930b2112_aduard.jpg',
        prompt: 'hãy thay thế trang phục hiện đại bằng bộ trang phục truyền thống Khmer hoặc Thái Lan sang trọng, gồm sampot, kben quấn quanh người và các bộ trang sức vàng chạm khắc tinh xảo ở cổ, tay, và thắt lưng; đồng thời chỉnh sửa kiểu tóc thành kiểu vuốt ngược, gọn gàng và tạo dáng đứng uy nghi, hơi nghiêng mặt sang một bên, toát lên thần thái vương giả. Thay đổi phông nền từ tường nhà đơn điệu thành một kiến trúc đền thờ hoặc cung điện truyền thống Đông Nam Á được chiếu sáng lung linh vào ban đêm, áp dụng hiệu ứng bokeh nhẹ để làm nổi bật chủ thể. Điều chỉnh góc máy từ ngang tầm mắt thành góc thấp hơn một chút để tôn lên vẻ bề thế của chủ thể và kiến trúc, mở rộng khung hình để bao gồm toàn bộ phần trên của cơ thể và phần lớn kiến trúc phía sau. Chuyển đổi ánh sáng từ ánh sáng phẳng trong nhà thành ánh sáng đêm ấm áp, kịch tính với tông vàng chủ đạo phát ra từ hậu cảnh, tạo ra các vùng bóng sâu, ánh sáng nổi bật và hiệu ứng rim light mạnh mẽ từ phía sau, đồng thời nâng cao độ tương phản và bão hòa màu sắc để mang lại một không gian huyền ảo, lộng lẫy theo phong cách nhiếp ảnh chân dung nghệ thuật, làm mịn da và làm nổi bật chi tiết trang sức.'
    }
];

const KhmerPhotoMerge: React.FC<KhmerPhotoMergeProps> = (props) => {
    const {
        uploaderCaption, uploaderDescription,
        addImagesToGallery,
        appState, onStateChange, onReset,
        logGeneration,
        useSmartTitleWrapping = false,
        smartTitleWrapWords = 0,
        ...headerProps
    } = props;

    const { t, settings, checkCredits, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { generateVideo } = useVideoGeneration();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const ASPECT_RATIO_OPTIONS = t('aspectRatioOptions') || ['Giữ nguyên', '1:1', '3:4', '4:3', '16:9'];

    const outputLightboxImages = appState.generatedImage ? [appState.generatedImage] : [];
    const lightboxImages = [appState.uploadedImage, appState.selectedStyleImage, ...outputLightboxImages].filter((img): img is string => !!img);

    const handleImageSelectedForUploader = (imageDataUrl: string) => {
        onStateChange({
            ...appState,
            stage: 'configuring',
            uploadedImage: imageDataUrl,
            generatedImage: null,
            error: null,
        });
        // REMOVED: addImagesToGallery([imageDataUrl]); // User requested NO auto-save for inputs
    };

    const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, handleImageSelectedForUploader);
    }, [appState, onStateChange]);

    const handleUploadedImageChange = (newUrl: string | null) => {
        onStateChange({
            ...appState,
            uploadedImage: newUrl,
            stage: newUrl ? 'configuring' : 'idle'
        });
        // REMOVED: if (newUrl) addImagesToGallery([newUrl]); // User requested NO auto-save for inputs
    };

    const handleStyleSelect = (templateUrl: string) => {
        console.log("Selecting style:", templateUrl);
        onStateChange({
            ...appState,
            selectedStyleImage: templateUrl,
        });
    };

    const handleOptionChange = (field: keyof KhmerPhotoMergeState['options'], value: string | boolean) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value },
        });
    };

    const handleGenerate = async () => {
        console.log("handleGenerate triggered. State snapshot:", {
            uploaded: !!appState.uploadedImage,
            style: !!appState.selectedStyleImage,
            styleUrl: appState.selectedStyleImage,
            stage: appState.stage
        });

        if (!appState.uploadedImage || !appState.selectedStyleImage) {
            console.warn("Missing inputs - aborting generation");
            return;
        }

        // Immediate feedback
        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });
        console.log("State updated to generating (immediate feedback)");

        if (!await checkCredits()) {
            console.warn("checkCredits returned false");
            // Revert
            onStateChange({ ...appState, stage: 'configuring' });
            return;
        }
        console.log("checkCredits passed");

        try {
            const selectedTemplate = TEMPLATES.find(t => t.url === appState.selectedStyleImage);
            const templatePrompt = selectedTemplate ? selectedTemplate.prompt : "Trang phục Khmer truyền thống";
            console.log("Calling generateKhmerImage with prompt:", templatePrompt);

            const resultUrl = await generateKhmerImage(
                appState.uploadedImage,
                templatePrompt,
                appState.options.customPrompt,
                appState.options.removeWatermark,
                appState.options.aspectRatio
            );
            console.log("Generation successful, resultUrl length:", resultUrl?.length);

            const settingsToEmbed = {
                viewId: 'khmer-photo-merge',
                state: { ...preGenState, stage: 'configuring', generatedImage: null, error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);


            logGeneration('khmer-photo-merge', preGenState, urlWithMetadata, {
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });


            onStateChange({
                ...appState,
                stage: 'results',
                generatedImage: urlWithMetadata,
                historicalImages: [...appState.historicalImages, { style: appState.selectedStyleImage, url: urlWithMetadata }],
            });
            console.log("Saving generated image to gallery:", urlWithMetadata);
            addImagesToGallery([urlWithMetadata]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Generation failed:", err);
            onStateChange({
                ...appState,
                stage: 'results', // Go to results to show error or stay in configuring? Usually stay or show error.
                error: errorMessage
            });
        }
    };

    const handleEdit = () => {
        // No-op or scroll to top in single page view
        const topElement = document.getElementById('khmer-top');
        if (topElement) topElement.scrollIntoView({ behavior: 'smooth' });
    };

    const isLoading = appState.stage === 'generating';
    const hasResults = !!appState.generatedImage;
    const isConfiguring = true; // Always configuring in single page layout

    const inputImagesForResults = [];
    if (appState.uploadedImage) {
        inputImagesForResults.push({
            url: appState.uploadedImage,
            caption: t('common_originalImage'),
            onClick: () => openLightbox(lightboxImages.indexOf(appState.uploadedImage!))
        });
    }
    // Removed Style image from inputs as per user request ("extra box")

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0 mb-40" id="khmer-top">
            <AnimatePresence>
                {!isLoading && (
                    <AppScreenHeader
                        {...headerProps}
                        useSmartTitleWrapping={useSmartTitleWrapping}
                        smartTitleWrapWords={smartTitleWrapWords}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center w-full flex-1 px-4 overflow-y-auto">
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-7xl py-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* 1. Inputs Section - 2 columns */}
                    {!isLoading && (
                        <div className="w-full max-w-4xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Upload Box */}
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                    <h3 className="text-lg font-bold text-yellow-400">{t('khmerPhotoMerge_uploaderCaption') || '1. Tải ảnh lên'}</h3>
                                    <ActionablePolaroidCard
                                        type={appState.uploadedImage ? 'photo-input' : 'uploader'}
                                        mediaUrl={appState.uploadedImage ?? undefined}
                                        caption={uploaderCaption}
                                        placeholderType="person"
                                        status="done"
                                        onClick={appState.uploadedImage ? () => openLightbox(lightboxImages.indexOf(appState.uploadedImage!)) : undefined}
                                        onImageChange={handleUploadedImageChange}
                                        isMobile={isMobile}
                                    />
                                    {/* <p className="text-xs text-neutral-400 text-center">{uploaderDescription}</p> */}
                                </div>

                                {/* Template Box (Preview or Placeholder) */}
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                    <h3 className="text-lg font-bold text-yellow-400">{t('khmer_selectStyle') || '2. Chọn mẫu'}</h3>
                                    {appState.selectedStyleImage ? (
                                        <ActionablePolaroidCard
                                            type="content-input"
                                            mediaUrl={appState.selectedStyleImage}
                                            caption="Mẫu đã chọn"
                                            status="done"
                                            onClick={() => openLightbox(lightboxImages.indexOf(appState.selectedStyleImage!))}
                                            placeholderType="style"
                                            isMobile={isMobile}
                                            onImageChange={(url) => handleStyleSelect(url || '')}
                                        />
                                    ) : (
                                        <div className='polaroid-card p-2 cursor-pointer h-auto h-full'>
                                            <div className="placeholder-upload-wrapper">
                                                <p className="text-neutral-500 text-center px-4">Chọn mẫu bên dưới</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Loading State */}
                    {isLoading && (
                        <motion.div className="flex flex-col items-center justify-center gap-4 py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-neutral-300">{t('common_creating') || 'Đang tạo ảnh...'}</p>
                            <button
                                onClick={() => onStateChange({ ...appState, stage: 'configuring', error: null })}
                                className="mt-4 px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                            >
                                {t('common_cancel') || 'Hủy'}
                            </button>
                        </motion.div>
                    )}

                    {/* 3. Results Section */}
                    {!isLoading && (hasResults || appState.error) && (
                        <div className="w-full max-w-4xl">
                            <div className="themed-card backdrop-blur-md rounded-2xl p-6 relative">
                                <h3 className="base-font font-bold text-xl text-yellow-400 mb-4 text-center">{t('common_result') || 'Kết quả'}</h3>

                                {appState.error && (
                                    <div className="w-full p-4 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
                                        {appState.error}
                                    </div>
                                )}

                                {appState.generatedImage && (
                                    <div className="flex justify-center mb-6">
                                        <div className="w-full max-w-sm">
                                            <ActionablePolaroidCard
                                                type="output"
                                                caption={t('common_result')}
                                                status="done"
                                                mediaUrl={appState.generatedImage}
                                                onClick={() => openLightbox(lightboxImages.indexOf(appState.generatedImage!))}
                                                isMobile={isMobile}
                                                onGenerateVideoFromPrompt={(prompt) => generateVideo(appState.generatedImage!, prompt)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 justify-center">
                                    <button onClick={onReset} className="px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors">
                                        {t('common_startOver')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Template Grid & Options (Always Visible) */}
                    {!isLoading && (
                        <div className="w-full max-w-4xl space-y-6">
                            {/* Templates */}
                            <div>
                                <h3 className="text-lg font-bold text-neutral-300 mb-3 ml-1">Danh sách mẫu</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {TEMPLATES.map((tpl, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleStyleSelect(tpl.url)}
                                            className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-[3/4] ${appState.selectedStyleImage === tpl.url ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/20' : 'border-neutral-700 hover:border-neutral-500'}`}
                                        >
                                            <img src={tpl.url} alt={`Template ${idx + 1}`} className="w-full h-full object-cover" />
                                            {appState.selectedStyleImage === tpl.url && (
                                                <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                                                    <div className="bg-yellow-400 rounded-full p-1">
                                                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Options Panel */}
                            <div className="themed-card backdrop-blur-md rounded-2xl p-6 border border-neutral-700">
                                <h3 className="text-lg font-bold text-white mb-4 border-b border-neutral-700 pb-2">{t('common_options') || 'Tuỳ chọn'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">{t('common_additionalNotes')}</label>
                                        <textarea
                                            value={appState.options.customPrompt}
                                            onChange={(e) => handleOptionChange('customPrompt', e.target.value)}
                                            placeholder={t('khmer_promptPlaceholder')}
                                            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-1">{t('common_aspectRatio')}</label>
                                            <select
                                                value={appState.options.aspectRatio}
                                                onChange={(e) => handleOptionChange('aspectRatio', e.target.value)}
                                                className="bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                                            >
                                                {Array.isArray(ASPECT_RATIO_OPTIONS) && ASPECT_RATIO_OPTIONS.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={appState.options.removeWatermark}
                                                    onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)}
                                                    className="rounded border-neutral-600 bg-neutral-800 text-yellow-400 focus:ring-yellow-400"
                                                />
                                                <span className="text-sm font-medium text-neutral-300">{t('common_removeWatermark')}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!appState.uploadedImage || !appState.selectedStyleImage || isLoading}
                                        className={`px-12 py-3 rounded-full font-bold text-black text-lg transition-all transform active:scale-95 shadow-lg ${!appState.uploadedImage || !appState.selectedStyleImage || isLoading
                                            ? 'bg-neutral-600 cursor-not-allowed opacity-50'
                                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-orange-500/20'
                                            }`}
                                    >
                                        {hasResults ? (t('posterCreator_generateMore') || 'Tạo lại') : (t('common_generate') || 'Tạo ảnh')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default KhmerPhotoMerge;
