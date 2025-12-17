-- Clear existing data (optional, remove if you want to keep)
-- delete from public.employees;

-- Insert Admin User (Guaranteed Access)
insert into public.employees (
  id, company_id, full_name, role, visible_password, work_schedule, job_title, work_location, nominal_salary, total_salary
) values (
  uuid_generate_v4(), '1000', 'مدير النظام', 'admin', 'admin123', 'morning', 'مدير الموارد البشرية', 'المقر العام', 2000000, 2500000
) on conflict (company_id) do nothing;

-- Insert 10 Dummy Employees
insert into public.employees (
  id, company_id, full_name, role, visible_password, work_schedule, job_title, work_location, nominal_salary, total_salary, hire_date
) values 
(uuid_generate_v4(), '1001', 'أحمد محمد علي', 'user', '123456', 'morning', 'مهندس نفط', 'حقل الأحدب', 1500000, 1800000, '2020-01-15'),
(uuid_generate_v4(), '1002', 'سارة حسين كاظم', 'user', '123456', 'morning', 'محاسب', 'المقر العام', 1200000, 1400000, '2021-03-10'),
(uuid_generate_v4(), '1003', 'علي رضا حسن', 'user', '123456', 'shift', 'فني حفر', 'حقل شرق بغداد', 900000, 1200000, '2019-11-20'),
(uuid_generate_v4(), '1004', 'مريم عبدالله جواد', 'user', '123456', 'morning', 'مبرمج', 'قسم IT', 1600000, 1900000, '2022-05-05'),
(uuid_generate_v4(), '1005', 'حسن كريم جبار', 'user', '123456', 'shift', 'حارس أمني', 'المخازن', 800000, 1000000, '2018-07-01'),
(uuid_generate_v4(), '1006', 'زينب محمود شاكر', 'user', '123456', 'morning', 'إداري', 'الموارد البشرية', 1000000, 1200000, '2023-01-01'),
(uuid_generate_v4(), '1007', 'كرار حيدر سلمان', 'user', '123456', 'shift', 'سائق', 'النقليات', 750000, 950000, '2020-08-15'),
(uuid_generate_v4(), '1008', 'نور عباس فاضل', 'user', '123456', 'morning', 'مهندس كيمياوي', 'المختبر', 1550000, 1850000, '2021-12-10'),
(uuid_generate_v4(), '1009', 'مصطفى قاسم محمد', 'user', '123456', 'shift', 'مشغل سيطرة', 'حقل الأحدب', 1400000, 1700000, '2019-04-25'),
(uuid_generate_v4(), '1010', 'فاطمة سمير يوسف', 'user', '123456', 'morning', 'سكرتاربة', 'مكتب المدير', 950000, 1100000, '2022-09-30');
