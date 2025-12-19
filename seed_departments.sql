-- Clear existing departments to avoid duplicates during dev
truncate table public.departments cascade;

DO $$
DECLARE
  root_id uuid;
  tech_assistant_id uuid;
  admin_assistant_id uuid;
  
  -- Admin Depts
  hr_id uuid;
  finance_id uuid;
  legal_id uuid;
  admin_dept_id uuid; -- Services/Admin
  media_id uuid;
  
  -- Technical Depts
  coordination_id uuid;
  monitoring_id uuid;
  studies_id uuid;
  oil_rev_id uuid;
  non_oil_rev_id uuid;
  
BEGIN
  -- Level 1: The Commission / Directorate General
  insert into public.departments (name, level, parent_id)
  values ('الهيئة العامة لمراقبة تخصيص الواردات الاتحادية', 'directorate', null)
  returning id into root_id;

  -- Level 2: Assistants
  insert into public.departments (name, level, parent_id)
  values ('مكتب المدير العام', 'office', root_id);

  insert into public.departments (name, level, parent_id)
  values ('معاون المدير العام للشؤون الفنية', 'assistant', root_id)
  returning id into tech_assistant_id;

  insert into public.departments (name, level, parent_id)
  values ('معاون المدير العام للشؤون الإدارية والمالية', 'assistant', root_id)
  returning id into admin_assistant_id;

  -- =============================================
  -- Branch: Admin Assistant
  -- =============================================
  
  -- HR
  insert into public.departments (name, level, parent_id)
  values ('قسم إدارة الموارد البشرية', 'department', admin_assistant_id)
  returning id into hr_id;
    -- HR Sections
    insert into public.departments(name, level, parent_id) values ('شعبة الإدارة', 'section', hr_id);
    insert into public.departments(name, level, parent_id) values ('شعبة الافراد', 'section', hr_id);
    insert into public.departments(name, level, parent_id) values ('شعبة التقاعد', 'section', hr_id);

  -- Finance
  insert into public.departments (name, level, parent_id)
  values ('القسم المالي', 'department', admin_assistant_id)
  returning id into finance_id;
    -- Finance Sections
    insert into public.departments(name, level, parent_id) values ('شعبة الرواتب', 'section', finance_id);
    insert into public.departments(name, level, parent_id) values ('شعبة المصروفات', 'section', finance_id);
    insert into public.departments(name, level, parent_id) values ('شعبة السجلات', 'section', finance_id);

  -- Legal
  insert into public.departments (name, level, parent_id)
  values ('القسم القانوني', 'department', admin_assistant_id)
  returning id into legal_id;
     insert into public.departments(name, level, parent_id) values ('شعبة الدعاوى', 'section', legal_id);
     insert into public.departments(name, level, parent_id) values ('شعبة الاستشارات', 'section', legal_id);

  -- Admin / Services
  insert into public.departments (name, level, parent_id)
  values ('قسم الخدمات الإدارية', 'department', admin_assistant_id)
  returning id into admin_dept_id;
     insert into public.departments(name, level, parent_id) values ('شعبة النقل', 'section', admin_dept_id);
     insert into public.departments(name, level, parent_id) values ('شعبة الصيانة', 'section', admin_dept_id);

   -- IT & Media
  insert into public.departments (name, level, parent_id)
  values ('قسم تكنولوجيا المعلومات', 'department', admin_assistant_id);
  
  insert into public.departments (name, level, parent_id)
  values ('قسم العلاقات والاعلام', 'department', admin_assistant_id);

  -- =============================================
  -- Branch: Technical Assistant
  -- =============================================
  
  -- Coordination
  insert into public.departments (name, level, parent_id)
  values ('قسم التنسيق', 'department', tech_assistant_id)
  returning id into coordination_id;
    insert into public.departments(name, level, parent_id) values ('شعبة التنسيق مع المحافظات', 'section', coordination_id);
    insert into public.departments(name, level, parent_id) values ('شعبة التنسيق مع الوزارات', 'section', coordination_id);

  -- Monitoring
  insert into public.departments (name, level, parent_id)
  values ('قسم الرقابة والتدقيق', 'department', tech_assistant_id)
  returning id into monitoring_id;
    insert into public.departments(name, level, parent_id) values ('شعبة الرقابة المالية', 'section', monitoring_id);
    insert into public.departments(name, level, parent_id) values ('شعبة رقابة الأداء', 'section', monitoring_id);

  -- Studies
  insert into public.departments (name, level, parent_id)
  values ('قسم الدراسات', 'department', tech_assistant_id)
  returning id into studies_id;
    insert into public.departments(name, level, parent_id) values ('شعبة الإحصاء', 'section', studies_id);
    insert into public.departments(name, level, parent_id) values ('شعبة التخطيط', 'section', studies_id);

  -- Revenue Specifics
  insert into public.departments (name, level, parent_id)
  values ('قسم تدقيق الواردات النفطية', 'department', tech_assistant_id)
  returning id into oil_rev_id;

  insert into public.departments (name, level, parent_id)
  values ('قسم تدقيق الواردات غير النفطية', 'department', tech_assistant_id)
  returning id into non_oil_rev_id;

END $$;
