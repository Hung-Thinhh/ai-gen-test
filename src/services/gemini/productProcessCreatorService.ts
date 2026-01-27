import ai from './client';
import { getTextModel, parseDataUrl } from './baseService';
import { generateStyledImage } from './advancedImageService';

/**
 * Analyzes the product image and generates a detailed "Process Journey" prompt.
 */
export async function analyzeProductImage(
    imageDataUrl: string,
    style: string,
    extraNotes?: string
): Promise<string> {
    const { mimeType, data } = parseDataUrl(imageDataUrl);

    // Example style provided by user to guide the model
    const exampleStyle = `
    Thiết kế một infographic cao cấp, thiên hoàn toàn về thị giác, mô tả hành trình sản phẩm từ nguyên liệu đến thành phẩm. Khung hình 16:9 ngang, phong cách cinematic editorial, màu sắc tươi sáng và nổi bật, cảm giác hiện đại nhưng gần gũi. Toàn bộ bố cục đi theo một đường cong nghệ thuật mềm mại như dòng sông, dẫn ánh nhìn từ trái sang phải, không chia ô cứng, không bố cục thẳng hàng.
    Mở đầu là hình ảnh nguyên liệu (Ví dụ: bàn tay nông dân cấy mạ, hoặc thu hoạch trái cây...). 
    Tiếp theo, cảnh chuyển mượt sang giai đoạn sơ chế/xử lý với ánh sáng đẹp.
    Sau đó là cảnh chế biến/sản xuất (sôi động, năng lượng, hoặc tinh tế tùy sản phẩm).
    Kết thúc là hình ảnh sản phẩm hoàn thiện đặt trong bối cảnh đời sống (trên bàn ăn, trên kệ, người dùng đang dùng...).
    Tổng thể hình ảnh sắc nét, ánh sáng đẹp, màu sắc hài hòa, cảm giác xem như một poster nghệ thuật hơn là infographic giáo khoa, không logo, không watermark.
    `;

    const prompt = `
    Bạn là một Giám đốc Sáng tạo AI chuyên về Visual Storytelling và Infographic nghệ thuật.
    Nhiệm vụ của bạn là phân tích hình ảnh sản phẩm được cung cấp và viết một PROMPT tạo ảnh chi tiết để mô tả "Hành trình làm ra sản phẩm này" (Production Process Diorama/Journey).

    **Sản phẩm trong ảnh:** (Hãy tự nhận diện sản phẩm trong ảnh là gì).
    **Phong cách mong muốn:** ${style}.

    **Cấu trúc PROMPT bạn cần viết (Dựa trên ví dụ sau, nhưng áp dụng cho sản phẩm trong ảnh):**
    "${exampleStyle}"

    **Yêu cầu chi tiết:**
    1. Nhận diện chính xác sản phẩm.
    2. Tưởng tượng ra quy trình sản xuất hợp lý (từ nguyên liệu -> sơ chế -> chế biến -> hoàn thiện).
    3. Viết một đoạn văn mô tả liền mạch (không gạch đầu dòng) về bức tranh toàn cảnh quy trình này, theo hướng "Trái sang Phải" (Left-to-Right Flow).
    4. Mô tả ánh sáng, màu sắc, và mood phù hợp với sản phẩm (Ví dụ: Cà phê thì tông ấm tối, Nước cam thì tông cam sáng rực rỡ...).
    5. ${extraNotes ? `Lưu ý thêm từ người dùng: "${extraNotes}"` : ''}

    **Đầu ra:** Chỉ trả về duy nhất đoạn văn PROMPT (Tiếng Việt hoặc Tiếng Anh đều được, ưu tiên Tiếng Anh cho chất lượng ảnh tốt hơn, hoặc Tiếng Việt nếu model hỗ trợ tốt), không có lời dẫn.
    `;

    try {
        const response = await ai.models.generateContent({
            model: getTextModel(),
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: prompt }
                ]
            }
        });

        const text = response.text;
        if (!text) throw new Error("Không thể phân tích ảnh sản phẩm.");
        return text.trim();
    } catch (error) {
        console.error("Error analyzing product image:", error);
        throw error; // Let the caller handle it
    }
}

/**
 * Orchestrates the full process: Image -> Analyze -> Prompt -> Generate.
 */
export async function generateProductProcessImage(
    productImage: string, // Base64
    style: string,
    notes: string = '',
    aspectRatio: string = '16:9'
): Promise<string> {
    try {
        console.log("Step 1: Analyzing product image...");
        const generatedPrompt = await analyzeProductImage(productImage, style, notes);
        console.log("Generated Prompt:", generatedPrompt);

        console.log("Step 2: Generating visual process...");
        console.log("Aspect Ratio:", aspectRatio);

        // We pass the productImage as a reference for the final step of the process/style matching
        const resultImage = await generateStyledImage(
            generatedPrompt,
            [productImage],
            "Make sure the final product on the far right looks exactly like the reference image provided.",
            aspectRatio
        );

        return resultImage;
    } catch (error) {
        console.error("Error in generateProductProcessImage:", error);
        throw error;
    }
}
