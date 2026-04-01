-- =============================================================================
-- AuditArmour Seed Data
-- Frameworks, finding categories with keywords, and representative clauses
-- for HACCP, BRCGS, and Coles.
-- =============================================================================

-- ─── Frameworks (10 rows) ────────────────────────────────────────────────────

INSERT INTO public.frameworks (code, name, version, type, region, is_active) VALUES
  ('haccp',      'HACCP (Codex Alimentarius)',                  'Codex 2020',  'international', 'AU', true),
  ('brcgs',      'BRCGS Food Safety',                           'Issue 9',     'international', 'AU', true),
  ('sqf',        'SQF Edition 9',                               'Edition 9',   'international', 'AU', true),
  ('fssc22000',  'FSSC 22000',                                  'Version 6',   'international', 'AU', true),
  ('iso22000',   'ISO 22000:2018',                              '2018',        'international', 'AU', true),
  ('coles',      'Coles Supplier Requirements',                 '2024',        'retailer',      'AU', true),
  ('woolworths', 'Woolworths Supplier Excellence Program',      '2024',        'retailer',      'AU', true),
  ('aldi',       'ALDI Supplier Manual',                        '2024',        'retailer',      'AU', true),
  ('globalg_ap', 'GlobalG.A.P IFA',                             'v6',          'international', 'AU', true),
  ('harpc',      'HARPC (US FSMA)',                             'FSMA 2024',   'regulatory',    'US', true);

-- ─── Finding Categories (40 rows) ───────────────────────────────────────────

INSERT INTO public.finding_categories (code, name, description, risk_weight, keywords) VALUES
  ('pest_control',
   'Pest Control',
   'Issues related to pest management, monitoring, and control programs',
   8,
   ARRAY['pest', 'rodent', 'insect', 'cockroach', 'fly', 'bird', 'bait station', 'infestation', 'droppings', 'pest control program']),

  ('personal_hygiene',
   'Personal Hygiene',
   'Staff hygiene practices including handwashing, illness reporting, and personal cleanliness',
   7,
   ARRAY['hygiene', 'handwashing', 'hand wash', 'illness', 'sick', 'wound', 'jewellery', 'nail', 'hair net', 'personal cleanliness']),

  ('temperature_control',
   'Temperature Control',
   'Monitoring and control of product and environment temperatures',
   9,
   ARRAY['temperature', 'temp', 'thermometer', 'cold', 'hot', 'chilled', 'frozen', 'ambient', 'temperature log', 'temperature record']),

  ('chemical_storage',
   'Chemical Storage',
   'Proper storage, labelling, and handling of chemicals and cleaning agents',
   6,
   ARRAY['chemical', 'MSDS', 'SDS', 'cleaning agent', 'sanitiser', 'sanitizer', 'chemical storage', 'locked', 'labelled', 'dilution']),

  ('allergen_management',
   'Allergen Management',
   'Control and prevention of allergen cross-contamination and accurate labelling',
   10,
   ARRAY['allergen', 'allergy', 'gluten', 'dairy', 'nut', 'peanut', 'soy', 'egg', 'cross-contact', 'allergen control']),

  ('documentation',
   'Documentation',
   'Record keeping, document control, and management of food safety documentation',
   4,
   ARRAY['document', 'record', 'log', 'register', 'form', 'procedure', 'SOP', 'policy', 'documentation', 'filing']),

  ('traceability',
   'Traceability',
   'Product traceability systems including batch coding and recall capability',
   8,
   ARRAY['traceability', 'trace', 'batch', 'lot', 'code', 'recall', 'track', 'identification', 'batch code', 'lot number']),

  ('cleaning_sanitation',
   'Cleaning & Sanitation',
   'Cleaning schedules, sanitation procedures, and verification of cleaning effectiveness',
   8,
   ARRAY['cleaning', 'sanitation', 'clean', 'sanitise', 'sanitize', 'wash', 'CIP', 'cleaning schedule', 'swab', 'ATP']),

  ('equipment_maintenance',
   'Equipment Maintenance',
   'Preventive and corrective maintenance of food processing equipment',
   6,
   ARRAY['equipment', 'maintenance', 'repair', 'breakdown', 'calibration', 'servicing', 'preventive maintenance', 'PM', 'machine', 'conveyor']),

  ('water_quality',
   'Water Quality',
   'Potable water supply, testing, and management of water used in production',
   7,
   ARRAY['water', 'potable', 'water quality', 'water test', 'water supply', 'ice', 'steam', 'bore water', 'municipal', 'backflow']),

  ('waste_management',
   'Waste Management',
   'Handling, storage, and disposal of waste and by-products',
   5,
   ARRAY['waste', 'rubbish', 'bin', 'disposal', 'refuse', 'by-product', 'waste management', 'skip', 'compactor', 'effluent']),

  ('supplier_approval',
   'Supplier Approval',
   'Approved supplier programs, supplier audits, and incoming material verification',
   6,
   ARRAY['supplier', 'vendor', 'approved supplier', 'supplier audit', 'COA', 'certificate of analysis', 'specification', 'incoming', 'raw material']),

  ('label_compliance',
   'Label Compliance',
   'Product labelling accuracy including ingredients, allergens, dates, and regulatory requirements',
   8,
   ARRAY['label', 'labelling', 'packaging', 'ingredient list', 'use by', 'best before', 'date code', 'barcode', 'nutritional', 'country of origin']),

  ('foreign_body',
   'Foreign Body',
   'Prevention and detection of physical contamination and foreign bodies',
   10,
   ARRAY['foreign body', 'contamination', 'metal detection', 'x-ray', 'glass', 'plastic', 'wood', 'stone', 'physical hazard', 'sieve']),

  ('microbiological_risk',
   'Microbiological Risk',
   'Microbiological testing, environmental monitoring, and pathogen control',
   9,
   ARRAY['micro', 'microbiological', 'pathogen', 'listeria', 'salmonella', 'e.coli', 'bacteria', 'swab', 'environmental monitoring', 'TPC']),

  ('training_records',
   'Training Records',
   'Staff training programs, competency assessment, and training documentation',
   5,
   ARRAY['training', 'induction', 'competency', 'qualification', 'skill', 'awareness', 'refresher', 'training record', 'certificate', 'assessment']),

  ('ccp_monitoring',
   'CCP Monitoring',
   'Critical Control Point monitoring, verification, and corrective actions',
   10,
   ARRAY['CCP', 'critical control point', 'critical limit', 'monitoring', 'deviation', 'corrective action', 'verification', 'validation', 'HACCP', 'hazard']),

  ('gmp_breach',
   'GMP Breach',
   'Good Manufacturing Practice violations and non-conformances',
   7,
   ARRAY['GMP', 'good manufacturing', 'practice', 'breach', 'non-conformance', 'non-compliance', 'violation', 'standard', 'prerequisite', 'PRP']),

  ('facility_condition',
   'Facility Condition',
   'Building structure, floors, walls, ceilings, lighting, and ventilation',
   6,
   ARRAY['facility', 'building', 'floor', 'wall', 'ceiling', 'door', 'window', 'lighting', 'ventilation', 'structure']),

  ('cold_chain',
   'Cold Chain',
   'Cold chain integrity during storage, transport, and distribution',
   9,
   ARRAY['cold chain', 'refrigeration', 'freezer', 'cool room', 'transport', 'delivery', 'temperature abuse', 'defrost', 'chiller', 'cold store']),

  ('glass_brittle_plastic',
   'Glass & Brittle Plastic',
   'Management and control of glass, brittle plastic, and ceramics in production areas',
   8,
   ARRAY['glass', 'brittle', 'plastic', 'ceramic', 'glass register', 'breakage', 'shatter', 'perspex', 'light cover', 'glass audit']),

  ('metal_contamination',
   'Metal Contamination',
   'Metal detection and prevention of metal contamination in products',
   9,
   ARRAY['metal', 'metal detector', 'metal detection', 'ferrous', 'non-ferrous', 'stainless', 'wire', 'swarf', 'test piece', 'reject']),

  ('pest_proofing',
   'Pest Proofing',
   'Physical barriers and building maintenance to prevent pest entry',
   6,
   ARRAY['pest proofing', 'seal', 'gap', 'hole', 'screen', 'door strip', 'drain cover', 'weep hole', 'mesh', 'entry point']),

  ('product_recall',
   'Product Recall',
   'Recall procedures, mock recalls, and product withdrawal capability',
   7,
   ARRAY['recall', 'withdrawal', 'mock recall', 'trace back', 'trace forward', 'notification', 'FSANZ', 'recall procedure', 'crisis', 'incident']),

  ('environmental_monitoring',
   'Environmental Monitoring',
   'Environmental sampling programs for pathogens and indicator organisms',
   8,
   ARRAY['environmental', 'EMP', 'environmental monitoring', 'zone', 'sampling', 'indicator', 'listeria', 'swab point', 'air quality', 'biofilm']),

  ('handwashing_facilities',
   'Handwashing Facilities',
   'Provision and maintenance of handwashing stations and supplies',
   6,
   ARRAY['handwash', 'hand wash', 'basin', 'soap', 'sanitiser', 'paper towel', 'tap', 'hand dry', 'hand hygiene', 'touch-free']),

  ('protective_clothing',
   'Protective Clothing',
   'PPE, uniforms, and protective clothing requirements in production areas',
   5,
   ARRAY['PPE', 'uniform', 'clothing', 'hair net', 'beard net', 'glove', 'boot', 'apron', 'coat', 'smock']),

  ('segregation_raw_rte',
   'Segregation Raw/RTE',
   'Separation of raw and ready-to-eat products to prevent cross-contamination',
   10,
   ARRAY['segregation', 'separation', 'raw', 'RTE', 'ready-to-eat', 'cooked', 'cross-contamination', 'high risk', 'low risk', 'barrier']),

  ('cooking_temperature',
   'Cooking Temperature',
   'Cooking process temperature monitoring and verification',
   10,
   ARRAY['cooking', 'cook', 'core temperature', 'heat treatment', 'pasteurisation', 'pasteurization', 'thermal', 'probe', 'cooking log', 'core temp']),

  ('cooling_temperature',
   'Cooling Temperature',
   'Cooling process monitoring and compliance with cooling rate requirements',
   9,
   ARRAY['cooling', 'cool', 'blast chill', 'rapid cool', 'cooling log', 'cooling curve', 'two-stage', 'chilling', 'cool down', 'cooling rate']),

  ('storage_conditions',
   'Storage Conditions',
   'Proper storage of raw materials, WIP, and finished goods including rotation',
   6,
   ARRAY['storage', 'store', 'FIFO', 'rotation', 'shelf life', 'stacking', 'warehouse', 'dry store', 'racking', 'stock rotation']),

  ('receiving_inspection',
   'Receiving Inspection',
   'Incoming goods inspection, temperature checks, and documentation on receipt',
   6,
   ARRAY['receiving', 'intake', 'incoming', 'delivery', 'inspection', 'goods receipt', 'rejection', 'COA', 'specification', 'inward goods']),

  ('dispatch_checks',
   'Dispatch Checks',
   'Pre-dispatch verification including temperature, documentation, and vehicle checks',
   6,
   ARRAY['dispatch', 'loading', 'vehicle', 'truck', 'transport', 'shipping', 'consignment', 'delivery note', 'seal', 'pre-dispatch']),

  ('calibration',
   'Calibration',
   'Calibration of measuring and monitoring equipment',
   5,
   ARRAY['calibration', 'calibrate', 'accuracy', 'measurement', 'thermometer', 'scale', 'pH meter', 'reference', 'certificate', 'tolerance']),

  ('maintenance_program',
   'Maintenance Program',
   'Planned preventive maintenance schedules and program effectiveness',
   5,
   ARRAY['maintenance program', 'PPM', 'planned maintenance', 'schedule', 'work order', 'breakdown', 'asset register', 'spare parts', 'lubrication', 'food grade']),

  ('non_conforming_product',
   'Non-Conforming Product',
   'Handling, quarantine, and disposition of non-conforming products',
   7,
   ARRAY['non-conforming', 'hold', 'quarantine', 'reject', 'disposition', 'rework', 'out of spec', 'concession', 'downgrade', 'NCR']),

  ('customer_complaints',
   'Customer Complaints',
   'Customer complaint handling, investigation, and trending',
   6,
   ARRAY['complaint', 'customer', 'feedback', 'return', 'claim', 'investigation', 'root cause', 'trend', 'consumer', 'response']),

  ('internal_audit',
   'Internal Audit',
   'Internal audit program, scheduling, and follow-up of findings',
   5,
   ARRAY['internal audit', 'audit program', 'audit schedule', 'self-assessment', 'gap analysis', 'follow-up', 'close out', 'audit report', 'corrective', 'preventive']),

  ('management_review',
   'Management Review',
   'Management review meetings, food safety performance review, and resource allocation',
   4,
   ARRAY['management review', 'review meeting', 'KPI', 'performance', 'resource', 'food safety team', 'objectives', 'targets', 'management commitment', 'policy']),

  ('corrective_action_effectiveness',
   'Corrective Action Effectiveness',
   'Verification that corrective and preventive actions are effective and sustained',
   6,
   ARRAY['corrective action', 'effectiveness', 'CAPA', 'verification', 'preventive action', 'root cause', 'recurrence', 'close out', 'follow-up', 'sustained']);

-- ─── Framework Clauses: HACCP (~15 clauses) ─────────────────────────────────

INSERT INTO public.framework_clauses (framework_id, category_id, clause_ref, clause_title, requirement, severity, response_hours, zero_tolerance, notes)
SELECT f.id, fc.id, v.clause_ref, v.clause_title, v.requirement, v.severity, v.response_hours, v.zero_tolerance, v.notes
FROM (VALUES
  ('haccp', 'ccp_monitoring',       'HACCP-1',   'CCP Identification',               'All critical control points shall be identified through hazard analysis and documented in the HACCP plan.',                                     'critical', 24,   false, NULL),
  ('haccp', 'ccp_monitoring',       'HACCP-2',   'CCP Monitoring Procedures',        'Each CCP shall have documented monitoring procedures including method, frequency, responsible person, and records.',                            'critical', 24,   false, NULL),
  ('haccp', 'ccp_monitoring',       'HACCP-3',   'Critical Limits',                  'Critical limits shall be established for each CCP based on scientific evidence or regulatory requirements.',                                     'critical', 4,    true,  'Zero tolerance — immediate corrective action required if critical limit exceeded'),
  ('haccp', 'ccp_monitoring',       'HACCP-4',   'CCP Deviation Procedures',         'Corrective action procedures shall be established for deviations from critical limits at each CCP.',                                             'critical', 4,    true,  NULL),
  ('haccp', 'ccp_monitoring',       'HACCP-5',   'CCP Verification',                 'Verification activities shall confirm that the HACCP system is working effectively, including review of monitoring records.',                    'major',    168,  false, NULL),
  ('haccp', 'temperature_control',  'HACCP-6',   'Temperature Monitoring',           'Temperature monitoring shall be conducted at defined frequencies for all temperature-sensitive CCPs.',                                            'critical', 24,   false, NULL),
  ('haccp', 'cleaning_sanitation',  'HACCP-7',   'Prerequisite Programs — Sanitation','Sanitation procedures shall be documented and verified as part of the prerequisite program supporting the HACCP plan.',                          'major',    168,  false, NULL),
  ('haccp', 'personal_hygiene',     'HACCP-8',   'Prerequisite Programs — Hygiene',  'Personnel hygiene requirements shall be documented and enforced including handwashing, illness reporting, and protective clothing.',              'major',    168,  false, NULL),
  ('haccp', 'pest_control',         'HACCP-9',   'Prerequisite Programs — Pest Control','An integrated pest management program shall be in place and documented as part of prerequisite programs.',                                    'major',    168,  false, NULL),
  ('haccp', 'training_records',     'HACCP-10',  'HACCP Team Competency',            'HACCP team members shall be trained in HACCP principles and their competency shall be documented.',                                               'minor',    672,  false, NULL),
  ('haccp', 'documentation',        'HACCP-11',  'HACCP Plan Documentation',         'The HACCP plan shall be documented, signed, dated, and maintained as a controlled document.',                                                    'major',    168,  false, NULL),
  ('haccp', 'traceability',         'HACCP-12',  'Product Traceability',             'A traceability system shall enable identification of product one step forward and one step back in the supply chain.',                            'major',    24,   false, NULL),
  ('haccp', 'product_recall',       'HACCP-13',  'Recall Procedures',                'Documented recall procedures shall be in place and tested through mock recall exercises at least annually.',                                      'major',    24,   false, NULL),
  ('haccp', 'microbiological_risk', 'HACCP-14',  'Hazard Analysis — Biological',     'Biological hazards including pathogens shall be identified and assessed during hazard analysis.',                                                 'critical', 24,   false, NULL),
  ('haccp', 'foreign_body',         'HACCP-15',  'Hazard Analysis — Physical',       'Physical hazards including foreign body contamination shall be identified and controls established.',                                              'critical', 24,   false, NULL)
) AS v(framework_code, category_code, clause_ref, clause_title, requirement, severity, response_hours, zero_tolerance, notes)
JOIN public.frameworks f ON f.code = v.framework_code
JOIN public.finding_categories fc ON fc.code = v.category_code;

-- ─── Framework Clauses: BRCGS (~20 clauses) ─────────────────────────────────

INSERT INTO public.framework_clauses (framework_id, category_id, clause_ref, clause_title, requirement, severity, response_hours, zero_tolerance, notes)
SELECT f.id, fc.id, v.clause_ref, v.clause_title, v.requirement, v.severity, v.response_hours, v.zero_tolerance, v.notes
FROM (VALUES
  ('brcgs', 'management_review',        'BRC-1.1.1',  'Senior Management Commitment',       'Senior management shall demonstrate commitment to food safety through policy, objectives, and resource allocation.',                     'major',    168,  false, NULL),
  ('brcgs', 'documentation',            'BRC-1.1.2',  'Food Safety Policy',                 'A documented food safety and quality policy shall be communicated to all staff and implemented throughout the site.',                     'major',    168,  false, NULL),
  ('brcgs', 'management_review',        'BRC-1.1.3',  'Management Review',                  'Senior management shall review the food safety and quality management system at planned intervals not exceeding 12 months.',             'major',    672,  false, NULL),
  ('brcgs', 'ccp_monitoring',           'BRC-2.1.1',  'HACCP Plan — Codex Steps',           'The HACCP food safety plan shall be based on Codex Alimentarius HACCP and cover all products and processes.',                             'critical', 24,   false, 'Fundamental requirement'),
  ('brcgs', 'ccp_monitoring',           'BRC-2.7.1',  'CCP Monitoring',                     'Each CCP shall have a documented monitoring system to demonstrate compliance with critical limits.',                                      'critical', 4,    true,  'Fundamental requirement'),
  ('brcgs', 'internal_audit',           'BRC-3.4.1',  'Internal Audit Program',             'Internal audits shall cover the HACCP plan, prerequisite programmes, and procedures, with defined scope and frequency.',                  'major',    672,  false, NULL),
  ('brcgs', 'corrective_action_effectiveness', 'BRC-3.7.1', 'Corrective and Preventive Action', 'Root cause analysis and corrective action procedures shall be in place for non-conformities identified through audits and complaints.', 'major',    168,  false, NULL),
  ('brcgs', 'supplier_approval',        'BRC-3.5.1.1','Approved Supplier Program',          'A documented supplier approval and monitoring procedure shall be in place for all suppliers of raw materials.',                           'major',    168,  false, NULL),
  ('brcgs', 'traceability',             'BRC-3.9.1',  'Traceability System',                'A traceability system shall identify all raw material lots through processing to finished product and first customer.',                   'critical', 24,   false, 'Fundamental requirement'),
  ('brcgs', 'customer_complaints',      'BRC-3.10.1', 'Complaint Handling',                 'All complaints shall be investigated, recorded, and root cause analysis undertaken with corrective actions implemented.',                 'major',    168,  false, NULL),
  ('brcgs', 'product_recall',           'BRC-3.11.1', 'Product Recall and Withdrawal',      'Procedures shall be in place to manage product recalls and withdrawals effectively. Mock recalls shall be tested at least annually.',     'critical', 4,    false, 'Fundamental requirement'),
  ('brcgs', 'facility_condition',       'BRC-4.1.1',  'External Standards — Site',           'The site shall be maintained in good repair and condition to prevent contamination and facilitate cleaning.',                              'major',    168,  false, NULL),
  ('brcgs', 'facility_condition',       'BRC-4.2.1',  'Internal Standards — Building Fabric','Walls, floors, ceilings, and fixtures shall be maintained to prevent contamination, facilitate cleaning, and be fit for purpose.',        'major',    168,  false, NULL),
  ('brcgs', 'cleaning_sanitation',      'BRC-4.11.1', 'Housekeeping and Hygiene',           'Cleaning procedures shall be documented, validated, and monitored for all equipment, facilities, and the external environment.',          'major',    168,  false, NULL),
  ('brcgs', 'allergen_management',      'BRC-5.3.1',  'Allergen Management',                'A documented allergen management plan shall be in place covering risk assessment, control measures, and validation.',                     'critical', 24,   true,  'Fundamental requirement — zero tolerance for undeclared allergens'),
  ('brcgs', 'foreign_body',             'BRC-4.10.1', 'Foreign Body Detection',             'Equipment to detect or remove foreign body contamination shall be in place, documented, and operating correctly.',                        'critical', 4,    true,  'Zero tolerance for failed detection equipment'),
  ('brcgs', 'metal_contamination',      'BRC-4.10.3', 'Metal Detection',                    'Metal detectors or x-ray equipment shall be in use, with documented testing at defined frequencies using certified test pieces.',         'critical', 4,    true,  'Zero tolerance for metal detector failure'),
  ('brcgs', 'personal_hygiene',         'BRC-7.2.1',  'Personal Hygiene — Standards',       'Personal hygiene standards shall be documented and communicated to all staff, contractors, and visitors.',                                 'major',    168,  false, NULL),
  ('brcgs', 'protective_clothing',      'BRC-7.4.1',  'Protective Clothing',                'Protective clothing shall be provided, laundered, and managed to prevent product contamination.',                                         'major',    168,  false, NULL),
  ('brcgs', 'training_records',         'BRC-7.1.1',  'Training',                           'All personnel shall be trained and competent in food safety, HACCP, and their specific role responsibilities.',                            'major',    168,  false, NULL)
) AS v(framework_code, category_code, clause_ref, clause_title, requirement, severity, response_hours, zero_tolerance, notes)
JOIN public.frameworks f ON f.code = v.framework_code
JOIN public.finding_categories fc ON fc.code = v.category_code;

-- ─── Framework Clauses: Coles (~10 clauses) ─────────────────────────────────

INSERT INTO public.framework_clauses (framework_id, category_id, clause_ref, clause_title, requirement, severity, response_hours, zero_tolerance, notes)
SELECT f.id, fc.id, v.clause_ref, v.clause_title, v.requirement, v.severity, v.response_hours, v.zero_tolerance, v.notes
FROM (VALUES
  ('coles', 'pest_control',           'COLES-PC-1',  'Pest Management Program',           'Suppliers shall have an effective pest management program conducted by a licensed pest control operator with documented inspections.',     'major',    168,  false, NULL),
  ('coles', 'allergen_management',    'COLES-AM-1',  'Allergen Control',                   'Suppliers shall have a documented allergen management program covering identification, segregation, cleaning validation, and labelling.',  'critical', 24,   true,  'Zero tolerance — Coles requires immediate notification of allergen incidents'),
  ('coles', 'traceability',           'COLES-TR-1',  'Traceability and Recall',            'Suppliers shall maintain full traceability from raw materials to finished product delivered to Coles. Mock recalls required annually.',     'critical', 24,   false, NULL),
  ('coles', 'temperature_control',    'COLES-TC-1',  'Cold Chain Management',              'Cold chain integrity shall be maintained from production through to delivery. Temperature records shall be available on request.',          'critical', 4,    true,  'Zero tolerance for cold chain breaks on chilled/frozen products'),
  ('coles', 'cleaning_sanitation',    'COLES-CS-1',  'Sanitation Standards',               'Cleaning and sanitation procedures shall be documented, validated, and verified through environmental monitoring programs.',               'major',    168,  false, NULL),
  ('coles', 'label_compliance',       'COLES-LC-1',  'Labelling Compliance',               'All product labels shall comply with FSANZ Code, Coles specifications, and include accurate allergen, ingredient, and date information.',  'critical', 24,   false, NULL),
  ('coles', 'microbiological_risk',   'COLES-MR-1',  'Microbiological Standards',          'Suppliers shall have environmental monitoring and finished product testing programs meeting Coles microbiological specifications.',        'critical', 24,   false, NULL),
  ('coles', 'foreign_body',           'COLES-FB-1',  'Foreign Body Prevention',            'Suppliers shall have documented foreign body prevention programs including metal detection, x-ray, and glass/brittle management.',         'critical', 4,    true,  'Zero tolerance — any foreign body incident requires immediate Coles notification'),
  ('coles', 'personal_hygiene',       'COLES-PH-1',  'Personnel Hygiene',                  'Personnel hygiene standards shall meet Coles requirements including handwashing, illness reporting, and protective clothing.',             'major',    168,  false, NULL),
  ('coles', 'supplier_approval',      'COLES-SA-1',  'Incoming Material Control',          'All raw materials shall be sourced from approved suppliers with documented specifications and verification on receipt.',                    'major',    168,  false, NULL)
) AS v(framework_code, category_code, clause_ref, clause_title, requirement, severity, response_hours, zero_tolerance, notes)
JOIN public.frameworks f ON f.code = v.framework_code
JOIN public.finding_categories fc ON fc.code = v.category_code;
