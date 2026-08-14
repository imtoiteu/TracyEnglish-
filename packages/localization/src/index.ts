/**
 * Localisation for Tracy English.
 *
 * Vietnamese is the primary language of this product, not a translation of it. The
 * Vietnamese strings were written first and the English ones follow; where the two differ
 * in tone, the Vietnamese one is right.
 *
 * A deliberate distinction runs through the whole platform:
 *
 *   *Interface* language is what `locale` selects — navigation, buttons, explanations,
 *   feedback. A Vietnamese learner reads all of that in Vietnamese.
 *
 *   *Study* language is English and is never translated away. A vocabulary card shows the
 *   English word, its IPA and English example sentences no matter which locale is active,
 *   because those are the object of study. What changes with locale is the explanation
 *   around them.
 *
 * That is why `t()` covers the interface and content models carry explicit `…Vi` / `…En`
 * columns for the teaching text.
 */

export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'vi';

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Read the locale out of a pathname such as `/vi/courses/ielts`. */
export function localeFromPath(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

/** Swap the locale segment of a path, keeping the rest intact. */
export function withLocale(pathname: string, locale: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && isLocale(parts[0])) {
    parts[0] = locale;
  } else {
    parts.unshift(locale);
  }
  return `/${parts.join('/')}`;
}

type Messages = Record<string, string>;

/**
 * Pick the right side of a bilingual content field.
 *
 * Content authored in the admin panel always has a Vietnamese value; the English one is
 * optional, so English readers fall back to Vietnamese rather than seeing an empty card.
 */
export function pick(locale: Locale, vi: string | null | undefined, en?: string | null): string {
  if (locale === 'en') return (en && en.trim()) || vi || '';
  return (vi && vi.trim()) || en || '';
}

const vi: Messages = {
  // ---- brand & navigation -------------------------------------------------
  'brand.name': 'Tracy English',
  'brand.tagline': 'Học tiếng Anh có lộ trình, có người đồng hành',
  'nav.home': 'Trang chủ',
  'nav.courses': 'Khoá học',
  'nav.learn': 'Tự học',
  'nav.vocabulary': 'Từ vựng',
  'nav.grammar': 'Ngữ pháp',
  'nav.listening': 'Luyện nghe',
  'nav.reading': 'Luyện đọc',
  'nav.writing': 'Luyện viết',
  'nav.speaking': 'Luyện nói',
  'nav.exams': 'Luyện thi',
  'nav.practice': 'Luyện tập',
  'nav.classes': 'Lớp học',
  'nav.teachers': 'Giáo viên',
  'nav.tuition': 'Học tại trung tâm',
  'nav.pricing': 'Học phí',
  'nav.about': 'Giới thiệu',
  'nav.contact': 'Liên hệ',
  'nav.blog': 'Bài viết',
  'nav.dashboard': 'Bảng học tập',
  'nav.progress': 'Tiến độ',
  'nav.achievements': 'Thành tích',
  'nav.bookmarks': 'Đã lưu',
  'nav.admin': 'Quản trị',
  'nav.teacherArea': 'Khu vực giáo viên',
  'nav.credits': 'Nguồn học liệu',
  'nav.placement': 'Kiểm tra trình độ',
  'nav.menu': 'Menu',
  'nav.close': 'Đóng',

  // ---- actions ------------------------------------------------------------
  'action.start': 'Bắt đầu học',
  'action.continue': 'Học tiếp',
  'action.startFree': 'Học thử miễn phí',
  'action.viewAll': 'Xem tất cả',
  'action.viewCourse': 'Xem khoá học',
  'action.enroll': 'Đăng ký học',
  'action.enrolled': 'Đã ghi danh',
  'action.consult': 'Đăng ký tư vấn',
  'action.bookTrial': 'Đặt buổi học thử',
  'action.login': 'Đăng nhập',
  'action.logout': 'Đăng xuất',
  'action.register': 'Tạo tài khoản',
  'action.save': 'Lưu',
  'action.cancel': 'Huỷ',
  'action.delete': 'Xoá',
  'action.edit': 'Sửa',
  'action.duplicate': 'Nhân bản',
  'action.publish': 'Xuất bản',
  'action.unpublish': 'Gỡ xuất bản',
  'action.archive': 'Lưu trữ',
  'action.create': 'Tạo mới',
  'action.check': 'Kiểm tra',
  'action.next': 'Tiếp theo',
  'action.previous': 'Quay lại',
  'action.finish': 'Hoàn thành',
  'action.retry': 'Làm lại',
  'action.showAnswer': 'Xem đáp án',
  'action.playAudio': 'Nghe phát âm',
  'action.bookmark': 'Lưu lại',
  'action.bookmarked': 'Đã lưu',
  'action.favourite': 'Yêu thích',
  'action.favourited': 'Đã yêu thích',
  'action.search': 'Tìm kiếm',
  'action.filter': 'Bộ lọc',
  'action.reset': 'Đặt lại',
  'action.back': 'Quay lại',
  'action.submit': 'Gửi',
  'action.import': 'Nhập dữ liệu',
  'action.export': 'Xuất dữ liệu',
  'action.upload': 'Tải lên',

  // ---- generic ------------------------------------------------------------
  'common.loading': 'Đang tải…',
  'common.empty': 'Chưa có nội dung nào ở đây.',
  'common.error': 'Có lỗi xảy ra. Vui lòng thử lại.',
  'common.required': 'Bắt buộc',
  'common.optional': 'Không bắt buộc',
  'common.minutes': 'phút',
  'common.hours': 'giờ',
  'common.words': 'từ',
  'common.lessons': 'bài học',
  'common.exercises': 'bài tập',
  'common.level': 'Trình độ',
  'common.free': 'Miễn phí',
  'common.new': 'Mới',
  'common.popular': 'Phổ biến',
  'common.all': 'Tất cả',
  'common.status': 'Trạng thái',
  'common.actions': 'Thao tác',
  'common.name': 'Họ và tên',
  'common.email': 'Email',
  'common.phone': 'Số điện thoại',
  'common.password': 'Mật khẩu',
  'common.search.placeholder': 'Tìm từ vựng, bài học, chủ đề ngữ pháp…',
  'common.results': 'kết quả',
  'common.of': 'trên',
  'common.correct': 'Chính xác',
  'common.incorrect': 'Chưa đúng',
  'common.yourAnswer': 'Câu trả lời của bạn',
  'common.correctAnswer': 'Đáp án đúng',
  'common.explanation': 'Giải thích',
  'common.source': 'Nguồn',
  'common.licence': 'Giấy phép',

  // ---- home ---------------------------------------------------------------
  'home.hero.eyebrow': 'Tiếng Anh cho người Việt',
  'home.hero.title': 'Học tiếng Anh bằng tài liệu thật, không phải bài tập máy sinh ra',
  'home.hero.lead':
    'Tracy English xây dựng lộ trình từ A1 đến C1 dựa trên học liệu mở có bản quyền rõ ràng: từ điển Anh–Việt, phát âm do người bản xứ thu, bài nghe của VOA Learning English và hàng chục nghìn câu song ngữ từ Tatoeba.',
  'home.hero.primary': 'Bắt đầu học miễn phí',
  'home.hero.secondary': 'Kiểm tra trình độ',
  'home.stats.words': 'từ vựng có phiên âm và nghĩa tiếng Việt',
  'home.stats.audio': 'bản thu phát âm của người thật',
  'home.stats.listening': 'bài nghe kèm lời thoại đầy đủ',
  'home.stats.sentences': 'câu ví dụ song ngữ Anh–Việt',
  'home.skills.title': 'Bốn kỹ năng, cộng ngữ pháp và từ vựng',
  'home.skills.lead': 'Mỗi phần có bài giảng, ví dụ, bài tập và phần chữa bài bằng tiếng Việt.',
  'home.tracks.title': 'Chọn lộ trình phù hợp với bạn',
  'home.tracks.lead': 'Từ học sinh tiểu học đến người đi làm cần tiếng Anh công việc.',
  'home.methods.title': 'Học một mình hay học cùng giáo viên đều được',
  'home.methods.lead':
    'Bạn có thể tự học hoàn toàn miễn phí, hoặc ghép thêm lớp trực tuyến, lớp tại trung tâm, kèm 1–1 và nhóm nhỏ.',
  'home.teachers.title': 'Đội ngũ giáo viên',
  'home.testimonials.title': 'Học viên nói gì',
  'home.faq.title': 'Câu hỏi thường gặp',
  'home.cta.title': 'Chưa biết bắt đầu từ đâu?',
  'home.cta.lead': 'Làm bài kiểm tra 10 phút để biết trình độ CEFR hiện tại và lộ trình phù hợp.',

  // ---- learning modes -----------------------------------------------------
  'mode.SELF_STUDY': 'Tự học',
  'mode.ONLINE_CLASS': 'Lớp trực tuyến',
  'mode.OFFLINE_CLASS': 'Lớp tại trung tâm',
  'mode.ONE_TO_ONE': 'Kèm 1–1',
  'mode.SMALL_GROUP': 'Nhóm nhỏ',
  'mode.HYBRID': 'Kết hợp',
  'mode.ONLINE': 'Trực tuyến',
  'mode.OFFLINE': 'Tại trung tâm',

  // ---- skills -------------------------------------------------------------
  'skill.listening': 'Nghe',
  'skill.reading': 'Đọc',
  'skill.writing': 'Viết',
  'skill.speaking': 'Nói',
  'skill.grammar': 'Ngữ pháp',
  'skill.vocabulary': 'Từ vựng',
  'skill.pronunciation': 'Phát âm',

  // ---- audience -----------------------------------------------------------
  'segment.PRIMARY': 'Tiểu học',
  'segment.SECONDARY': 'THCS',
  'segment.HIGH_SCHOOL': 'THPT',
  'segment.UNIVERSITY': 'Sinh viên',
  'segment.ADULT': 'Người lớn',
  'segment.PROFESSIONAL': 'Người đi làm',

  // ---- vocabulary ---------------------------------------------------------
  'vocab.title': 'Từ vựng',
  'vocab.lead':
    'Mỗi từ có phiên âm Anh–Mỹ, bản thu của người thật, nghĩa tiếng Việt, ví dụ song ngữ và bài tập ôn.',
  'vocab.word': 'Từ',
  'vocab.ipa': 'Phiên âm',
  'vocab.meaning': 'Nghĩa tiếng Việt',
  'vocab.explanation': 'Giải thích',
  'vocab.examples': 'Ví dụ',
  'vocab.englishDefinition': 'Định nghĩa tiếng Anh',
  'vocab.related': 'Từ liên quan',
  'vocab.forms': 'Dạng khác',
  'vocab.pitfall': 'Lỗi thường gặp',
  'vocab.etymology': 'Nguồn gốc',
  'vocab.addToList': 'Thêm vào danh sách ôn',
  'vocab.inList': 'Đang trong danh sách ôn',
  'vocab.review': 'Ôn tập',
  'vocab.dueToday': 'Đến hạn ôn hôm nay',
  'vocab.mastered': 'Đã thuộc',
  'vocab.learning': 'Đang học',
  'vocab.notStarted': 'Chưa học',
  'vocab.noAudio': 'Từ này chưa có bản thu của người bản xứ',
  'vocab.lists': 'Danh sách từ vựng',
  'vocab.searchPlaceholder': 'Nhập từ tiếng Anh hoặc nghĩa tiếng Việt…',

  // ---- grammar ------------------------------------------------------------
  'grammar.title': 'Ngữ pháp',
  'grammar.lead': 'Giải thích bằng tiếng Việt, ví dụ bằng tiếng Anh, bài tập có chữa chi tiết.',
  'grammar.theory': 'Lý thuyết',
  'grammar.patterns': 'Công thức',
  'grammar.examples': 'Ví dụ',
  'grammar.pitfalls': 'Lỗi người Việt hay mắc',
  'grammar.tips': 'Mẹo nhớ',
  'grammar.practice': 'Bài tập',

  // ---- listening & reading ------------------------------------------------
  'listening.title': 'Luyện nghe',
  'listening.lead': 'Bài nghe thật từ VOA Learning English, có lời thoại và từ vựng đi kèm.',
  'listening.transcript': 'Lời thoại',
  'listening.hideTranscript': 'Ẩn lời thoại',
  'listening.showTranscript': 'Hiện lời thoại',
  'listening.keyWords': 'Từ khoá trong bài',
  'listening.questions': 'Câu hỏi',
  'listening.speed': 'Tốc độ',
  'reading.title': 'Luyện đọc',
  'reading.lead': 'Bài đọc phân theo trình độ, kèm từ vựng, câu hỏi và giải thích.',
  'reading.wordCount': 'Số từ',
  'reading.readingTime': 'Thời gian đọc',
  'reading.glossary': 'Từ vựng trong bài',

  // ---- exams --------------------------------------------------------------
  'exam.title': 'Luyện thi',
  'exam.lead': 'IELTS, TOEIC, TOEFL, VSTEP và Cambridge — tách riêng từng kỹ năng.',

  // ---- dashboard ----------------------------------------------------------
  'dash.welcome': 'Chào {name}',
  'dash.today': 'Hôm nay',
  'dash.streak': 'Chuỗi ngày học',
  'dash.streakDays': '{count} ngày liên tiếp',
  'dash.xp': 'Điểm kinh nghiệm',
  'dash.dueWords': 'Từ cần ôn',
  'dash.continueLearning': 'Tiếp tục học',
  'dash.recommended': 'Gợi ý cho bạn',
  'dash.recentActivity': 'Hoạt động gần đây',
  'dash.myCourses': 'Khoá học của tôi',
  'dash.mastery': 'Mức độ thành thạo',
  'dash.certificates': 'Chứng nhận',
  'dash.goal': 'Mục tiêu mỗi ngày',
  'dash.goalMet': 'Đã đạt mục tiêu hôm nay',
  'dash.noCourses': 'Bạn chưa ghi danh khoá nào. Hãy chọn một lộ trình để bắt đầu.',

  // ---- exercises ----------------------------------------------------------
  'ex.chooseOne': 'Chọn một đáp án',
  'ex.chooseMany': 'Chọn tất cả đáp án đúng',
  'ex.fillGap': 'Điền vào chỗ trống',
  'ex.reorder': 'Sắp xếp thành câu đúng',
  'ex.matching': 'Nối cặp phù hợp',
  'ex.trueFalse': 'Đúng hay Sai',
  'ex.shortAnswer': 'Viết câu trả lời',
  'ex.translation': 'Dịch câu sau',
  'ex.dictation': 'Nghe và chép lại',
  'ex.true': 'Đúng',
  'ex.false': 'Sai',
  'ex.score': 'Điểm',
  'ex.result': 'Kết quả',
  'ex.wellDone': 'Làm tốt lắm!',
  'ex.keepGoing': 'Ôn lại phần này rồi thử lại nhé.',
  'ex.summary': 'Bạn trả lời đúng {correct}/{total} câu.',

  // ---- lessons ------------------------------------------------------------
  'lesson.objective': 'Mục tiêu bài học',
  'lesson.explanation': 'Giải thích',
  'lesson.examples': 'Ví dụ',
  'lesson.practice': 'Luyện tập',
  'lesson.feedback': 'Nhận xét',
  'lesson.summary': 'Tóm tắt',
  'lesson.nextStep': 'Bước tiếp theo',
  'lesson.completed': 'Đã hoàn thành',
  'lesson.markComplete': 'Đánh dấu hoàn thành',

  // ---- auth ---------------------------------------------------------------
  'auth.loginTitle': 'Đăng nhập',
  'auth.registerTitle': 'Tạo tài khoản',
  'auth.loginLead': 'Đăng nhập để lưu tiến độ, ôn từ vựng và tiếp tục khoá học.',
  'auth.registerLead': 'Tạo tài khoản miễn phí — không cần thẻ ngân hàng.',
  'auth.noAccount': 'Chưa có tài khoản?',
  'auth.hasAccount': 'Đã có tài khoản?',
  'auth.invalid': 'Email hoặc mật khẩu không đúng.',
  'auth.emailTaken': 'Email này đã được sử dụng.',
  'auth.passwordShort': 'Mật khẩu cần ít nhất 8 ký tự.',
  'auth.segment': 'Bạn đang là',

  // ---- consultation -------------------------------------------------------
  'consult.title': 'Đăng ký tư vấn lộ trình',
  'consult.lead':
    'Để lại thông tin, giáo viên của trung tâm sẽ gọi lại trong vòng 24 giờ để tư vấn lộ trình phù hợp.',
  'consult.goal': 'Mục tiêu học',
  'consult.currentLevel': 'Trình độ hiện tại',
  'consult.preferredMode': 'Hình thức mong muốn',
  'consult.preferredTime': 'Thời gian rảnh',
  'consult.message': 'Bạn muốn hỏi thêm điều gì?',
  'consult.submitted': 'Đã nhận thông tin của bạn. Trung tâm sẽ liên hệ sớm.',
  'consult.submitAnother': 'Gửi yêu cầu khác',

  // ---- footer -------------------------------------------------------------
  'footer.learn': 'Tự học',
  'footer.centre': 'Trung tâm',
  'footer.company': 'Về chúng tôi',
  'footer.tagline':
    'Nền tảng học tiếng Anh dành cho người Việt, xây dựng trên học liệu mở có giấy phép rõ ràng.',
  'footer.rights': 'Bản quyền thuộc Tracy English.',
  'footer.credits': 'Học liệu & giấy phép',

  // ---- admin --------------------------------------------------------------
  'admin.title': 'Quản trị',
  'admin.overview': 'Tổng quan',
  'admin.content': 'Nội dung',
  'admin.people': 'Con người',
  'admin.operations': 'Vận hành',
  'admin.website': 'Website',
  'admin.courses': 'Khoá học',
  'admin.modules': 'Chương',
  'admin.lessons': 'Bài học',
  'admin.exercises': 'Bài tập',
  'admin.vocabulary': 'Từ vựng',
  'admin.grammar': 'Ngữ pháp',
  'admin.listening': 'Bài nghe',
  'admin.reading': 'Bài đọc',
  'admin.media': 'Thư viện media',
  'admin.teachers': 'Giáo viên',
  'admin.students': 'Học viên',
  'admin.enrollments': 'Ghi danh',
  'admin.consultations': 'Yêu cầu tư vấn',
  'admin.classes': 'Lớp học',
  'admin.schedule': 'Lịch học',
  'admin.announcements': 'Thông báo',
  'admin.testimonials': 'Cảm nhận học viên',
  'admin.faq': 'Câu hỏi thường gặp',
  'admin.pages': 'Trang tĩnh',
  'admin.settings': 'Cài đặt',
  'admin.translations': 'Bản dịch giao diện',
  'admin.import': 'Nhập dữ liệu',
  'admin.audit': 'Nhật ký',
  'admin.saved': 'Đã lưu thay đổi.',
  'admin.deleted': 'Đã xoá.',
  'admin.confirmDelete': 'Bạn chắc chắn muốn xoá mục này?',

  // ---- status -------------------------------------------------------------
  'status.DRAFT': 'Bản nháp',
  'status.PUBLISHED': 'Đã xuất bản',
  'status.ARCHIVED': 'Lưu trữ',
  'status.NEW': 'Mới',
  'status.CONTACTED': 'Đã liên hệ',
  'status.SCHEDULED': 'Đã hẹn lịch',
  'status.ENROLLED': 'Đã ghi danh',
  'status.CLOSED': 'Đã đóng',
  'status.ACTIVE': 'Đang học',
  'status.COMPLETED': 'Hoàn thành',
  'status.PAUSED': 'Tạm dừng',
  'status.CANCELLED': 'Đã huỷ',
};

const en: Messages = {
  'brand.name': 'Tracy English',
  'brand.tagline': 'English with a route, and someone walking it with you',
  'nav.home': 'Home',
  'nav.courses': 'Courses',
  'nav.learn': 'Self-study',
  'nav.vocabulary': 'Vocabulary',
  'nav.grammar': 'Grammar',
  'nav.listening': 'Listening',
  'nav.reading': 'Reading',
  'nav.writing': 'Writing',
  'nav.speaking': 'Speaking',
  'nav.exams': 'Exam prep',
  'nav.practice': 'Practice',
  'nav.classes': 'Classes',
  'nav.teachers': 'Teachers',
  'nav.tuition': 'At the centre',
  'nav.pricing': 'Pricing',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.blog': 'Articles',
  'nav.dashboard': 'Dashboard',
  'nav.progress': 'Progress',
  'nav.achievements': 'Achievements',
  'nav.bookmarks': 'Saved',
  'nav.admin': 'Admin',
  'nav.teacherArea': 'Teacher area',
  'nav.credits': 'Content sources',
  'nav.placement': 'Placement test',
  'nav.menu': 'Menu',
  'nav.close': 'Close',

  'action.start': 'Start learning',
  'action.continue': 'Continue',
  'action.startFree': 'Try it free',
  'action.viewAll': 'View all',
  'action.viewCourse': 'View course',
  'action.enroll': 'Enrol',
  'action.enrolled': 'Enrolled',
  'action.consult': 'Request a consultation',
  'action.bookTrial': 'Book a trial lesson',
  'action.login': 'Log in',
  'action.logout': 'Log out',
  'action.register': 'Create account',
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.delete': 'Delete',
  'action.edit': 'Edit',
  'action.duplicate': 'Duplicate',
  'action.publish': 'Publish',
  'action.unpublish': 'Unpublish',
  'action.archive': 'Archive',
  'action.create': 'Create',
  'action.check': 'Check',
  'action.next': 'Next',
  'action.previous': 'Back',
  'action.finish': 'Finish',
  'action.retry': 'Try again',
  'action.showAnswer': 'Show answer',
  'action.playAudio': 'Play pronunciation',
  'action.bookmark': 'Save',
  'action.bookmarked': 'Saved',
  'action.favourite': 'Favourite',
  'action.favourited': 'Favourited',
  'action.search': 'Search',
  'action.filter': 'Filter',
  'action.reset': 'Reset',
  'action.back': 'Back',
  'action.submit': 'Submit',
  'action.import': 'Import',
  'action.export': 'Export',
  'action.upload': 'Upload',

  'common.loading': 'Loading…',
  'common.empty': 'Nothing here yet.',
  'common.error': 'Something went wrong. Please try again.',
  'common.required': 'Required',
  'common.optional': 'Optional',
  'common.minutes': 'min',
  'common.hours': 'hours',
  'common.words': 'words',
  'common.lessons': 'lessons',
  'common.exercises': 'exercises',
  'common.level': 'Level',
  'common.free': 'Free',
  'common.new': 'New',
  'common.popular': 'Popular',
  'common.all': 'All',
  'common.status': 'Status',
  'common.actions': 'Actions',
  'common.name': 'Full name',
  'common.email': 'Email',
  'common.phone': 'Phone',
  'common.password': 'Password',
  'common.search.placeholder': 'Search words, lessons, grammar topics…',
  'common.results': 'results',
  'common.of': 'of',
  'common.correct': 'Correct',
  'common.incorrect': 'Not quite',
  'common.yourAnswer': 'Your answer',
  'common.correctAnswer': 'Correct answer',
  'common.explanation': 'Explanation',
  'common.source': 'Source',
  'common.licence': 'Licence',

  'home.hero.eyebrow': 'English for Vietnamese learners',
  'home.hero.title': 'Learn English from real material, not machine-written exercises',
  'home.hero.lead':
    'Tracy English builds an A1–C1 route from openly licensed material: an English–Vietnamese dictionary, pronunciation recorded by real speakers, listening from VOA Learning English, and tens of thousands of bilingual sentences from Tatoeba.',
  'home.hero.primary': 'Start free',
  'home.hero.secondary': 'Take the placement test',
  'home.stats.words': 'words with phonetics and Vietnamese meanings',
  'home.stats.audio': 'pronunciation clips recorded by people',
  'home.stats.listening': 'listening pieces with full transcripts',
  'home.stats.sentences': 'bilingual English–Vietnamese example sentences',
  'home.skills.title': 'Four skills, plus grammar and vocabulary',
  'home.skills.lead': 'Each section has teaching, examples, practice and feedback in Vietnamese.',
  'home.tracks.title': 'Pick the route that fits you',
  'home.tracks.lead': 'From primary school pupils to professionals who need English at work.',
  'home.methods.title': 'Study alone, or study with a teacher',
  'home.methods.lead':
    'Self-study is free and complete. Add online classes, classes at the centre, one-to-one tuition or small groups whenever you want them.',
  'home.teachers.title': 'Our teachers',
  'home.testimonials.title': 'What learners say',
  'home.faq.title': 'Frequently asked questions',
  'home.cta.title': 'Not sure where to start?',
  'home.cta.lead': 'Take the ten-minute placement test to find your CEFR level and a route that fits.',

  'mode.SELF_STUDY': 'Self-study',
  'mode.ONLINE_CLASS': 'Online class',
  'mode.OFFLINE_CLASS': 'Class at the centre',
  'mode.ONE_TO_ONE': 'One-to-one',
  'mode.SMALL_GROUP': 'Small group',
  'mode.HYBRID': 'Hybrid',
  'mode.ONLINE': 'Online',
  'mode.OFFLINE': 'At the centre',

  'skill.listening': 'Listening',
  'skill.reading': 'Reading',
  'skill.writing': 'Writing',
  'skill.speaking': 'Speaking',
  'skill.grammar': 'Grammar',
  'skill.vocabulary': 'Vocabulary',
  'skill.pronunciation': 'Pronunciation',

  'segment.PRIMARY': 'Primary school',
  'segment.SECONDARY': 'Lower secondary',
  'segment.HIGH_SCHOOL': 'Upper secondary',
  'segment.UNIVERSITY': 'University',
  'segment.ADULT': 'Adults',
  'segment.PROFESSIONAL': 'Professionals',

  'vocab.title': 'Vocabulary',
  'vocab.lead':
    'Every word has British and American phonetics, a human recording, a Vietnamese meaning, bilingual examples and review practice.',
  'vocab.word': 'Word',
  'vocab.ipa': 'Phonetics',
  'vocab.meaning': 'Vietnamese meaning',
  'vocab.explanation': 'Explanation',
  'vocab.examples': 'Examples',
  'vocab.englishDefinition': 'English definition',
  'vocab.related': 'Related words',
  'vocab.forms': 'Other forms',
  'vocab.pitfall': 'Common mistakes',
  'vocab.etymology': 'Etymology',
  'vocab.addToList': 'Add to review list',
  'vocab.inList': 'In your review list',
  'vocab.review': 'Review',
  'vocab.dueToday': 'Due for review today',
  'vocab.mastered': 'Mastered',
  'vocab.learning': 'Learning',
  'vocab.notStarted': 'Not started',
  'vocab.noAudio': 'No native recording available for this word yet',
  'vocab.lists': 'Word lists',
  'vocab.searchPlaceholder': 'Type an English word or a Vietnamese meaning…',

  'grammar.title': 'Grammar',
  'grammar.lead': 'Explained in Vietnamese, exemplified in English, practised with full feedback.',
  'grammar.theory': 'Theory',
  'grammar.patterns': 'Patterns',
  'grammar.examples': 'Examples',
  'grammar.pitfalls': 'Mistakes Vietnamese learners make',
  'grammar.tips': 'Tips',
  'grammar.practice': 'Practice',

  'listening.title': 'Listening',
  'listening.lead': 'Real listening from VOA Learning English, with transcripts and key words.',
  'listening.transcript': 'Transcript',
  'listening.hideTranscript': 'Hide transcript',
  'listening.showTranscript': 'Show transcript',
  'listening.keyWords': 'Words in this story',
  'listening.questions': 'Questions',
  'listening.speed': 'Speed',
  'reading.title': 'Reading',
  'reading.lead': 'Passages graded by level, with vocabulary, questions and explanations.',
  'reading.wordCount': 'Words',
  'reading.readingTime': 'Reading time',
  'reading.glossary': 'Words in this story',

  'exam.title': 'Exam preparation',
  'exam.lead': 'IELTS, TOEIC, TOEFL, VSTEP and Cambridge — each skill on its own terms.',

  'dash.welcome': 'Hello {name}',
  'dash.today': 'Today',
  'dash.streak': 'Study streak',
  'dash.streakDays': '{count} days in a row',
  'dash.xp': 'Experience',
  'dash.dueWords': 'Words to review',
  'dash.continueLearning': 'Continue learning',
  'dash.recommended': 'Recommended for you',
  'dash.recentActivity': 'Recent activity',
  'dash.myCourses': 'My courses',
  'dash.mastery': 'Mastery',
  'dash.certificates': 'Certificates',
  'dash.goal': 'Daily goal',
  'dash.goalMet': "Today's goal met",
  'dash.noCourses': 'You have not enrolled yet. Choose a route to begin.',

  'ex.chooseOne': 'Choose one answer',
  'ex.chooseMany': 'Choose every correct answer',
  'ex.fillGap': 'Fill in the gap',
  'ex.reorder': 'Put the words in order',
  'ex.matching': 'Match the pairs',
  'ex.trueFalse': 'True or false',
  'ex.shortAnswer': 'Write your answer',
  'ex.translation': 'Translate this sentence',
  'ex.dictation': 'Listen and write what you hear',
  'ex.true': 'True',
  'ex.false': 'False',
  'ex.score': 'Score',
  'ex.result': 'Result',
  'ex.wellDone': 'Well done!',
  'ex.keepGoing': 'Review this part and try again.',
  'ex.summary': 'You answered {correct} of {total} correctly.',

  'lesson.objective': 'Learning objective',
  'lesson.explanation': 'Explanation',
  'lesson.examples': 'Examples',
  'lesson.practice': 'Practice',
  'lesson.feedback': 'Feedback',
  'lesson.summary': 'Summary',
  'lesson.nextStep': 'Next step',
  'lesson.completed': 'Completed',
  'lesson.markComplete': 'Mark as complete',

  'auth.loginTitle': 'Log in',
  'auth.registerTitle': 'Create an account',
  'auth.loginLead': 'Log in to keep your progress, review vocabulary and continue your course.',
  'auth.registerLead': 'Free account — no card needed.',
  'auth.noAccount': 'No account yet?',
  'auth.hasAccount': 'Already have an account?',
  'auth.invalid': 'That email and password do not match.',
  'auth.emailTaken': 'That email is already registered.',
  'auth.passwordShort': 'Password must be at least 8 characters.',
  'auth.segment': 'You are a',

  'consult.title': 'Request a consultation',
  'consult.lead':
    'Leave your details and a teacher will call you back within 24 hours to plan a route with you.',
  'consult.goal': 'Learning goal',
  'consult.currentLevel': 'Current level',
  'consult.preferredMode': 'Preferred format',
  'consult.preferredTime': 'When are you free?',
  'consult.message': 'Anything else you would like to ask?',
  'consult.submitted': 'We have your details. The centre will be in touch shortly.',
  'consult.submitAnother': 'Send another request',

  'footer.learn': 'Self-study',
  'footer.centre': 'The centre',
  'footer.company': 'About us',
  'footer.tagline':
    'An English learning platform for Vietnamese learners, built on openly licensed material.',
  'footer.rights': 'Tracy English. All rights reserved.',
  'footer.credits': 'Content & licences',

  'admin.title': 'Administration',
  'admin.overview': 'Overview',
  'admin.content': 'Content',
  'admin.people': 'People',
  'admin.operations': 'Operations',
  'admin.website': 'Website',
  'admin.courses': 'Courses',
  'admin.modules': 'Modules',
  'admin.lessons': 'Lessons',
  'admin.exercises': 'Exercises',
  'admin.vocabulary': 'Vocabulary',
  'admin.grammar': 'Grammar',
  'admin.listening': 'Listening',
  'admin.reading': 'Reading',
  'admin.media': 'Media library',
  'admin.teachers': 'Teachers',
  'admin.students': 'Students',
  'admin.enrollments': 'Enrolments',
  'admin.consultations': 'Consultation requests',
  'admin.classes': 'Classes',
  'admin.schedule': 'Schedule',
  'admin.announcements': 'Announcements',
  'admin.testimonials': 'Testimonials',
  'admin.faq': 'FAQ',
  'admin.pages': 'Pages',
  'admin.settings': 'Settings',
  'admin.translations': 'Interface translations',
  'admin.import': 'Import',
  'admin.audit': 'Audit log',
  'admin.saved': 'Changes saved.',
  'admin.deleted': 'Deleted.',
  'admin.confirmDelete': 'Delete this item?',

  'status.DRAFT': 'Draft',
  'status.PUBLISHED': 'Published',
  'status.ARCHIVED': 'Archived',
  'status.NEW': 'New',
  'status.CONTACTED': 'Contacted',
  'status.SCHEDULED': 'Scheduled',
  'status.ENROLLED': 'Enrolled',
  'status.CLOSED': 'Closed',
  'status.ACTIVE': 'In progress',
  'status.COMPLETED': 'Completed',
  'status.PAUSED': 'Paused',
  'status.CANCELLED': 'Cancelled',
};

export const MESSAGES: Record<Locale, Messages> = { vi, en };

/**
 * Look up an interface string.
 *
 * Falls back to Vietnamese, then to the key itself. Returning the key rather than an empty
 * string is deliberate: a missing translation should be visible during development, not
 * silently blank in production.
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const table = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  let value = table[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (params) {
    for (const [name, replacement] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), String(replacement));
    }
  }
  return value;
}

/** Every key that exists in Vietnamese but is missing an English counterpart. */
export function missingKeys(locale: Locale): string[] {
  const base = Object.keys(MESSAGES[DEFAULT_LOCALE]);
  const table = MESSAGES[locale];
  return base.filter((key) => !(key in table));
}

const CURRENCY = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatPrice(amountVnd: number, locale: Locale = DEFAULT_LOCALE): string {
  if (amountVnd <= 0) return translate(locale, 'common.free');
  return CURRENCY.format(amountVnd);
}

export function formatDate(value: Date | string, locale: Locale = DEFAULT_LOCALE): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-GB').format(value);
}
