"use client";

import { motion } from "framer-motion";

export const PrivacyContent = () => {
  const sections = [
    {
      title: "1. Thông tin chúng tôi thu thập",
      content: `Chúng tôi thu thập thông tin cá nhân khi bạn đăng ký tài khoản, bao gồm: tên, email, số điện thoại. Chúng tôi cũng thu thập dữ liệu sử dụng như lịch sử tạo ảnh, số credits đã dùng, và thông tin thiết bị (IP, browser, hệ điều hành).`
    },
    {
      title: "2. Mục đích sử dụng thông tin",
      content: `Thông tin của bạn được sử dụng để: cung cấp và duy trì dịch vụ, xử lý thanh toán, gửi thông báo về tài khoản, cải thiện chất lượng dịch vụ, và hỗ trợ khách hàng. Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.`
    },
    {
      title: "3. Lưu trữ và bảo mật dữ liệu",
      content: `Dữ liệu được lưu trữ trên máy chủ an toàn tại Việt Nam. Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành bao gồm mã hóa SSL, xác thực hai yếu tố, và kiểm soát truy cập nghiêm ngặt. Tuy nhiên, không có hệ thống nào an toàn tuyệt đối 100%.`
    },
    {
      title: "4. Ảnh và nội dung ngườii dùng",
      content: `Ảnh bạn tải lên để xử lý AI được lưu tạm thờii trong quá trình xử lý và tự động xóa sau 30 ngày. Ảnh kết quả được lưu trong thư viện của bạn cho đến khi bạn xóa. Chúng tôi không sử dụng ảnh của bạn để train AI mà không có sự đồng ý.`
    },
    {
      title: "5. Cookie và tracking",
      content: `Chúng tôi sử dụng cookie để: duy trì phiên đăng nhập, nhớ tùy chọn của bạn, và phân tích lưu lượng truy cập. Bạn có thể tắt cookie trong cài đặt browser, nhưng điều này có thể ảnh hưởng đến chức năng của dịch vụ.`
    },
    {
      title: "6. Chia sẻ thông tin",
      content: `Chúng tôi chỉ chia sẻ thông tin với: nhà cung cấp dịch vụ thanh toán (SePay, Momo, ZaloPay), đối tác cloud hosting, và cơ quan pháp luật khi có yêu cầu hợp pháp. Tất cả đối tác đều phải tuân thủ cam kết bảo mật.`
    },
    {
      title: "7. Quyền của ngườii dùng",
      content: `Bạn có quyền: truy cập dữ liệu cá nhân của mình, yêu cầu chỉnh sửa thông tin không chính xác, yêu cầu xóa tài khoản và dữ liệu, rút lại sự đồng ý cho các hoạt động xử lý dựa trên đồng ý. Liên hệ support@duky.ai để thực hiện các quyền này.`
    },
    {
      title: "8. Thờii gian lưu trữ",
      content: `Dữ liệu tài khoản được lưu trữ cho đến khi bạn xóa tài khoản. Logs hệ thống được lưu 12 tháng. Dữ liệu thanh toán được lưu theo yêu cầu pháp lý (tối thiểu 10 năm). Sau khi xóa tài khoản, dữ liệu được xóa trong vòng 30 ngày.`
    },
    {
      title: "9. Trẻ em",
      content: `Dịch vụ không dành cho ngườii dưới 13 tuổi. Nếu phát hiện tài khoản của trẻ em, chúng tôi sẽ xóa ngay lập tức. Phụ huynh có thể liên hệ để báo cáo.`
    },
    {
      title: "10. Thay đổi chính sách",
      content: `Chính sách này có thể được cập nhật. Thay đổi quan trọng sẽ được thông báo qua email. Tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận chính sách mới.`
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
            <strong className="text-white">Cam kết:</strong> Duky AI cam kết bảo vệ quyền riêng tư của bạn.
            Nếu có câu hỏi về chính sách này, vui lòng liên hệ privacy@duky.ai.
          </p>
        </div>
      </div>
    </section>
  );
};
