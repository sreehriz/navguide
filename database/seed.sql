-- Seed Data for NavGuide engineering colleges

INSERT INTO engineering_colleges (id, college_name, location, college_type, naac_grade, top_course, total_fees, highest_package, rating, official_website_url) VALUES
(1,'NITK Surathkal','Surathkal','Government','A++','BTech Computer Science',560000,5400000,4.6,'https://www.nitk.ac.in'),
(2,'Sahyadri College of Engineering and Management','Mangalore','Private','A','BE Computer Science',1204400,4000000,4.1,'https://sahyadri.edu.in'),
(3,'St Joseph Engineering College','Mangalore','Private','A+','BE Computer Science',976440,2750000,4.0,'https://sjec.ac.in'),
(4,'Mangalore Institute of Technology and Engineering','Moodubidire','Private','A+','BE Robotics and AI',1046000,5000000,4.1,'https://mite.ac.in'),
(5,'Canara Engineering College','Mangalore','Private','A','BE Information Science',800000,2368000,3.7,'https://canaraengineering.in'),
(6,'SDM Institute of Technology','Ujire','Private','NA','BE Computer Science',764444,1200000,3.9,NULL),
(7,'Alva''s Institute of Engineering and Technology','Moodubidire','Private','A+','BE Computer Science',880000,2000000,4.1,'https://aiet.org.in'),
(8,'AJ Institute of Engineering and Technology','Mangalore','Private','NA','BE Computer Science',449640,1400000,3.5,'https://ajiet.edu.in'),
(9,'Srinivas University','Mangalore','Private','A','BTech AIML',874500,1700000,3.8,'https://srinivasuniversity.edu.in'),
(10,'Dr MV Shetty Institute of Technology','Mangalore','Private','NA','BE AIML',449640,1000000,3.8,NULL),
(11,'Yenepoya Institute of Technology','Mangalore','Private','NA','BE Information Science',544000,1000000,4.1,'https://yit.edu.in'),
(12,'PA College of Engineering','Mangalore','Private','NA','BE Computer Science',417360,725000,3.8,'https://pace.edu.in'),
(13,'Bearys Institute of Technology','Mangalore','Private','B+','BE Computer Science',800000,600000,3.9,'https://bitmangalore.edu.in'),
(14,'Shree Devi Institute of Technology','Mangalore','Private','NA','BE Computer Science',800000,506000,3.7,'https://sdc.edu.in'),
(15,'Karavali Institute of Technology','Mangalore','Private','NA','BE Artificial Intelligence',417060,300000,3.7,'http://karavaliengineering.ac.in'),
(16,'Yenepoya University','Mangalore','Private','A+','BTech AIML',926000,900000,3.9,'https://yenepoya.edu.in'),
(17,'Nitte Meenakshi Institute of Technology','Nitte','Private','A+','BTech Computer Science',1440000,5893000,4.0,'https://nmit.ac.in'),
(18,'NMAM Institute of Technology','Nitte','Private','A+','BTech Computer Science',1280000,5200000,4.3,'https://nmamit.nitte.edu.in'),
(19,'Srinivas Institute of Technology','Valachil','Private','NA','BE Computer Science',500000,700000,3.6,'https://sitmng.ac.in'),
(20,'Mangalore Marine College and Technology','Kuppepadavu','Private','NA','Marine Engineering',600000,900000,3.5,'http://mmct.edu.in'),
(21,'Vivekananda College of Engineering and Technology','Puttur','Private','A','BE Computer Science',700000,1200000,4.0,'https://vcetputtur.ac.in'),
(22,'KVG College of Engineering','Sullia','Private','NA','BE Computer Science',600000,800000,3.6,'https://kvgengg.com'),
(23,'Shree Devi Education Trust Engineering College','Mangalore','Private','NA','BE Information Science',650000,500000,3.5,'https://sdc.edu.in'),
(24,'Canara Group of Institutions','Mangalore','Private','NA','BE Computer Science',700000,600000,3.5,'https://canaracollege.com'),
(25,'Quad AI School of Management and Technology','Mangalore','Private','NA','BTech AIML',950000,1000000,3.8,'https://quad.ai'),
(26,'Srinivas School of Engineering','Mukka','Private','NA','BE Computer Science',550000,700000,3.6,'https://srinivasgroup.com');

-- Seed default users
INSERT OR IGNORE INTO users (id, name, email, password_hash, academic_level, academic_marks, academic_stream, career_goal, college_type, budget, location) VALUES
('default-student-id', 'Nav Student', 'student@navguide.com', '$2a$10$K6a3WaI9Al6Vq2Q4cWKBoOeRgTXsInGbvgxQUugIIvZeawEufYqtu', 'PUC', 95.5, 'Science', 'Software Engineer', 'Government', 150000, 'Bangalore'),
('sohan-pinto-id', 'Sohan Vikas Pinto', 'sohanpinto11@gmail.com', '$2a$10$K6a3WaI9Al6Vq2Q4cWKBoOeRgTXsInGbvgxQUugIIvZeawEufYqtu', 'PUC', 90.0, 'Science', 'AI Developer', 'Private', 300000, 'Mangalore');

-- Seed default user interests
INSERT OR IGNORE INTO interests (user_id, interest_id) VALUES
('default-student-id', 'coding'),
('default-student-id', 'ai'),
('sohan-pinto-id', 'coding'),
('sohan-pinto-id', 'ai');

