# FSS18 - Giải picker ball

Ứng dụng quản lý giải đấu picker ball với 4 đội, 5 loại cặp thi đấu và 3 sân.

## Tính năng

- **Lịch thi đấu**: Xem lịch các trận theo hiệp và sân (3 sân)
- **Bảng xếp hạng**: Xếp hạng theo thắng trận → set thắng → hiệu số điểm
- **Quản lý**: Nhập tỷ số từng trận, reset toàn bộ

## Cách chạy

```bash
npm install
npm run dev
```

Mở http://localhost:5173 trong trình duyệt.

## Cấu trúc giải đấu

- 4 đội thi đấu vòng tròn (mỗi đội gặp nhau 1 lần)
- Mỗi trận đội vs đội gồm 5 set (mỗi set 1 cặp):
  - Chủ lực + Tb1
  - Tb1 + Tb2
  - Tb2 + Nữ
  - Nữ + Phong trào
  - Phong trào + Chủ lực
- Mỗi set thi đấu đến 15 điểm
- 3 sân chạy song song

## Lưu trữ

Dữ liệu được lưu tự động trong localStorage của trình duyệt.
