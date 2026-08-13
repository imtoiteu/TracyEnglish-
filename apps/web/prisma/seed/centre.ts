/**
 * The language centre's own data.
 *
 * Teachers, testimonials, FAQ answers, pricing and site copy. This is the half of the
 * product that is *not* ingested from a corpus — it describes Tracy English itself, and it
 * is all editable from the admin panel after seeding. What is here is the starting state.
 *
 * The teacher profiles are illustrative staff records for the demo database, not claims
 * about real named individuals.
 */

export const TEACHERS = [
  {
    slug: 'tracy-nguyen',
    name: 'Nguyễn Thu Trang (Tracy)',
    email: 'tracy@tracyenglish.vn',
    headlineVi: 'Sáng lập · Giảng viên IELTS & tiếng Anh học thuật',
    headlineEn: 'Founder · IELTS and academic English',
    bioVi:
      'Trang bắt đầu dạy tiếng Anh từ khi còn là sinh viên năm ba, và mười hai năm sau vẫn dạy đúng một thứ: cách để người Việt nói tiếng Anh mà không phải dịch trong đầu. Chị tin rằng phần lớn học viên không thiếu từ vựng — họ thiếu cơ hội dùng những gì đã biết. Lớp của chị vì thế nói nhiều hơn nghe giảng.',
    bioEn:
      'Trang started teaching in her third year at university and, twelve years on, still teaches the same thing: how a Vietnamese speaker can talk in English without translating first. Her classes talk more than they listen.',
    yearsExperience: 12,
    educationVi: [
      { qualification: 'Thạc sĩ Giảng dạy tiếng Anh (TESOL)', institution: 'Đại học Hà Nội', year: '2018' },
      { qualification: 'Cử nhân Sư phạm tiếng Anh', institution: 'Đại học Ngoại ngữ – ĐHQGHN', year: '2013' },
    ],
    certificatesVi: [
      { name: 'IELTS 8.5 (Overall)', issuer: 'British Council', year: '2022' },
      { name: 'Cambridge CELTA', issuer: 'Cambridge Assessment English', year: '2015' },
    ],
    achievementsVi: [
      'Đưa hơn 400 học viên đạt IELTS 6.5 trở lên',
      'Xây dựng chương trình tiếng Anh học thuật cho hai trường THPT tại Hà Nội',
    ],
    methodsVi: [
      'Học viên nói ít nhất 40% thời lượng mỗi buổi',
      'Sửa lỗi ngay tại chỗ với những lỗi ảnh hưởng đến nghĩa, ghi lại để chữa sau với lỗi nhỏ',
      'Mỗi tuần một bài viết được chấm chi tiết',
    ],
    specialties: ['ielts', 'writing', 'speaking', 'academic-english'],
    accent: 'brand',
  },
  {
    slug: 'le-minh-quan',
    name: 'Lê Minh Quân',
    email: 'quan@tracyenglish.vn',
    headlineVi: 'Giảng viên TOEIC & tiếng Anh công việc',
    headlineEn: 'TOEIC and Business English',
    bioVi:
      'Quân làm bảy năm trong ngành logistics trước khi chuyển hẳn sang dạy học, nên anh biết rõ thứ tiếng Anh mà người đi làm thực sự cần: viết email không lòng vòng, họp trực tuyến không mất lượt nói, và đọc hợp đồng không đoán mò. Anh dạy TOEIC theo hướng dùng được thật, không phải mẹo làm bài.',
    bioEn:
      'Quân spent seven years in logistics before moving into teaching full time, so he knows the English working adults actually need: email that gets to the point, meetings where you can hold your turn, contracts you can read without guessing.',
    yearsExperience: 8,
    educationVi: [
      { qualification: 'Cử nhân Kinh tế đối ngoại', institution: 'Đại học Ngoại thương', year: '2014' },
    ],
    certificatesVi: [
      { name: 'TOEIC 985', issuer: 'ETS', year: '2021' },
      { name: 'TESOL Certificate', issuer: 'Arizona State University', year: '2019' },
    ],
    achievementsVi: [
      'Đào tạo tiếng Anh nội bộ cho 6 doanh nghiệp logistics và sản xuất',
      'Tỷ lệ học viên đạt mục tiêu TOEIC sau một khoá: 87%',
    ],
    methodsVi: [
      'Bắt đầu từ tình huống công việc thật của chính học viên',
      'Ngân hàng cụm từ email và họp, luyện đến mức dùng được không cần nghĩ',
      'Chấm bài theo tiêu chí rõ ràng, không chấm cảm tính',
    ],
    specialties: ['toeic', 'business-english', 'reading', 'listening'],
    accent: 'ink',
  },
  {
    slug: 'pham-thi-ha',
    name: 'Phạm Thị Hà',
    email: 'ha@tracyenglish.vn',
    headlineVi: 'Giảng viên tiếng Anh thiếu nhi & THCS',
    headlineEn: 'Young learners and lower secondary',
    bioVi:
      'Hà dạy trẻ từ 7 đến 14 tuổi và có một nguyên tắc: một đứa trẻ sợ nói sai thì sẽ không bao giờ nói. Lớp của cô ồn ào có chủ đích — trò chơi, bài hát, đóng vai — nhưng bên dưới là một lộ trình ngữ âm và từ vựng rất chặt.',
    bioEn:
      'Hà teaches children from seven to fourteen on one principle: a child who is afraid of making a mistake will never speak. Her classes are noisy on purpose, over a strict phonics and vocabulary route underneath.',
    yearsExperience: 9,
    educationVi: [
      { qualification: 'Cử nhân Sư phạm tiếng Anh', institution: 'Đại học Sư phạm Hà Nội', year: '2016' },
    ],
    certificatesVi: [
      { name: 'TKT: Young Learners', issuer: 'Cambridge Assessment English', year: '2018' },
      { name: 'Jolly Phonics Trainer', issuer: 'Jolly Learning', year: '2020' },
    ],
    achievementsVi: [
      'Hơn 200 học sinh đạt Cambridge Starters/Movers/Flyers',
      'Thiết kế bộ giáo cụ ngữ âm dùng chung cho toàn trung tâm',
    ],
    methodsVi: [
      'Ngữ âm trước, chính tả sau — trẻ nghe đúng thì viết mới đúng',
      'Mỗi buổi có ít nhất hai hoạt động vận động',
      'Không chấm điểm trong 8 buổi đầu, chỉ nhận xét',
    ],
    specialties: ['pronunciation', 'vocabulary', 'cambridge', 'speaking'],
    accent: 'sun',
  },
  {
    slug: 'daniel-okoye',
    name: 'Daniel Okoye',
    email: 'daniel@tracyenglish.vn',
    headlineVi: 'Giáo viên bản ngữ · Luyện nói và phát âm',
    headlineEn: 'Native speaker · Speaking and pronunciation',
    bioVi:
      'Daniel đến Việt Nam năm 2019 và đã dạy hơn 3.000 giờ luyện nói. Anh học tiếng Việt đủ để hiểu vì sao học viên phát âm sai chỗ nào — và đó là lý do phần sửa phát âm của anh cụ thể chứ không chỉ là “nghe rồi nhắc lại”.',
    bioEn:
      'Daniel arrived in Vietnam in 2019 and has taught over 3,000 hours of speaking practice. He learnt enough Vietnamese to understand why a particular sound goes wrong, which is why his pronunciation feedback is specific rather than "listen and repeat".',
    yearsExperience: 7,
    educationVi: [
      { qualification: 'BA English Literature', institution: 'University of Leeds', year: '2017' },
    ],
    certificatesVi: [
      { name: 'CELTA', issuer: 'Cambridge Assessment English', year: '2018' },
      { name: 'IELTS Speaking Examiner training', issuer: 'IDP', year: '2023' },
    ],
    achievementsVi: [
      'Hơn 3.000 giờ dạy luyện nói 1–1',
      'Xây dựng khoá sửa lỗi phát âm dành riêng cho người nói tiếng Việt',
    ],
    methodsVi: [
      'Ghi âm học viên buổi đầu và buổi cuối để so sánh',
      'Tập trung vào âm cuối và trọng âm — hai lỗi làm người nghe hiểu sai nhiều nhất',
      'Sửa từng âm một, không sửa tất cả cùng lúc',
    ],
    specialties: ['speaking', 'pronunciation', 'ielts'],
    accent: 'coral',
  },
  {
    slug: 'vo-thanh-son',
    name: 'Võ Thanh Sơn',
    email: 'son@tracyenglish.vn',
    headlineVi: 'Giảng viên VSTEP & tiếng Anh phổ thông',
    headlineEn: 'VSTEP and school English',
    bioVi:
      'Sơn dạy VSTEP cho giáo viên, công chức và sinh viên cao học — nhóm học viên bận nhất và ít kiên nhẫn nhất với lý thuyết thừa. Anh chia nhỏ kỳ thi thành những kỹ năng luyện được trong 30 phút mỗi ngày.',
    bioEn:
      'Sơn teaches VSTEP to teachers, civil servants and postgraduate students — the busiest learners, with the least patience for theory. He breaks the exam into skills that fit into thirty minutes a day.',
    yearsExperience: 10,
    educationVi: [
      { qualification: 'Thạc sĩ Ngôn ngữ Anh', institution: 'Đại học Huế', year: '2017' },
    ],
    certificatesVi: [{ name: 'VSTEP bậc 5', issuer: 'Đại học Ngoại ngữ – ĐHQGHN', year: '2020' }],
    achievementsVi: ['Hơn 600 học viên đạt VSTEP bậc 3 và bậc 4', 'Biên soạn ngân hàng đề VSTEP nội bộ'],
    methodsVi: [
      'Học theo dạng bài, mỗi buổi một dạng',
      'Bài tập về nhà 30 phút, chấm trong 24 giờ',
      'Thi thử đầy đủ trước kỳ thi thật ít nhất hai lần',
    ],
    specialties: ['vstep', 'reading', 'writing', 'grammar'],
    accent: 'teal',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Trần Khánh Linh',
    roleVi: 'Sinh viên năm 3, Đại học Kinh tế Quốc dân',
    quoteVi:
      'Em học IELTS ở hai chỗ trước đó và đều dừng ở 5.5. Ở đây khác ở chỗ mỗi bài viết đều được chữa từng câu, chỉ rõ câu nào sai vì dịch từ tiếng Việt. Sau bốn tháng em được 7.0.',
    resultVi: 'IELTS 5.5 → 7.0 trong 4 tháng',
    courseSlug: 'ielts-foundation',
    rating: 5,
  },
  {
    name: 'Nguyễn Đức Anh',
    roleVi: 'Nhân viên xuất nhập khẩu',
    quoteVi:
      'Thầy Quân không dạy mẹo. Thầy bắt bọn em viết lại chính những email mình gửi ở công ty. Nghe thì chậm nhưng ba tháng sau em không còn phải nhờ ai đọc lại email trước khi gửi.',
    resultVi: 'TOEIC 480 → 760',
    courseSlug: 'toeic-target-700',
    rating: 5,
  },
  {
    name: 'Chị Hoàng Mai',
    roleVi: 'Phụ huynh học sinh lớp 5',
    quoteVi:
      'Con mình trước rất sợ giờ tiếng Anh. Cô Hà không chấm điểm mấy buổi đầu, chỉ khen khi con dám nói. Giờ con tự mở ứng dụng học từ vựng buổi tối mà mình không phải nhắc.',
    resultVi: 'Cambridge Movers 13/15 khiên',
    courseSlug: 'english-for-kids-starters',
    rating: 5,
  },
  {
    name: 'Phạm Quốc Việt',
    roleVi: 'Giáo viên THCS',
    quoteVi:
      'Mình cần VSTEP bậc 4 để chuẩn hoá. Điều mình đánh giá cao nhất là lịch học 30 phút mỗi ngày — vừa đủ để duy trì khi vẫn phải đi dạy cả tuần.',
    resultVi: 'VSTEP bậc 4',
    courseSlug: 'vstep-b2',
    rating: 5,
  },
  {
    name: 'Lê Thùy Dương',
    roleVi: 'Học sinh lớp 11',
    quoteVi:
      'Phần từ vựng có phát âm của người thật nên em bắt chước được ngữ điệu. Trước em học bằng app đọc máy, nói ra thầy cô bảo nghe rất lạ.',
    resultVi: 'Điểm tiếng Anh trên lớp: 7.2 → 9.0',
    courseSlug: 'high-school-grammar-core',
    rating: 5,
  },
  {
    name: 'Đỗ Anh Tuấn',
    roleVi: 'Kỹ sư phần mềm',
    quoteVi:
      'Mình tự học là chính, chỉ đặt kèm 1–1 hai buổi mỗi tháng để sửa phát âm. Nền tảng miễn phí đủ dùng thật, không phải kiểu mở ba bài rồi bắt trả tiền.',
    resultVi: 'Tự tin họp bằng tiếng Anh với khách hàng nước ngoài',
    courseSlug: 'daily-communication-a2',
    rating: 5,
  },
];

export const FAQS = [
  {
    category: 'general',
    questionVi: 'Học trên nền tảng có thực sự miễn phí không?',
    answerVi:
      'Có. Toàn bộ phần tự học — từ vựng, ngữ pháp, bài nghe, bài đọc, bài tập và theo dõi tiến độ — miễn phí và không giới hạn số bài. Chúng tôi thu phí ở phần có giáo viên: lớp trực tuyến, lớp tại trung tâm, kèm 1–1 và nhóm nhỏ.',
  },
  {
    category: 'general',
    questionVi: 'Học liệu trên nền tảng lấy từ đâu?',
    answerVi:
      'Từ các nguồn mở có giấy phép rõ ràng: VOA Learning English (thuộc phạm vi công cộng), Wiktionary tiếng Anh và tiếng Việt (CC BY-SA 4.0), Tatoeba (CC BY 2.0 FR), Wikimedia Commons và Lingua Libre cho phần thu âm, cùng CEFR-J Wordlist và Octanove Vocabulary Profile cho việc xếp trình độ. Trang Nguồn học liệu liệt kê đầy đủ từng nguồn và giấy phép.',
  },
  {
    category: 'general',
    questionVi: 'Phần phát âm có phải giọng máy không?',
    answerVi:
      'Không. Mọi bản thu phát âm trên nền tảng đều do người thật đọc, lấy từ Wikimedia Commons và Lingua Libre. Bài nghe dài là bản thu của phát thanh viên VOA. Chúng tôi không dùng giọng tổng hợp ở bất kỳ đâu.',
  },
  {
    category: 'learning',
    questionVi: 'Tôi mất gốc hoàn toàn thì bắt đầu từ đâu?',
    answerVi:
      'Làm bài kiểm tra trình độ khoảng 10 phút để biết mình đang ở đâu theo khung CEFR, rồi bắt đầu từ lộ trình Tiếng Anh cơ bản (A1–A2). Nếu vẫn phân vân, đăng ký tư vấn để giáo viên gọi lại và xếp lộ trình cụ thể.',
  },
  {
    category: 'learning',
    questionVi: 'Mỗi ngày nên học bao lâu?',
    answerVi:
      'Mục tiêu mặc định là 15 phút mỗi ngày, và bạn đổi được trong phần cài đặt. Học đều 15 phút bảy ngày hiệu quả hơn nhiều so với dồn hai tiếng vào cuối tuần, vì hệ thống ôn từ vựng theo giãn cách chỉ hoạt động đúng khi bạn quay lại đều đặn.',
  },
  {
    category: 'learning',
    questionVi: 'Hệ thống ôn từ vựng hoạt động thế nào?',
    answerVi:
      'Mỗi từ bạn học được xếp vào một hộp ôn tập. Trả lời đúng thì từ đó chuyển lên hộp cao hơn và lần ôn sau lùi xa hơn; trả lời sai thì quay về hộp đầu. Nhờ vậy bạn dành thời gian cho những từ hay quên thay vì ôn lại những từ đã thuộc.',
  },
  {
    category: 'classes',
    questionVi: 'Lớp trực tuyến và lớp tại trung tâm khác nhau thế nào?',
    answerVi:
      'Nội dung giống nhau. Lớp trực tuyến có 8–12 học viên, học qua video, có ghi hình lại. Lớp tại trung tâm tối đa 15 học viên, phù hợp với học sinh cần môi trường kỷ luật và có báo cáo gửi phụ huynh hằng tháng.',
  },
  {
    category: 'classes',
    questionVi: 'Tôi có thể học thử trước khi đăng ký không?',
    answerVi:
      'Có. Mỗi lớp đều có một buổi học thử miễn phí. Với kèm 1–1, buổi đầu là buổi kiểm tra trình độ và thiết kế lộ trình, cũng miễn phí.',
  },
  {
    category: 'classes',
    questionVi: 'Nếu tôi bận và nghỉ buổi học thì sao?',
    answerVi:
      'Lớp trực tuyến có bản ghi hình, bạn xem lại được trong 30 ngày. Với kèm 1–1, bạn đổi lịch miễn phí nếu báo trước 12 giờ.',
  },
  {
    category: 'payment',
    questionVi: 'Trung tâm nhận thanh toán bằng hình thức nào?',
    answerVi:
      'Hiện tại là chuyển khoản ngân hàng và tiền mặt tại trung tâm. Hệ thống đã sẵn sàng cho cổng thanh toán trực tuyến và sẽ bật khi hoàn tất thủ tục.',
  },
  {
    category: 'payment',
    questionVi: 'Có hoàn học phí không?',
    answerVi:
      'Trong ba buổi đầu của khoá, nếu bạn thấy không phù hợp, trung tâm hoàn lại phần học phí chưa sử dụng.',
  },
];

export const PRODUCTS = [
  {
    sku: 'SELF-STUDY-FREE',
    kind: 'COURSE',
    titleVi: 'Tự học',
    titleEn: 'Self-study',
    descriptionVi: 'Toàn bộ nội dung tự học trên nền tảng, không giới hạn.',
    priceVnd: 0,
    quantity: 1,
    durationDays: 3650,
    features: [
      'Hơn 8.000 từ vựng có phiên âm và nghĩa tiếng Việt',
      'Hơn 30 chủ điểm ngữ pháp có bài tập chữa chi tiết',
      'Hàng trăm bài nghe và bài đọc kèm lời thoại',
      'Ôn từ vựng theo giãn cách, theo dõi tiến độ và thành tích',
    ],
    accent: 'teal',
  },
  {
    sku: 'ONLINE-CLASS-12',
    kind: 'CLASS',
    titleVi: 'Lớp trực tuyến — 12 buổi',
    titleEn: 'Online class — 12 sessions',
    descriptionVi: 'Hai buổi mỗi tuần trong sáu tuần, 8–12 học viên, có ghi hình.',
    priceVnd: 3_600_000,
    comparePriceVnd: 4_200_000,
    quantity: 12,
    durationDays: 90,
    features: [
      '12 buổi × 90 phút với giáo viên',
      'Bản ghi hình xem lại trong 30 ngày',
      'Bài viết được chấm hằng tuần',
      'Một buổi học thử miễn phí',
    ],
    accent: 'sky',
    isPopular: true,
  },
  {
    sku: 'OFFLINE-CLASS-12',
    kind: 'CLASS',
    titleVi: 'Lớp tại trung tâm — 12 buổi',
    titleEn: 'Class at the centre — 12 sessions',
    descriptionVi: 'Học trực tiếp tại lớp, tối đa 15 học viên, có báo cáo gửi phụ huynh.',
    priceVnd: 4_200_000,
    quantity: 12,
    durationDays: 90,
    features: [
      '12 buổi × 90 phút tại trung tâm',
      'Sĩ số tối đa 15',
      'Báo cáo tiến độ hằng tháng',
      'Thư viện sách đọc thêm',
    ],
    accent: 'brand',
  },
  {
    sku: 'ONE-TO-ONE-10',
    kind: 'TUTORING',
    titleVi: 'Kèm 1–1 — gói 10 buổi',
    titleEn: 'One-to-one — 10 sessions',
    descriptionVi: 'Lộ trình riêng, lịch linh hoạt, giáo viên do bạn chọn.',
    priceVnd: 7_500_000,
    quantity: 10,
    durationDays: 120,
    features: [
      '10 buổi × 60 phút',
      'Buổi kiểm tra trình độ và thiết kế lộ trình miễn phí',
      'Đổi lịch miễn phí nếu báo trước 12 giờ',
      'Chấm bài viết không giới hạn trong thời gian gói còn hiệu lực',
    ],
    accent: 'coral',
  },
  {
    sku: 'SMALL-GROUP-10',
    kind: 'CLASS',
    titleVi: 'Nhóm nhỏ 3–5 người — 10 buổi',
    titleEn: 'Small group — 10 sessions',
    descriptionVi: 'Tự lập nhóm với bạn bè hoặc đồng nghiệp cùng trình độ.',
    priceVnd: 4_000_000,
    quantity: 10,
    durationDays: 120,
    features: [
      '10 buổi × 90 phút',
      'Tối đa 5 học viên',
      'Nội dung điều chỉnh theo mục tiêu chung của nhóm',
      'Học phí tính trên mỗi học viên',
    ],
    accent: 'sun',
  },
  {
    sku: 'CONSULT-FREE',
    kind: 'CONSULTATION',
    titleVi: 'Tư vấn lộ trình',
    titleEn: 'Route consultation',
    descriptionVi: 'Một buổi tư vấn 30 phút, có bài kiểm tra trình độ đi kèm.',
    priceVnd: 0,
    quantity: 1,
    durationDays: 30,
    features: ['Kiểm tra trình độ theo khung CEFR', 'Đề xuất lộ trình cụ thể', 'Không mất phí, không ràng buộc'],
    accent: 'ink',
  },
];

export const ACHIEVEMENTS = [
  { code: 'FIRST_LESSON', titleVi: 'Bài học đầu tiên', titleEn: 'First lesson', descriptionVi: 'Hoàn thành bài học đầu tiên trên nền tảng.', icon: 'flag', accent: 'teal', metric: 'LESSONS', threshold: 1 },
  { code: 'TEN_LESSONS', titleVi: 'Mười bài học', titleEn: 'Ten lessons', descriptionVi: 'Hoàn thành 10 bài học.', icon: 'book-open', accent: 'brand', metric: 'LESSONS', threshold: 10 },
  { code: 'FIFTY_LESSONS', titleVi: 'Năm mươi bài học', titleEn: 'Fifty lessons', descriptionVi: 'Hoàn thành 50 bài học.', icon: 'library', accent: 'coral', metric: 'LESSONS', threshold: 50 },
  { code: 'WORDS_50', titleVi: 'Năm mươi từ đã thuộc', titleEn: 'Fifty words mastered', descriptionVi: 'Đưa 50 từ lên mức đã thuộc.', icon: 'sparkles', accent: 'rose', metric: 'WORDS', threshold: 50 },
  { code: 'WORDS_200', titleVi: 'Hai trăm từ đã thuộc', titleEn: 'Two hundred words mastered', descriptionVi: 'Đưa 200 từ lên mức đã thuộc.', icon: 'gem', accent: 'rose', metric: 'WORDS', threshold: 200 },
  { code: 'WORDS_1000', titleVi: 'Một nghìn từ đã thuộc', titleEn: 'A thousand words mastered', descriptionVi: 'Đưa 1.000 từ lên mức đã thuộc — đủ để đọc hiểu phần lớn tin tức đơn giản.', icon: 'crown', accent: 'sun', metric: 'WORDS', threshold: 1000 },
  { code: 'STREAK_7', titleVi: 'Bảy ngày liên tiếp', titleEn: 'Seven-day streak', descriptionVi: 'Học đủ bảy ngày liên tiếp.', icon: 'flame', accent: 'coral', metric: 'STREAK', threshold: 7 },
  { code: 'STREAK_30', titleVi: 'Ba mươi ngày liên tiếp', titleEn: 'Thirty-day streak', descriptionVi: 'Học đủ ba mươi ngày liên tiếp.', icon: 'flame', accent: 'sun', metric: 'STREAK', threshold: 30 },
  { code: 'STREAK_100', titleVi: 'Một trăm ngày liên tiếp', titleEn: 'Hundred-day streak', descriptionVi: 'Học đủ một trăm ngày liên tiếp.', icon: 'trophy', accent: 'sun', metric: 'STREAK', threshold: 100 },
  { code: 'EXERCISES_100', titleVi: 'Một trăm câu đúng', titleEn: 'A hundred correct', descriptionVi: 'Trả lời đúng 100 câu bài tập.', icon: 'check-circle', accent: 'teal', metric: 'EXERCISES', threshold: 100 },
  { code: 'EXERCISES_500', titleVi: 'Năm trăm câu đúng', titleEn: 'Five hundred correct', descriptionVi: 'Trả lời đúng 500 câu bài tập.', icon: 'medal', accent: 'brand', metric: 'EXERCISES', threshold: 500 },
  { code: 'XP_1000', titleVi: 'Một nghìn điểm kinh nghiệm', titleEn: 'A thousand XP', descriptionVi: 'Tích luỹ 1.000 điểm kinh nghiệm.', icon: 'zap', accent: 'sun', metric: 'XP', threshold: 1000 },
];

export const SETTINGS = [
  { key: 'contact.address', group: 'contact', label: 'Địa chỉ', valueVi: 'Số 18, ngõ 42 Trần Thái Tông, Cầu Giấy, Hà Nội', valueEn: '18, Lane 42 Tran Thai Tong, Cau Giay, Hanoi' },
  { key: 'contact.phone', group: 'contact', label: 'Điện thoại', valueVi: '024 6666 8899', valueEn: '+84 24 6666 8899' },
  { key: 'contact.hotline', group: 'contact', label: 'Hotline tư vấn', valueVi: '0912 345 678', valueEn: '+84 912 345 678' },
  { key: 'contact.email', group: 'contact', label: 'Email', valueVi: 'hello@tracyenglish.vn', valueEn: 'hello@tracyenglish.vn' },
  { key: 'contact.hours', group: 'contact', label: 'Giờ làm việc', valueVi: 'Thứ 2 – Thứ 7: 8:00 – 21:00 · Chủ nhật: 8:00 – 17:00', valueEn: 'Mon–Sat 8am–9pm · Sun 8am–5pm' },
  { key: 'social.facebook', group: 'social', label: 'Facebook', valueVi: 'https://facebook.com/tracyenglish.vn', valueEn: 'https://facebook.com/tracyenglish.vn' },
  { key: 'social.youtube', group: 'social', label: 'YouTube', valueVi: 'https://youtube.com/@tracyenglish', valueEn: 'https://youtube.com/@tracyenglish' },
  { key: 'social.zalo', group: 'social', label: 'Zalo', valueVi: 'https://zalo.me/0912345678', valueEn: 'https://zalo.me/0912345678' },
  { key: 'footer.tagline', group: 'general', label: 'Câu giới thiệu ở chân trang', valueVi: 'Nền tảng học tiếng Anh dành cho người Việt, xây dựng trên học liệu mở có giấy phép rõ ràng.', valueEn: 'An English learning platform for Vietnamese learners, built on openly licensed material.' },
  { key: 'home.announcement', group: 'general', label: 'Thông báo trên đầu trang', valueVi: 'Khai giảng lớp IELTS Foundation tháng này — học thử miễn phí một buổi.', valueEn: 'New IELTS Foundation class this month — one free trial session.' },
];

export const PAGES = [
  {
    slug: 'about',
    titleVi: 'Về Tracy English',
    titleEn: 'About Tracy English',
    bodyVi: `## Chúng tôi làm gì

Tracy English là một trung tâm tiếng Anh, và cũng là một nền tảng học tiếng Anh. Hai nửa đó dùng chung một hệ thống: khoá học mà học viên tự học ở nhà chính là khoá học giáo viên dạy trên lớp.

## Vì sao chúng tôi xây nền tảng riêng

Phần lớn ứng dụng học tiếng Anh dành cho người Việt đều gặp cùng một vấn đề: nội dung do máy sinh ra hàng loạt. Câu ví dụ không ai nói ngoài đời, phát âm là giọng tổng hợp, giải thích ngữ pháp dịch máy từ tiếng Anh sang.

Chúng tôi làm ngược lại. Mỗi từ vựng trên nền tảng có nghĩa tiếng Việt lấy từ từ điển Anh–Việt thật, phiên âm lấy từ Wiktionary, bản thu do người bản xứ đọc, và câu ví dụ do người thật viết trên Tatoeba. Bài nghe là bản thu của phát thanh viên VOA Learning English. Mọi nguồn đều có giấy phép mở và được ghi rõ trên trang Nguồn học liệu.

## Phần nào do chúng tôi viết

Phần giải thích bằng tiếng Việt. Không có tài liệu ngữ pháp tiếng Việt nào được cấp phép mở để dùng lại, và dịch máy một bài giảng tiếng Anh sang tiếng Việt thì vô nghĩa — giá trị của một lời giải thích bằng tiếng Việt nằm ở chỗ nó chỉ đúng lỗi mà người Việt hay mắc, do đặc điểm tiếng mẹ đẻ. Phần đó do giáo viên của trung tâm viết, và được đánh dấu rõ trong bài học.

## Cam kết

- Phần tự học miễn phí, không giới hạn số bài.
- Không dùng giọng đọc tổng hợp ở bất kỳ đâu.
- Ghi rõ nguồn và giấy phép của mọi học liệu.`,
    bodyEn: `## What we do

Tracy English is a language centre and a learning platform. Both halves run on one system: the course a learner works through at home is the course a teacher teaches in class.

## Why we built our own platform

Most English apps aimed at Vietnamese learners share a problem: the content is generated in bulk. Example sentences nobody would say, synthetic pronunciation, grammar explanations machine-translated out of English.

We did the opposite. Every word carries a Vietnamese meaning from a real English–Vietnamese dictionary, phonetics from Wiktionary, a recording made by a person, and example sentences written by people on Tatoeba. Listening is VOA Learning English broadcast audio. Every source is openly licensed and credited.

## What we wrote ourselves

The Vietnamese explanations. There is no openly licensed Vietnamese-language English grammar reference to reuse, and machine-translating an English explanation defeats the point — the value of a Vietnamese explanation is that it names the specific interference from Vietnamese that causes the error. Our teachers write those, and they are labelled as such.`,
  },
  {
    slug: 'terms',
    titleVi: 'Điều khoản sử dụng',
    titleEn: 'Terms of use',
    bodyVi: `## Tài khoản

Bạn chịu trách nhiệm giữ an toàn cho mật khẩu của mình. Một tài khoản dành cho một người học.

## Nội dung

Nội dung học liệu trên nền tảng đến từ các nguồn mở. Giấy phép của từng nguồn được ghi trên trang Nguồn học liệu và phải được tôn trọng khi bạn sử dụng lại. Phần giải thích và bài tập do Tracy English biên soạn thuộc bản quyền của trung tâm.

## Học phí và hoàn phí

Phần tự học miễn phí. Với các lớp có giáo viên, trong ba buổi đầu nếu bạn thấy không phù hợp, trung tâm hoàn lại phần học phí chưa sử dụng.

## Thay đổi điều khoản

Khi có thay đổi, chúng tôi thông báo trên trang này và gửi email tới các tài khoản đang hoạt động trước ít nhất 14 ngày.`,
    bodyEn: '',
  },
  {
    slug: 'privacy',
    titleVi: 'Chính sách quyền riêng tư',
    titleEn: 'Privacy policy',
    bodyVi: `## Chúng tôi lưu những gì

Tên, email, số điện thoại nếu bạn cung cấp, và dữ liệu học tập của bạn: bài đã học, câu trả lời, tiến độ từ vựng, chuỗi ngày học.

## Chúng tôi dùng để làm gì

Để hiển thị tiến độ, gợi ý nội dung tiếp theo, và nhắc ôn từ vựng đúng lúc. Giáo viên phụ trách lớp của bạn xem được tiến độ của bạn.

## Chúng tôi không làm gì

Không bán dữ liệu cho bên thứ ba. Không chia sẻ dữ liệu học tập của bạn với ai ngoài giáo viên phụ trách và phụ huynh nếu bạn là học sinh dưới 16 tuổi.

## Quyền của bạn

Bạn có thể yêu cầu xuất toàn bộ dữ liệu của mình hoặc xoá tài khoản bằng cách liên hệ hello@tracyenglish.vn. Chúng tôi xử lý trong vòng 14 ngày.`,
    bodyEn: '',
  },
];
