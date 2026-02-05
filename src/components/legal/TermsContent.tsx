"use client";

import { motion } from "framer-motion";

export const TermsContent = () => {
  const sections = [
    {
      title: "1. Chấp nhận điều khoản",
      content: `Khi truy cập và sử dụng dịch vụ Duky AI, bạn đồng ý tuân thủ các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.`
    },
    {
      title: "2. Mô tả dịch vụ",
      content: `Duky AI cung cấp nền tảng tạo ảnh AI với hơn 30 công cụ chuyên nghiệp. Dịch vụ cho phép ngườii dùng tạo, chỉnh sửa và tùy chỉnh hình ảnh bằng công nghệ AI tiên tiến. Chúng tôi không đảm bảo rằng dịch vụ sẽ luôn khả dụng hoặc không có lỗi.`
    },
    {
      title: "3. Tài khoản ngườii dùng",
      content: `Bạn cần tạo tài khoản để sử dụng một số tính năng của dịch vụ. Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình và tất cả hoạt động xảy ra dưới tài khoản đó. Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép.`
    },
    {
      title: "4. Quyền sở hữu trí tuệ",
      content: `Bạn giữ quyền sở hữu đối với nội dung bạn tạo ra bằng dịch vụ của chúng tôi. Tuy nhiên, bạn cấp cho Duky AI quyền sử dụng nội dung đó để cải thiện dịch vụ. Bạn không được sử dụng dịch vụ để tạo nội dung vi phạm bản quyền.`
    },
    {
      title: "5. Nội dung bị cấm",
      content: `Bạn không được sử dụng dịch vụ để tạo nội dung: (a) bất hợp pháp, (b) gây hại cho trẻ em, (c) phân biệt đối xử hoặc thù ghét, (d) bạo lực cực đoan, (e) khiêu dâm, (f) xâm phạm quyền riêng tư, (g) lừa đảo hoặc gây hiểu lầm.`
    },
    {
      title: "6. Thanh toán và hoàn tiền",
      content: `Các gói dịch vụ trả phí được mô tả rõ trên trang pricing. Thanh toán được xử lý qua SePay, Momo, ZaloPay. Chính sách hoàn tiền trong 7 ngày nếu không hài lòng. Credits không được hoàn trả sau khi đã sử dụng.`
    },
    {
      title: "7. Giới hạn trách nhiệm",
      content: `Duky AI không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng dịch vụ. Chúng tôi không đảm bảo kết quả tạo ảnh sẽ đáp ứng mong đợi cụ thể của bạn. Trách nhiệm pháp lý tối đa của chúng tôi không vượt quá số tiền bạn đã thanh toán trong 12 tháng qua.`
    },
    {
      title: "8. Chấm dứt dịch vụ",
      content: `Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn nếu vi phạm các điều khoản này. Bạn có thể hủy tài khoản bất cứ lúc nào. Dữ liệu của bạn sẽ được xử lý theo chính sách bảo mật.`
    },
    {
      title: "9. Thay đổi điều khoản",
      content: `Chúng tôi có thể cập nhật các điều khoản này bất cứ lúc nào. Thay đổi sẽ có hiệu lực ngay khi đăng tải. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận điều khoản mới.`
    },
    {
      title: "10. Liên hệ",
      content: `Nếu có câu hỏi về điều khoản này, vui lòng liên hệ với chúng tôi qua email: support@duky.ai hoặc trang /contact.`
    }
  ];

  return (
    <section className="py-16 bg-black">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-white/10 pb-8 last:border-0"
            >
              <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
              <p className="text-neutral-400 leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <p className="text-neutral-300 text-sm">
            <strong className="text-white">Lưu ý:</strong> Các điều khoản này được cập nhật lần cuối vào tháng 2/2026.
            Bằng việc sử dụng Duky AI, bạn xác nhận đã đọc, hiểu và đồng ý với tất cả các điều khoản trên.
          </p>
        </div>
      </div>
    </section>
  );
};
