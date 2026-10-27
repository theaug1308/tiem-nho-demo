# Tiệm Nhỏ — Gốm & Cà phê

Một trang thương mại điện tử demo theo phong cách **cosy pixel** với bảng màu *Sunset Bakery & Wood* và chế độ ban đêm *Midnight Desk Lamp*. Toàn bộ giao diện, sprite pixel và tương tác nằm trong ba file tĩnh, không cần build.

## Chạy thử

Cách nhanh nhất: mở trực tiếp `index.html` trong trình duyệt.

Hoặc chạy một server tĩnh tại thư mục này:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Sau đó mở [http://localhost:4173/](http://localhost:4173/).

## Tính năng

- **8 sản phẩm** chia bốn nhóm: Gốm, Cà phê, Nến & Trà, Giấy.
- Lọc sản phẩm theo danh mục, có thông báo số món đang hiển thị.
- Giỏ hàng dạng drawer: thêm món, tăng/giảm số lượng, xoá, tính tạm tính và tổng tiền.
- Giỏ hàng được lưu bằng `localStorage`, tự khôi phục sau khi tải lại trang.
- Thanh tiến trình miễn phí giao hàng cho đơn từ **500.000₫**; phí giao demo **30.000₫**.
- Checkout demo sinh mã đơn dạng `TN-####` rồi làm trống giỏ. Không có thanh toán thật.
- **Đèn bàn** trên header chuyển giao diện ngày/đêm; lựa chọn được ghi nhớ.
- Menu di động, focus trap cho giỏ hàng, phục hồi focus sau khi đóng, hỗ trợ `Escape`.
- Tôn trọng `prefers-reduced-motion`; màu chữ đạt độ tương phản tốt trên cả hai theme.
- Chi tiết vui: bấm vào **chú mèo** trên cửa sổ hero để nghe vài câu “meo meo”.

## Cấu trúc

| File | Nội dung |
| --- | --- |
| `index.html` | Markup, bộ sprite SVG pixel inline, drawer giỏ hàng |
| `styles.css` | Design tokens, theme ngày/đêm, layout, responsive, reduced motion |
| `main.js` | Giỏ hàng, lọc, theme, drawer, checkout, newsletter, mèo, reveal |
| `favicon.svg` | Favicon chiếc tách pixel |

## Lưu ý

Đây là trang demo. Toàn bộ sản phẩm, giá, địa chỉ, số điện thoại, email, đánh giá và đơn hàng đều là dữ liệu hư cấu; không có giao dịch thanh toán thật. Font chữ dùng Google Fonts (Handjet và Be Vietnam Pro), cần kết nối mạng để hiển thị đúng nhất; nếu offline, trình duyệt sẽ dùng font dự phòng.
