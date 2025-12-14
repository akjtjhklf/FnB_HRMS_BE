-- Seed data cho shift_types
-- Chạy file này trong MySQL hoặc thông qua Directus

INSERT INTO shift_types (id, name, start_time, end_time, cross_midnight, notes) VALUES
('ca-sang-001', 'Ca Sáng', '06:00:00', '14:00:00', 0, 'Ca làm việc buổi sáng từ 6:00 đến 14:00'),
('ca-chieu-002', 'Ca Chiều', '14:00:00', '22:00:00', 0, 'Ca làm việc buổi chiều từ 14:00 đến 22:00'),
('ca-toi-003', 'Ca Tối', '22:00:00', '06:00:00', 1, 'Ca làm việc buổi tối từ 22:00 đến 6:00 sáng hôm sau'),
('ca-full-004', 'Ca Full', '08:00:00', '17:00:00', 0, 'Ca làm việc full time từ 8:00 đến 17:00'),
('ca-dem-005', 'Ca Đêm', '00:00:00', '08:00:00', 0, 'Ca làm việc ban đêm từ 0:00 đến 8:00');

-- Kiểm tra dữ liệu vừa insert
SELECT * FROM shift_types;
