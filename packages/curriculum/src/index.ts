/**
 * The curriculum map.
 *
 * This is the shape of the catalogue — which tracks exist, who they are for, and how a
 * learner moves between them. It is deliberately data rather than database rows, because
 * the *shape* of an English curriculum is a design decision that should be reviewable in a
 * diff; the *content* that fills it lives in the database and is edited by administrators.
 *
 * The eleven tracks cover the whole audience the centre serves: primary pupils through to
 * working professionals, and every major exam Vietnamese learners sit.
 */

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const SKILLS = [
  'listening',
  'reading',
  'writing',
  'speaking',
  'grammar',
  'vocabulary',
  'pronunciation',
] as const;
export type Skill = (typeof SKILLS)[number];

export const SEGMENTS = [
  'PRIMARY',
  'SECONDARY',
  'HIGH_SCHOOL',
  'UNIVERSITY',
  'ADULT',
  'PROFESSIONAL',
] as const;
export type Segment = (typeof SEGMENTS)[number];

export const DELIVERY_MODES = [
  'SELF_STUDY',
  'ONLINE_CLASS',
  'OFFLINE_CLASS',
  'ONE_TO_ONE',
  'SMALL_GROUP',
] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export type TrackSpec = {
  slug: string;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  summaryEn: string;
  category: 'AGE' | 'GENERAL' | 'EXAM' | 'SKILL';
  audience: Segment[];
  accent: string;
  icon: string;
};

export const TRACKS: TrackSpec[] = [
  {
    slug: 'english-for-children',
    titleVi: 'Tiếng Anh cho trẻ em',
    titleEn: 'English for children',
    summaryVi:
      'Dành cho học sinh tiểu học. Bắt đầu từ bảng chữ cái và âm, học qua bài hát, truyện ngắn và trò chơi từ vựng.',
    summaryEn:
      'For primary pupils. Starts from letters and sounds, taught through songs, short stories and vocabulary games.',
    category: 'AGE',
    audience: ['PRIMARY'],
    accent: 'sun',
    icon: 'sparkles',
  },
  {
    slug: 'english-for-secondary',
    titleVi: 'Tiếng Anh trung học cơ sở',
    titleEn: 'English for lower secondary',
    summaryVi:
      'Bám sát chương trình lớp 6–9: ngữ pháp nền tảng, từ vựng theo chủ đề sách giáo khoa và luyện đề kiểm tra.',
    summaryEn:
      'Aligned to grades 6–9: foundation grammar, textbook topic vocabulary and school-test practice.',
    category: 'AGE',
    audience: ['SECONDARY'],
    accent: 'teal',
    icon: 'backpack',
  },
  {
    slug: 'english-for-high-school',
    titleVi: 'Tiếng Anh trung học phổ thông',
    titleEn: 'English for upper secondary',
    summaryVi:
      'Lớp 10–12 và ôn thi tốt nghiệp: ngữ pháp nâng cao, đọc hiểu dài hơn, viết đoạn và luyện đề.',
    summaryEn:
      'Grades 10–12 and the national exam: advanced grammar, longer reading, paragraph writing and past papers.',
    category: 'AGE',
    audience: ['HIGH_SCHOOL'],
    accent: 'sky',
    icon: 'graduation-cap',
  },
  {
    slug: 'basic-english',
    titleVi: 'Tiếng Anh cơ bản',
    titleEn: 'Basic English',
    summaryVi:
      'Lộ trình A1–A2 cho người mất gốc hoặc bắt đầu lại. Học từ câu chào hỏi đến kể được về bản thân và công việc.',
    summaryEn:
      'An A1–A2 route for absolute or returning beginners — from greetings to talking about yourself and your work.',
    category: 'GENERAL',
    audience: ['ADULT', 'UNIVERSITY', 'PROFESSIONAL'],
    accent: 'brand',
    icon: 'seedling',
  },
  {
    slug: 'daily-communication',
    titleVi: 'Giao tiếp hằng ngày',
    titleEn: 'Everyday communication',
    summaryVi:
      'Tiếng Anh dùng được ngay: mua hàng, hỏi đường, đặt lịch hẹn, nói chuyện xã giao, gọi điện.',
    summaryEn:
      'English you can use today: shopping, directions, appointments, small talk and phone calls.',
    category: 'GENERAL',
    audience: ['ADULT', 'UNIVERSITY', 'PROFESSIONAL'],
    accent: 'coral',
    icon: 'message-circle',
  },
  {
    slug: 'travel-english',
    titleVi: 'Tiếng Anh du lịch',
    titleEn: 'Travel English',
    summaryVi:
      'Sân bay, khách sạn, nhà hàng, giao thông và xử lý tình huống khi đi nước ngoài.',
    summaryEn: 'Airports, hotels, restaurants, transport and coping when something goes wrong abroad.',
    category: 'GENERAL',
    audience: ['ADULT', 'PROFESSIONAL'],
    accent: 'teal',
    icon: 'plane',
  },
  {
    slug: 'business-english',
    titleVi: 'Tiếng Anh công việc',
    titleEn: 'Business English',
    summaryVi:
      'Email, họp trực tuyến, thuyết trình, đàm phán và tiếng Anh chuyên ngành cho người đi làm.',
    summaryEn:
      'Email, online meetings, presentations, negotiation and sector vocabulary for working professionals.',
    category: 'GENERAL',
    audience: ['PROFESSIONAL', 'ADULT'],
    accent: 'ink',
    icon: 'briefcase',
  },
  {
    slug: 'academic-english',
    titleVi: 'Tiếng Anh học thuật',
    titleEn: 'Academic English',
    summaryVi:
      'Dành cho sinh viên và người chuẩn bị du học: đọc tài liệu chuyên ngành, ghi chép bài giảng, viết luận.',
    summaryEn:
      'For students and prospective international students: reading papers, lecture notes and essay writing.',
    category: 'GENERAL',
    audience: ['UNIVERSITY', 'HIGH_SCHOOL'],
    accent: 'brand',
    icon: 'library',
  },
  {
    slug: 'exam-preparation',
    titleVi: 'Luyện thi chứng chỉ',
    titleEn: 'Exam preparation',
    summaryVi:
      'IELTS, TOEIC, TOEFL, VSTEP và Cambridge — mỗi kỳ thi một lộ trình riêng, tách theo bốn kỹ năng.',
    summaryEn:
      'IELTS, TOEIC, TOEFL, VSTEP and Cambridge — a separate route for each, split across the four skills.',
    category: 'EXAM',
    audience: ['HIGH_SCHOOL', 'UNIVERSITY', 'ADULT', 'PROFESSIONAL'],
    accent: 'rose',
    icon: 'target',
  },
  {
    slug: 'skills-workshop',
    titleVi: 'Rèn từng kỹ năng',
    titleEn: 'Skills workshop',
    summaryVi:
      'Học riêng từng kỹ năng: nghe, đọc, viết, nói, cộng thêm ngữ pháp, từ vựng và phát âm.',
    summaryEn:
      'Work on one skill at a time: listening, reading, writing, speaking, plus grammar, vocabulary and pronunciation.',
    category: 'SKILL',
    audience: ['SECONDARY', 'HIGH_SCHOOL', 'UNIVERSITY', 'ADULT', 'PROFESSIONAL'],
    accent: 'sky',
    icon: 'layers',
  },
  {
    slug: 'pronunciation-lab',
    titleVi: 'Phòng luyện phát âm',
    titleEn: 'Pronunciation lab',
    summaryVi:
      'Những âm tiếng Việt không có, âm cuối, trọng âm và ngữ điệu — sửa đúng những lỗi người Việt hay mắc.',
    summaryEn:
      'The sounds Vietnamese does not have, final consonants, stress and intonation — the specific errors Vietnamese speakers make.',
    category: 'SKILL',
    audience: ['SECONDARY', 'HIGH_SCHOOL', 'UNIVERSITY', 'ADULT', 'PROFESSIONAL'],
    accent: 'coral',
    icon: 'mic',
  },
];

export type ExamSpec = {
  slug: string;
  name: string;
  nameVi: string;
  summaryVi: string;
  skills: Skill[];
  bandVi: string;
  accent: string;
};

export const EXAMS: ExamSpec[] = [
  {
    slug: 'ielts',
    name: 'IELTS',
    nameVi: 'IELTS',
    summaryVi:
      'Kỳ thi phổ biến nhất cho du học và định cư. Bốn kỹ năng, thang điểm 0–9, thi trên giấy hoặc máy tính.',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    bandVi: 'Thang 0–9 · mục tiêu phổ biến: 6.0–7.5',
    accent: 'rose',
  },
  {
    slug: 'toeic',
    name: 'TOEIC',
    nameVi: 'TOEIC',
    summaryVi:
      'Chứng chỉ tiếng Anh công việc được doanh nghiệp Việt Nam dùng nhiều nhất. Bản đầy đủ gồm cả bốn kỹ năng.',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    bandVi: 'Nghe–Đọc 10–990 · mục tiêu phổ biến: 550–800',
    accent: 'ink',
  },
  {
    slug: 'toefl',
    name: 'TOEFL iBT',
    nameVi: 'TOEFL iBT',
    summaryVi:
      'Được các trường đại học Bắc Mỹ ưa dùng. Bài thi tích hợp, yêu cầu nghe và đọc rồi mới viết hoặc nói.',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    bandVi: 'Thang 0–120 · mục tiêu phổ biến: 80–100',
    accent: 'sky',
  },
  {
    slug: 'vstep',
    name: 'VSTEP',
    nameVi: 'VSTEP',
    summaryVi:
      'Khung năng lực ngoại ngữ 6 bậc của Việt Nam, dùng cho tuyển dụng công chức, chuẩn đầu ra đại học và cao học.',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    bandVi: 'Bậc 1–6 · mục tiêu phổ biến: bậc 3 (B1) và bậc 4 (B2)',
    accent: 'teal',
  },
  {
    slug: 'cambridge',
    name: 'Cambridge English',
    nameVi: 'Cambridge English',
    summaryVi:
      'Hệ chứng chỉ Starters–KET–PET–FCE–CAE. Rất phổ biến với học sinh phổ thông và các trường quốc tế.',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    bandVi: 'Starters → CAE · gắn trực tiếp với khung CEFR',
    accent: 'brand',
  },
];

export type LearningFormat = {
  slug: string;
  mode: DeliveryMode;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  featuresVi: string[];
  accent: string;
  icon: string;
};

export const LEARNING_FORMATS: LearningFormat[] = [
  {
    slug: 'self-study',
    mode: 'SELF_STUDY',
    titleVi: 'Tự học',
    titleEn: 'Self-study',
    summaryVi:
      'Toàn bộ bài học, từ vựng, ngữ pháp, bài nghe và bài đọc trên nền tảng đều miễn phí và mở sẵn.',
    featuresVi: [
      'Học bất cứ lúc nào, không cần đăng ký lớp',
      'Hệ thống ôn từ vựng theo giãn cách nhắc bạn đúng lúc sắp quên',
      'Bài tập tự chấm, có giải thích bằng tiếng Việt',
      'Theo dõi tiến độ, chuỗi ngày học và thành tích',
    ],
    accent: 'teal',
    icon: 'book-open',
  },
  {
    slug: 'online-class',
    mode: 'ONLINE_CLASS',
    titleVi: 'Lớp trực tuyến',
    titleEn: 'Online class',
    summaryVi:
      'Lớp học trực tiếp qua video với giáo viên, lịch cố định hằng tuần, có bài tập về nhà được chấm.',
    featuresVi: [
      'Sĩ số 8–12 học viên',
      'Hai buổi mỗi tuần, mỗi buổi 90 phút',
      'Ghi hình lại để xem lại nếu bận',
      'Giáo viên chấm bài viết và nhận xét phát âm',
    ],
    accent: 'sky',
    icon: 'video',
  },
  {
    slug: 'offline-class',
    mode: 'OFFLINE_CLASS',
    titleVi: 'Lớp tại trung tâm',
    titleEn: 'Class at the centre',
    summaryVi:
      'Học trực tiếp tại lớp, phù hợp với học sinh cần môi trường có kỷ luật và bạn học cùng lứa.',
    featuresVi: [
      'Sĩ số tối đa 15 học viên',
      'Giáo viên theo sát từng buổi',
      'Có góc luyện nói và thư viện sách đọc thêm',
      'Báo cáo tiến độ gửi phụ huynh hằng tháng',
    ],
    accent: 'brand',
    icon: 'school',
  },
  {
    slug: 'one-to-one',
    mode: 'ONE_TO_ONE',
    titleVi: 'Kèm 1–1',
    titleEn: 'One-to-one',
    summaryVi:
      'Một giáo viên, một học viên, lộ trình thiết kế riêng theo mục tiêu và lịch của bạn.',
    featuresVi: [
      'Lịch học linh hoạt, đổi lịch trước 12 giờ',
      'Giáo trình thiết kế riêng sau buổi kiểm tra đầu vào',
      'Thời lượng nói gấp nhiều lần lớp đông',
      'Phù hợp cho người cần gấp chứng chỉ hoặc chuẩn bị phỏng vấn',
    ],
    accent: 'coral',
    icon: 'user',
  },
  {
    slug: 'small-group',
    mode: 'SMALL_GROUP',
    titleVi: 'Nhóm nhỏ',
    titleEn: 'Small group',
    summaryVi:
      'Nhóm 3–5 người cùng trình độ và cùng mục tiêu — vừa có bạn luyện nói, vừa giữ được sự chú ý của giáo viên.',
    featuresVi: [
      'Tối đa 5 học viên mỗi nhóm',
      'Có thể tự lập nhóm với bạn bè hoặc đồng nghiệp',
      'Học phí thấp hơn kèm 1–1',
      'Nhiều hoạt động luyện nói theo cặp',
    ],
    accent: 'sun',
    icon: 'users',
  },
];

/** The seven-part lesson shape every lesson on the platform follows. */
export const LESSON_STAGES = [
  { key: 'objective', titleVi: 'Mục tiêu bài học', titleEn: 'Learning objective' },
  { key: 'explanation', titleVi: 'Giải thích', titleEn: 'Explanation' },
  { key: 'examples', titleVi: 'Ví dụ', titleEn: 'Examples' },
  { key: 'practice', titleVi: 'Luyện tập', titleEn: 'Practice' },
  { key: 'feedback', titleVi: 'Nhận xét', titleEn: 'Feedback' },
  { key: 'summary', titleVi: 'Tóm tắt', titleEn: 'Summary' },
  { key: 'nextStep', titleVi: 'Bước tiếp theo', titleEn: 'Next step' },
] as const;

export function levelRank(level: string): number {
  const index = (CEFR_LEVELS as readonly string[]).indexOf(level);
  return index < 0 ? 0 : index;
}

export function levelAtOrBelow(level: string, ceiling: string): boolean {
  return levelRank(level) <= levelRank(ceiling);
}

/** Suggest the next level up, for "what should I study next" recommendations. */
export function nextLevel(level: string): CefrLevel {
  const index = levelRank(level);
  return CEFR_LEVELS[Math.min(index + 1, CEFR_LEVELS.length - 1)];
}
