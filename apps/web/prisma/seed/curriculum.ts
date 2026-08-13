import type { LessonBlock } from '../../src/lib/lesson-blocks';

/**
 * The course catalogue.
 *
 * Each course here is a *plan*: which modules it has, and which piece of real ingested
 * content each lesson is built around. The seed resolves those references against the
 * database — a `grammar` lesson binds to a grammar topic by slug, a `listening` lesson to a
 * VOA article, a `vocab` lesson to a word list.
 *
 * Lessons whose target content does not exist are skipped rather than created empty, and
 * the seed reports what it skipped. A course with a hole in it is better than a course with
 * a lesson that opens onto nothing.
 */

export type LessonPlan = {
  slug: string;
  kind: 'GRAMMAR' | 'VOCABULARY' | 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'PRONUNCIATION' | 'REVIEW' | 'ASSESSMENT';
  titleVi: string;
  titleEn: string;
  objectiveVi: string;
  objectiveEn: string;
  /** Slug of the grammar topic / vocabulary list, or article selector for VOA content. */
  grammar?: string;
  vocabList?: string;
  /** Pick a VOA article: by series, at an index, so the choice is stable across seeds. */
  listening?: { series: string; index: number };
  reading?: { series: string; index: number };
  extraBlocks?: LessonBlock[];
  summaryVi?: string;
  nextStepVi?: string;
  minutes?: number;
};

export type ModulePlan = {
  slug: string;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  lessons: LessonPlan[];
};

export type CoursePlan = {
  slug: string;
  track: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  descriptionVi: string;
  descriptionEn: string;
  cefrFrom: string;
  cefrTo: string;
  skills: string[];
  outcomesVi: string[];
  requirementsVi: string[];
  audience: string[];
  accent: string;
  estimatedHours: number;
  deliveryModes: string[];
  isFree: boolean;
  priceVnd: number;
  teacherSlug?: string;
  modules: ModulePlan[];
};

const g = (slug: string, titleVi: string, objectiveVi: string, titleEn: string, objectiveEn: string, minutes = 20): LessonPlan => ({
  slug: `grammar-${slug}`,
  kind: 'GRAMMAR',
  titleVi,
  titleEn,
  objectiveVi,
  objectiveEn,
  grammar: slug,
  minutes,
});

const v = (slug: string, titleVi: string, objectiveVi: string, titleEn: string, minutes = 15): LessonPlan => ({
  slug: `vocab-${slug}`,
  kind: 'VOCABULARY',
  titleVi,
  titleEn,
  objectiveVi,
  objectiveEn: `Learn and review the words in the “${titleEn}” list.`,
  vocabList: slug,
  minutes,
});

const listen = (
  key: string,
  series: string,
  index: number,
  titleVi: string,
  objectiveVi: string,
  minutes = 25,
): LessonPlan => ({
  slug: `listening-${key}`,
  kind: 'LISTENING',
  titleVi,
  titleEn: `Listening practice — ${key.replace(/-/g, ' ')}`,
  objectiveVi,
  objectiveEn: 'Follow a real broadcast, check the transcript, and learn the words in the story.',
  listening: { series, index },
  minutes,
});

const read = (
  key: string,
  series: string,
  index: number,
  titleVi: string,
  objectiveVi: string,
  minutes = 25,
): LessonPlan => ({
  slug: `reading-${key}`,
  kind: 'READING',
  titleVi,
  titleEn: `Reading practice — ${key.replace(/-/g, ' ')}`,
  objectiveVi,
  objectiveEn: 'Read a graded article, work out unknown words in context, and answer on what you read.',
  reading: { series, index },
  minutes,
});

export const COURSES: CoursePlan[] = [
  // -------------------------------------------------------------- basics --
  {
    slug: 'basic-english-a1',
    track: 'basic-english',
    titleVi: 'Tiếng Anh cơ bản A1 — bắt đầu lại từ đầu',
    titleEn: 'Basic English A1 — starting again from zero',
    subtitleVi: 'Dành cho người mất gốc hoặc chưa từng học tiếng Anh có hệ thống',
    descriptionVi:
      'Khoá này giả định bạn không nhớ gì. Nó bắt đầu từ động từ to be — thứ mà tiếng Việt không có và vì thế người Việt hay bỏ quên — rồi đi qua thì hiện tại đơn, mạo từ, số nhiều và sở hữu cách. Mỗi bài có phần giải thích bằng tiếng Việt chỉ rõ lỗi do dịch từ tiếng Việt sang, ví dụ lấy từ câu thật, và bài tập chữa từng câu.',
    descriptionEn:
      'This course assumes you remember nothing. It starts from the verb "to be" — which Vietnamese does not have, and which Vietnamese learners therefore leave out — then works through present simple, articles, plurals and possessives.',
    cefrFrom: 'A1',
    cefrTo: 'A1',
    skills: ['grammar', 'vocabulary', 'listening', 'reading'],
    outcomesVi: [
      'Giới thiệu bản thân, gia đình và công việc bằng câu đầy đủ',
      'Dùng đúng am / is / are và không còn bỏ quên động từ',
      'Chia động từ ở hiện tại đơn, kể cả chữ -s hay quên',
      'Dùng a / an / the ở những trường hợp thông dụng nhất',
      'Nắm khoảng 400 từ vựng trình độ A1 có phát âm chuẩn',
    ],
    requirementsVi: ['Biết bảng chữ cái tiếng Anh', 'Không cần kiến thức nền nào khác'],
    audience: ['ADULT', 'UNIVERSITY', 'PROFESSIONAL', 'HIGH_SCHOOL'],
    accent: 'brand',
    estimatedHours: 24,
    deliveryModes: ['SELF_STUDY', 'ONLINE_CLASS', 'OFFLINE_CLASS', 'ONE_TO_ONE'],
    isFree: true,
    priceVnd: 0,
    teacherSlug: 'tracy-nguyen',
    modules: [
      {
        slug: 'first-sentences',
        titleVi: 'Chương 1 · Những câu đầu tiên',
        titleEn: 'Unit 1 · Your first sentences',
        summaryVi: 'Câu tiếng Anh luôn phải có động từ. Chương này xây thói quen đó.',
        lessons: [
          g('verb-to-be-present', 'To be — điều đầu tiên phải nhớ', 'Nói được “Tôi là…”, “Tôi đang ở…”, “Tôi thấy…” bằng câu tiếng Anh đầy đủ, không bỏ động từ.', 'The verb to be', 'Say who you are, where you are and how you feel in complete English sentences.'),
          v('cefr-a1', 'Từ vựng A1 — vốn từ nền', 'Học 400 từ đầu tiên với phát âm của người bản xứ và nghĩa tiếng Việt.', 'A1 core vocabulary'),
          g('there-is-there-are', 'Nói “có …” đúng cách', 'Dùng There is / There are thay vì dịch thẳng chữ “có” thành have.', 'There is / There are', 'Say what exists without translating "có" as "have".'),
        ],
      },
      {
        slug: 'habits-and-facts',
        titleVi: 'Chương 2 · Thói quen và sự thật',
        titleEn: 'Unit 2 · Habits and facts',
        summaryVi: 'Thì hiện tại đơn, và chữ -s mà người Việt hay quên.',
        lessons: [
          g('present-simple', 'Hiện tại đơn', 'Kể được thói quen hằng ngày và không quên -s ở ngôi thứ ba số ít.', 'Present simple', 'Describe your routine, with the third-person -s in place.'),
          g('adverbs-of-frequency', 'Always, usually, never — đặt ở đâu', 'Đặt trạng từ tần suất đúng vị trí trong câu.', 'Adverbs of frequency', 'Place frequency adverbs correctly.'),
          listen('daily-routine', 'as-it-is', 0, 'Nghe hiểu bản tin đọc chậm', 'Nghe một bản tin ngắn của VOA, đọc lời thoại và học từ mới trong bài.'),
        ],
      },
      {
        slug: 'nouns-and-articles',
        titleVi: 'Chương 3 · Danh từ, mạo từ và sở hữu',
        titleEn: 'Unit 3 · Nouns, articles and possession',
        summaryVi: 'Ba thứ tiếng Việt không có: mạo từ, đuôi số nhiều, và trật tự sở hữu ngược.',
        lessons: [
          g('articles-a-an-the', 'a, an, the — vì sao khó đến vậy', 'Chọn đúng mạo từ trong những trường hợp thông dụng nhất.', 'Articles', 'Choose the right article in the commonest cases.'),
          g('plural-nouns', 'Danh từ số nhiều', 'Thêm -s đúng chỗ và nhận ra danh từ không đếm được.', 'Plural nouns', 'Add -s where it belongs and spot uncountable nouns.'),
          g('possessives', 'Sở hữu cách', 'Đảo đúng trật tự “của tôi” thành “my”.', 'Possessives', 'Reverse the Vietnamese word order correctly.'),
          {
            slug: 'review-a1-foundation',
            kind: 'REVIEW',
            titleVi: 'Ôn tập chương 1–3',
            titleEn: 'Review of units 1–3',
            objectiveVi: 'Kiểm tra lại toàn bộ những gì đã học và tìm ra phần còn yếu.',
            objectiveEn: 'Check everything so far and find what still needs work.',
            grammar: 'verb-to-be-present',
            minutes: 20,
            summaryVi:
              'Nếu bạn sai nhiều ở phần mạo từ thì đó là chuyện bình thường — đây là phần người Việt sai lâu nhất. Quay lại bài a/an/the và làm thêm bài tập trước khi sang chương sau.',
          },
        ],
      },
    ],
  },
  {
    slug: 'daily-communication-a2',
    track: 'daily-communication',
    titleVi: 'Giao tiếp hằng ngày A2',
    titleEn: 'Everyday communication A2',
    subtitleVi: 'Tiếng Anh dùng được ngay trong tuần này',
    descriptionVi:
      'Khoá này tập trung vào những gì bạn cần để nói chuyện: kể việc đang xảy ra, kể việc đã xảy ra, nói về dự định, và so sánh. Phần nghe lấy từ các bản tin đời sống của VOA — tốc độ chậm, câu ngắn, nhưng là tiếng Anh thật chứ không phải hội thoại dựng sẵn.',
    descriptionEn:
      'What you need in order to hold a conversation: what is happening, what happened, what you plan to do, and comparisons.',
    cefrFrom: 'A2',
    cefrTo: 'A2',
    skills: ['speaking', 'listening', 'grammar', 'vocabulary'],
    outcomesVi: [
      'Kể lại một ngày của bạn ở cả hiện tại và quá khứ',
      'Nói về kế hoạch bằng will và be going to đúng ngữ cảnh',
      'So sánh hai người, hai vật, hai lựa chọn',
      'Nghe hiểu bản tin đọc chậm mà không cần lời thoại',
    ],
    requirementsVi: ['Đã nắm to be và hiện tại đơn (trình độ A1)'],
    audience: ['ADULT', 'UNIVERSITY', 'PROFESSIONAL'],
    accent: 'coral',
    estimatedHours: 26,
    deliveryModes: ['SELF_STUDY', 'ONLINE_CLASS', 'ONE_TO_ONE', 'SMALL_GROUP'],
    isFree: true,
    priceVnd: 0,
    teacherSlug: 'daniel-okoye',
    modules: [
      {
        slug: 'now-and-then',
        titleVi: 'Chương 1 · Bây giờ và lúc nãy',
        titleEn: 'Unit 1 · Now and then',
        summaryVi: 'Hai thì kể chuyện cơ bản nhất.',
        lessons: [
          g('present-continuous', 'Hiện tại tiếp diễn', 'Mô tả việc đang xảy ra và phân biệt với hiện tại đơn.', 'Present continuous', 'Describe what is happening now.'),
          g('past-simple', 'Quá khứ đơn', 'Kể lại việc đã xảy ra, chia đúng động từ bất quy tắc.', 'Past simple', 'Tell what happened, with irregular verbs.'),
          v('cefr-a2', 'Từ vựng A2', 'Mở rộng vốn từ lên khoảng 1.200 từ.', 'A2 core vocabulary'),
        ],
      },
      {
        slug: 'plans-and-comparisons',
        titleVi: 'Chương 2 · Dự định và so sánh',
        titleEn: 'Unit 2 · Plans and comparisons',
        summaryVi: 'Nói về tương lai, và đặt hai thứ cạnh nhau.',
        lessons: [
          g('future-will-going-to', 'will hay be going to?', 'Chọn đúng cách nói tương lai theo ngữ cảnh.', 'Will or going to?', 'Choose the right future form.'),
          g('comparatives-superlatives', 'So sánh hơn và nhất', 'So sánh chính xác, không dùng thừa more.', 'Comparatives and superlatives', 'Compare precisely.'),
          g('modals-can-must-should', 'can, must, should', 'Nói về khả năng, bắt buộc và lời khuyên.', 'Modal verbs', 'Ability, obligation and advice.'),
        ],
      },
      {
        slug: 'listening-week',
        titleVi: 'Chương 3 · Một tuần luyện nghe',
        titleEn: 'Unit 3 · A week of listening',
        summaryVi: 'Bốn bài nghe thật, tăng dần độ khó.',
        lessons: [
          listen('health-1', 'health-lifestyle', 0, 'Nghe về sức khoẻ', 'Nghe bài về sức khoẻ, ghi lại từ mới và trả lời câu hỏi.'),
          listen('health-2', 'health-lifestyle', 1, 'Nghe về đời sống', 'Luyện nghe không nhìn lời thoại ở lần đầu.'),
          listen('news-1', 'as-it-is', 1, 'Nghe bản tin', 'Nghe bản tin đọc chậm và chép lại một câu.'),
          read('idioms-1', 'words-and-their-stories', 0, 'Đọc về thành ngữ', 'Hiểu nguồn gốc một thành ngữ và cách dùng nó.'),
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- exams --
  {
    slug: 'ielts-foundation',
    track: 'exam-preparation',
    titleVi: 'IELTS Foundation — từ B1 lên 5.5+',
    titleEn: 'IELTS Foundation — B1 to band 5.5+',
    subtitleVi: 'Xây nền ngữ pháp và từ vựng trước khi luyện đề',
    descriptionVi:
      'Rất nhiều người luyện đề IELTS quá sớm và mắc kẹt ở 5.5 vì nền ngữ pháp chưa đủ. Khoá này làm phần nền: hiện tại hoàn thành, bị động, mệnh đề quan hệ, câu điều kiện và từ nối — đúng những cấu trúc giám khảo tìm trong bài Writing. Phần đọc dùng bài khoa học của VOA vì chủ đề sát với IELTS Reading.',
    descriptionEn:
      'Many candidates start past papers too early and stall at 5.5 because the grammar underneath is not there. This course builds that foundation.',
    cefrFrom: 'B1',
    cefrTo: 'B2',
    skills: ['grammar', 'reading', 'writing', 'vocabulary', 'listening'],
    outcomesVi: [
      'Dùng đúng hiện tại hoàn thành, bị động và mệnh đề quan hệ trong bài viết',
      'Viết câu phức có từ nối chính xác thay vì nối bằng and mãi',
      'Đọc hiểu bài học thuật dài 600–900 từ trong thời gian giới hạn',
      'Nắm nhóm từ vựng học thuật xuất hiện thường xuyên trong IELTS Reading',
    ],
    requirementsVi: ['Trình độ khoảng B1', 'Đã nắm các thì cơ bản'],
    audience: ['HIGH_SCHOOL', 'UNIVERSITY', 'ADULT'],
    accent: 'rose',
    estimatedHours: 40,
    deliveryModes: ['SELF_STUDY', 'ONLINE_CLASS', 'OFFLINE_CLASS', 'ONE_TO_ONE', 'SMALL_GROUP'],
    isFree: false,
    priceVnd: 3_600_000,
    teacherSlug: 'tracy-nguyen',
    modules: [
      {
        slug: 'grammar-for-writing',
        titleVi: 'Chương 1 · Ngữ pháp cho bài viết',
        titleEn: 'Unit 1 · Grammar that earns marks',
        summaryVi: 'Bốn cấu trúc giám khảo tìm trong Writing Task 2.',
        lessons: [
          g('present-perfect', 'Hiện tại hoàn thành', 'Phân biệt dứt khoát với quá khứ đơn — lỗi phổ biến nhất ở band 5.5.', 'Present perfect', 'Separate it cleanly from past simple.', 25),
          g('passive-voice', 'Câu bị động', 'Dùng bị động khi cần khách quan, không lạm dụng.', 'Passive voice', 'Use the passive where it belongs.', 25),
          g('relative-clauses', 'Mệnh đề quan hệ', 'Viết câu phức mà không lặp chủ ngữ.', 'Relative clauses', 'Build complex sentences.', 25),
          g('linking-words', 'Từ nối: although, however, despite', 'Dùng đúng loại từ đi sau — chỗ mất điểm mạch lạc nhiều nhất.', 'Linking words', 'Get the grammar after each connector right.', 25),
        ],
      },
      {
        slug: 'academic-reading',
        titleVi: 'Chương 2 · Đọc học thuật',
        titleEn: 'Unit 2 · Academic reading',
        summaryVi: 'Bài đọc khoa học có chủ đề gần với IELTS Reading.',
        lessons: [
          read('science-1', 'science-technology', 0, 'Đọc bài khoa học (1)', 'Đọc và trả lời câu hỏi về một bài khoa học ngắn.'),
          read('science-2', 'science-technology', 1, 'Đọc bài khoa học (2)', 'Luyện đoán nghĩa từ mới qua ngữ cảnh.'),
          read('science-3', 'science-technology', 2, 'Đọc bài khoa học (3)', 'Luyện tốc độ: đọc 600 từ trong 6 phút rồi trả lời.'),
          v('science-and-technology', 'Từ vựng khoa học công nghệ', 'Học nhóm từ do biên tập viên VOA chọn ra từ chính các bài trên.', 'Science and technology vocabulary'),
        ],
      },
      {
        slug: 'conditional-and-hypothesis',
        titleVi: 'Chương 3 · Giả định và lập luận',
        titleEn: 'Unit 3 · Hypothesis and argument',
        summaryVi: 'Cấu trúc để bàn luận, không chỉ để kể.',
        lessons: [
          g('conditionals-0-1-2', 'Câu điều kiện loại 0, 1, 2', 'Viết câu giả định đúng thì ở cả hai vế.', 'Conditionals 0, 1, 2', 'Get both halves right.', 25),
          g('conditionals-3-mixed', 'Điều kiện loại 3 và hỗn hợp', 'Bàn về điều đã không xảy ra — cấu trúc ghi điểm ở band 6.5+.', 'Third and mixed conditionals', 'Talk about what did not happen.', 25),
          g('gerund-infinitive', 'V-ing hay to V', 'Chọn đúng dạng sau từng động từ và sau mọi giới từ.', 'Gerunds and infinitives', 'Choose the right form.', 25),
          {
            slug: 'assessment-ielts-foundation',
            kind: 'ASSESSMENT',
            titleVi: 'Bài kiểm tra cuối khoá',
            titleEn: 'End-of-course assessment',
            objectiveVi: 'Kiểm tra toàn bộ ngữ pháp và từ vựng của khoá trước khi chuyển sang luyện đề.',
            objectiveEn: 'Check the whole course before moving on to past papers.',
            grammar: 'present-perfect',
            minutes: 30,
            summaryVi:
              'Đạt từ 80% trở lên thì bạn đã sẵn sàng luyện đề IELTS thật. Dưới 60% thì nên quay lại chương 1 — luyện đề khi nền chưa chắc chỉ làm bạn quen với việc sai.',
          },
        ],
      },
    ],
  },
  {
    slug: 'toeic-target-700',
    track: 'exam-preparation',
    titleVi: 'TOEIC mục tiêu 700+',
    titleEn: 'TOEIC — target 700+',
    subtitleVi: 'Nghe và đọc theo đúng dạng bài, cộng tiếng Anh dùng được ở công ty',
    descriptionVi:
      'Khoá TOEIC này không dạy mẹo khoanh bừa. Nó dạy đúng những điểm ngữ pháp mà Part 5 kiểm tra, những cụm từ công việc mà Part 3 và Part 4 dùng đi dùng lại, và cách đọc nhanh một đoạn thông báo hay email.',
    descriptionEn:
      'A TOEIC course without exam tricks: the grammar Part 5 actually tests, the workplace phrases Parts 3 and 4 reuse, and how to read a notice or an email quickly.',
    cefrFrom: 'A2',
    cefrTo: 'B2',
    skills: ['listening', 'reading', 'grammar', 'vocabulary'],
    outcomesVi: [
      'Làm Part 5 dựa vào ngữ pháp chứ không dựa vào cảm giác',
      'Nghe hiểu hội thoại công việc ở tốc độ tự nhiên',
      'Đọc nhanh thông báo, email và biểu mẫu',
      'Nắm nhóm từ vựng văn phòng xuất hiện nhiều nhất',
    ],
    requirementsVi: ['Trình độ khoảng A2 trở lên'],
    audience: ['PROFESSIONAL', 'UNIVERSITY', 'ADULT'],
    accent: 'ink',
    estimatedHours: 36,
    deliveryModes: ['SELF_STUDY', 'ONLINE_CLASS', 'OFFLINE_CLASS', 'SMALL_GROUP'],
    isFree: false,
    priceVnd: 3_200_000,
    teacherSlug: 'le-minh-quan',
    modules: [
      {
        slug: 'part5-grammar',
        titleVi: 'Chương 1 · Ngữ pháp Part 5',
        titleEn: 'Unit 1 · Part 5 grammar',
        summaryVi: 'Những điểm ngữ pháp Part 5 hỏi đi hỏi lại.',
        lessons: [
          g('prepositions-time-place', 'Giới từ in / on / at', 'Chọn đúng giới từ theo logic rộng–hẹp.', 'Prepositions', 'Choose by the broad-to-narrow logic.'),
          g('quantifiers', 'Lượng từ', 'Phân biệt đếm được và không đếm được.', 'Quantifiers', 'Countable and uncountable.'),
          g('gerund-infinitive', 'V-ing và to V', 'Nhớ theo nhóm động từ thay vì học lẻ.', 'Gerunds and infinitives', 'Learn by verb group.'),
          g('passive-voice', 'Bị động trong văn bản công việc', 'Đọc hiểu câu bị động trong thông báo và hợp đồng.', 'Passive in business text', 'Read the passive in notices and contracts.'),
        ],
      },
      {
        slug: 'workplace-listening',
        titleVi: 'Chương 2 · Nghe trong môi trường công việc',
        titleEn: 'Unit 2 · Listening at work',
        summaryVi: 'Bản tin và bài nói ở tốc độ tự nhiên hơn.',
        lessons: [
          listen('business-1', 'as-it-is', 2, 'Nghe bản tin kinh tế xã hội', 'Nghe và nắm ý chính khi chưa hiểu hết từng từ.'),
          listen('business-2', 'arts-entertainment', 2, 'Nghe bài về văn hoá công sở', 'Ghi lại các cụm từ dùng được trong công việc.'),
          read('workplace-reading', 'education', 0, 'Đọc bài về giáo dục và việc làm', 'Luyện đọc lấy thông tin nhanh.'),
        ],
      },
    ],
  },
  {
    slug: 'vstep-b2',
    track: 'exam-preparation',
    titleVi: 'VSTEP bậc 4 (B2)',
    titleEn: 'VSTEP level 4 (B2)',
    subtitleVi: 'Cho giáo viên, công chức và học viên cao học',
    descriptionVi:
      'VSTEP bậc 4 tương đương B2. Khoá này đi theo đúng bốn kỹ năng của kỳ thi, với trọng tâm ở phần viết — nơi thí sinh Việt Nam mất điểm nhiều nhất vì viết đúng ngữ pháp nhưng không đúng văn phong trang trọng.',
    descriptionEn:
      'VSTEP level 4 is B2. This course follows the exam\'s four papers, with the weight on writing, where Vietnamese candidates lose most marks.',
    cefrFrom: 'B1',
    cefrTo: 'B2',
    skills: ['listening', 'reading', 'writing', 'speaking', 'grammar'],
    outcomesVi: [
      'Viết thư trang trọng và bài luận theo đúng cấu trúc VSTEP',
      'Nghe hiểu bài nói dài 3–5 phút',
      'Đọc hiểu bài 700–900 từ và trả lời câu hỏi suy luận',
      'Nói liên tục 3 phút về một chủ đề xã hội',
    ],
    requirementsVi: ['Trình độ khoảng B1', 'Có thể dành 30 phút mỗi ngày'],
    audience: ['PROFESSIONAL', 'UNIVERSITY', 'ADULT'],
    accent: 'teal',
    estimatedHours: 44,
    deliveryModes: ['SELF_STUDY', 'ONLINE_CLASS', 'ONE_TO_ONE', 'SMALL_GROUP'],
    isFree: false,
    priceVnd: 3_900_000,
    teacherSlug: 'vo-thanh-son',
    modules: [
      {
        slug: 'vstep-grammar',
        titleVi: 'Chương 1 · Ngữ pháp bậc 4',
        titleEn: 'Unit 1 · Level 4 grammar',
        summaryVi: 'Cấu trúc cần có để viết ở mức B2.',
        lessons: [
          g('past-perfect', 'Quá khứ hoàn thành', 'Kể chuyện có nhiều mốc thời gian mà không rối.', 'Past perfect', 'Narrate across several time points.'),
          g('reported-speech', 'Câu tường thuật', 'Thuật lại lời người khác đúng thì và đúng đại từ.', 'Reported speech', 'Report accurately.'),
          g('present-perfect-continuous', 'Hiện tại hoàn thành tiếp diễn', 'Nhấn vào quá trình thay vì kết quả.', 'Present perfect continuous', 'Emphasise process.'),
          g('used-to-would', 'used to, be used to, would', 'Ba cấu trúc dễ nhầm nhất ở bậc 4.', 'Used to and would', 'Three easily confused structures.'),
        ],
      },
      {
        slug: 'vstep-skills',
        titleVi: 'Chương 2 · Bốn kỹ năng',
        titleEn: 'Unit 2 · The four papers',
        summaryVi: 'Luyện từng kỹ năng theo dạng bài của VSTEP.',
        lessons: [
          read('vstep-reading-1', 'us-history', 0, 'Đọc bài dài văn phong trang trọng', 'Đọc bài lịch sử — văn phong gần với đề VSTEP nhất.'),
          listen('vstep-listening-1', 'science-technology', 3, 'Nghe bài nói dài', 'Nghe một bài dài và ghi ý chính.'),
          v('history-and-society', 'Từ vựng lịch sử và xã hội', 'Nhóm từ hay gặp trong đề đọc VSTEP.', 'History and society vocabulary'),
        ],
      },
    ],
  },
  // ------------------------------------------------------------ age tracks --
  {
    slug: 'english-for-kids-starters',
    track: 'english-for-children',
    titleVi: 'Tiếng Anh thiếu nhi — Starters',
    titleEn: 'English for children — Starters',
    subtitleVi: 'Cho học sinh tiểu học, hướng tới Cambridge Starters',
    descriptionVi:
      'Khoá dành cho học sinh lớp 1–5. Bắt đầu từ âm và từ vựng quen thuộc: gia đình, màu sắc, con vật, đồ ăn, trường lớp. Mỗi từ đều có bản thu của người bản xứ để con nghe đúng ngay từ đầu — đây là giai đoạn tai còn rất nhạy, nghe sai thì sửa rất lâu.',
    descriptionEn:
      'For primary pupils, aiming at Cambridge Starters. Every word has a human recording, because this is the age when the ear is still flexible.',
    cefrFrom: 'A1',
    cefrTo: 'A1',
    skills: ['vocabulary', 'pronunciation', 'listening'],
    outcomesVi: [
      'Nghe và nói được khoảng 300 từ quen thuộc',
      'Phát âm đúng các âm cuối mà tiếng Việt không có',
      'Trả lời được câu hỏi đơn giản về bản thân và gia đình',
    ],
    requirementsVi: ['Đọc được bảng chữ cái', 'Phù hợp với học sinh từ 7 tuổi'],
    audience: ['PRIMARY'],
    accent: 'sun',
    estimatedHours: 20,
    deliveryModes: ['SELF_STUDY', 'OFFLINE_CLASS', 'ONLINE_CLASS', 'ONE_TO_ONE'],
    isFree: true,
    priceVnd: 0,
    teacherSlug: 'pham-thi-ha',
    modules: [
      {
        slug: 'sounds-and-words',
        titleVi: 'Chương 1 · Âm và từ đầu tiên',
        titleEn: 'Unit 1 · First sounds and words',
        summaryVi: 'Nghe trước, nói sau, viết sau cùng.',
        lessons: [
          v('cefr-a1', 'Từ vựng đầu tiên', 'Nghe và nhắc lại 400 từ cơ bản nhất, mỗi từ có bản thu của người bản xứ.', 'First words'),
          g('verb-to-be-present', 'I am … — nói về mình', 'Nói được tên, tuổi và cảm xúc bằng câu đầy đủ.', 'I am …', 'Say your name, age and how you feel.', 15),
          g('plural-nouns', 'Một và nhiều', 'Nhận ra và thêm -s khi có nhiều hơn một.', 'One and many', 'Add -s for more than one.', 15),
        ],
      },
    ],
  },
  {
    slug: 'high-school-grammar-core',
    track: 'english-for-high-school',
    titleVi: 'Ngữ pháp trọng tâm THPT',
    titleEn: 'Core grammar for upper secondary',
    subtitleVi: 'Bám sát chương trình lớp 10–12 và đề thi tốt nghiệp',
    descriptionVi:
      'Tập hợp toàn bộ điểm ngữ pháp xuất hiện trong đề thi tốt nghiệp THPT: các thì, bị động, câu điều kiện, mệnh đề quan hệ, câu tường thuật và từ nối. Mỗi chủ điểm có phần chỉ rõ lỗi hay gặp và bài tập lấy từ câu thật.',
    descriptionEn:
      'Every grammar point that appears in the Vietnamese national school-leaving exam, each with the common errors named and practice built from real sentences.',
    cefrFrom: 'A2',
    cefrTo: 'B2',
    skills: ['grammar', 'reading', 'vocabulary'],
    outcomesVi: [
      'Làm được phần ngữ pháp trong đề thi tốt nghiệp',
      'Phân biệt dứt khoát các thì hay bị nhầm',
      'Viết câu phức có mệnh đề quan hệ và từ nối',
    ],
    requirementsVi: ['Đang học lớp 10 trở lên hoặc trình độ tương đương A2'],
    audience: ['HIGH_SCHOOL', 'SECONDARY'],
    accent: 'sky',
    estimatedHours: 32,
    deliveryModes: ['SELF_STUDY', 'OFFLINE_CLASS', 'ONLINE_CLASS', 'SMALL_GROUP'],
    isFree: true,
    priceVnd: 0,
    teacherSlug: 'vo-thanh-son',
    modules: [
      {
        slug: 'tense-system',
        titleVi: 'Chương 1 · Hệ thống thì',
        titleEn: 'Unit 1 · The tense system',
        summaryVi: 'Sáu thì xuất hiện nhiều nhất trong đề thi.',
        lessons: [
          g('present-simple', 'Hiện tại đơn', 'Ôn lại và không còn quên -s.', 'Present simple', 'Revise and keep the -s.', 15),
          g('present-continuous', 'Hiện tại tiếp diễn', 'Phân biệt với hiện tại đơn.', 'Present continuous', 'Separate from present simple.', 15),
          g('past-simple', 'Quá khứ đơn', 'Chia đúng động từ bất quy tắc.', 'Past simple', 'Irregular verbs.', 20),
          g('past-continuous', 'Quá khứ tiếp diễn', 'Cặp thì kể chuyện: while và when.', 'Past continuous', 'While and when.', 20),
          g('present-perfect', 'Hiện tại hoàn thành', 'Điểm phân biệt quan trọng nhất với quá khứ đơn.', 'Present perfect', 'The key distinction.', 25),
          g('past-perfect', 'Quá khứ hoàn thành', 'Dùng khi thứ tự kể khác thứ tự xảy ra.', 'Past perfect', 'When the telling order differs.', 20),
        ],
      },
      {
        slug: 'sentence-structures',
        titleVi: 'Chương 2 · Cấu trúc câu',
        titleEn: 'Unit 2 · Sentence structures',
        summaryVi: 'Bị động, điều kiện, mệnh đề quan hệ, tường thuật.',
        lessons: [
          g('passive-voice', 'Câu bị động', 'Chuyển câu chủ động sang bị động ở mọi thì.', 'Passive voice', 'Convert across tenses.', 20),
          g('conditionals-0-1-2', 'Câu điều kiện 0, 1, 2', 'Ba loại điều kiện cơ bản.', 'Conditionals', 'The three basic types.', 25),
          g('relative-clauses', 'Mệnh đề quan hệ', 'who, which, that, whose và dấu phẩy.', 'Relative clauses', 'Commas matter.', 25),
          g('reported-speech', 'Câu tường thuật', 'Lùi thì, đổi đại từ, đổi trạng ngữ.', 'Reported speech', 'Three things change.', 25),
        ],
      },
    ],
  },
  // ------------------------------------------------------------ skills ----
  {
    slug: 'listening-lab-b1',
    track: 'skills-workshop',
    titleVi: 'Phòng luyện nghe B1',
    titleEn: 'Listening lab B1',
    subtitleVi: 'Mười bài nghe thật, tăng dần độ khó',
    descriptionVi:
      'Mỗi bài trong khoá này là một bản tin thật do phát thanh viên VOA đọc, kèm lời thoại đầy đủ và danh sách từ do chính ban biên tập VOA chọn. Quy trình mỗi bài: nghe lần một không nhìn chữ, làm câu hỏi, nghe lần hai có lời thoại, rồi chép chính tả một câu.',
    descriptionEn:
      'Ten real broadcasts read by VOA presenters, each with a full transcript and the editors\' own word list.',
    cefrFrom: 'B1',
    cefrTo: 'B1',
    skills: ['listening', 'vocabulary'],
    outcomesVi: [
      'Nghe hiểu ý chính của bản tin đọc chậm không cần lời thoại',
      'Chép lại chính xác một câu nghe được',
      'Đoán nghĩa từ mới qua ngữ cảnh nghe',
    ],
    requirementsVi: ['Trình độ khoảng A2–B1'],
    audience: ['HIGH_SCHOOL', 'UNIVERSITY', 'ADULT', 'PROFESSIONAL'],
    accent: 'sky',
    estimatedHours: 15,
    deliveryModes: ['SELF_STUDY'],
    isFree: true,
    priceVnd: 0,
    modules: [
      {
        slug: 'listening-set-1',
        titleVi: 'Chương 1 · Bản tin đời sống',
        titleEn: 'Unit 1 · Life and health',
        summaryVi: 'Năm bài nghe về sức khoẻ và đời sống.',
        lessons: [
          listen('lab-1', 'health-lifestyle', 2, 'Bài nghe 1', 'Nghe lần một không nhìn lời thoại, rồi kiểm tra lại.'),
          listen('lab-2', 'health-lifestyle', 3, 'Bài nghe 2', 'Tập trung vào các từ trong danh sách của bài.'),
          listen('lab-3', 'health-lifestyle', 4, 'Bài nghe 3', 'Chép chính tả một câu trong bài.'),
          listen('lab-4', 'as-it-is', 3, 'Bài nghe 4', 'Nghe bản tin và nắm ý chính.'),
          listen('lab-5', 'as-it-is', 4, 'Bài nghe 5', 'Nghe ở tốc độ 1,25× sau khi đã hiểu bài.'),
        ],
      },
      {
        slug: 'listening-set-2',
        titleVi: 'Chương 2 · Khoa học và văn hoá',
        titleEn: 'Unit 2 · Science and culture',
        summaryVi: 'Năm bài nghe khó hơn, từ vựng học thuật hơn.',
        lessons: [
          listen('lab-6', 'science-technology', 4, 'Bài nghe 6', 'Bắt đầu có từ vựng học thuật.'),
          listen('lab-7', 'science-technology', 5, 'Bài nghe 7', 'Nghe và tóm tắt lại bằng ba câu.'),
          listen('lab-8', 'arts-entertainment', 0, 'Bài nghe 8', 'Chủ đề văn hoá, từ vựng đời sống.'),
          listen('lab-9', 'american-stories', 0, 'Bài nghe 9', 'Truyện ngắn — luyện nghe mạch kể.'),
          listen('lab-10', 'american-stories', 1, 'Bài nghe 10', 'Truyện ngắn dài hơn, nghe trọn vẹn.'),
        ],
      },
    ],
  },
  {
    slug: 'reading-lab-b2',
    track: 'skills-workshop',
    titleVi: 'Phòng luyện đọc B2',
    titleEn: 'Reading lab B2',
    subtitleVi: 'Bài đọc thật, có từ vựng và câu hỏi',
    descriptionVi:
      'Tám bài đọc lấy từ các chuyên mục khoa học, lịch sử và văn hoá của VOA Learning English. Mỗi bài có phần từ vựng do ban biên tập chọn, câu hỏi kiểm tra hiểu và bài tập điền từ dùng chính câu trong bài.',
    descriptionEn:
      'Eight passages from VOA\'s science, history and culture strands, each with the editors\' glossary and comprehension work.',
    cefrFrom: 'B1',
    cefrTo: 'B2',
    skills: ['reading', 'vocabulary'],
    outcomesVi: [
      'Đọc hiểu bài 600–900 từ trong 8–10 phút',
      'Đoán nghĩa từ mới qua ngữ cảnh thay vì tra ngay',
      'Nắm khoảng 150 từ học thuật thông dụng',
    ],
    requirementsVi: ['Trình độ khoảng B1'],
    audience: ['HIGH_SCHOOL', 'UNIVERSITY', 'ADULT'],
    accent: 'teal',
    estimatedHours: 14,
    deliveryModes: ['SELF_STUDY'],
    isFree: true,
    priceVnd: 0,
    modules: [
      {
        slug: 'reading-set-1',
        titleVi: 'Chương 1 · Khoa học và sức khoẻ',
        titleEn: 'Unit 1 · Science and health',
        summaryVi: 'Bốn bài đọc chủ đề khoa học.',
        lessons: [
          read('lab-r1', 'science-technology', 6, 'Bài đọc 1', 'Đọc và trả lời câu hỏi về ý chính.'),
          read('lab-r2', 'science-technology', 7, 'Bài đọc 2', 'Luyện đoán nghĩa từ qua ngữ cảnh.'),
          read('lab-r3', 'health-lifestyle', 5, 'Bài đọc 3', 'Đọc bài sức khoẻ và ghi lại từ mới.'),
          read('lab-r4', 'health-lifestyle', 6, 'Bài đọc 4', 'Đọc nhanh lấy thông tin cụ thể.'),
        ],
      },
      {
        slug: 'reading-set-2',
        titleVi: 'Chương 2 · Lịch sử và văn hoá',
        titleEn: 'Unit 2 · History and culture',
        summaryVi: 'Bốn bài đọc văn phong trang trọng hơn.',
        lessons: [
          read('lab-r5', 'us-history', 1, 'Bài đọc 5', 'Văn phong lịch sử, câu dài hơn.'),
          read('lab-r6', 'us-history', 2, 'Bài đọc 6', 'Đọc và tóm tắt bằng năm câu.'),
          read('lab-r7', 'arts-entertainment', 1, 'Bài đọc 7', 'Chủ đề nghệ thuật.'),
          read('lab-r8', 'words-and-their-stories', 1, 'Bài đọc 8', 'Thành ngữ và nguồn gốc của chúng.'),
        ],
      },
    ],
  },
  {
    slug: 'business-english-b1',
    track: 'business-english',
    titleVi: 'Tiếng Anh công việc B1',
    titleEn: 'Business English B1',
    subtitleVi: 'Email, họp và thuyết trình',
    descriptionVi:
      'Khoá dành cho người đi làm cần dùng tiếng Anh ngay. Trọng tâm là những cấu trúc làm nên sự khác biệt giữa email đọc được và email khiến người nhận phải hỏi lại: bị động khi cần khách quan, câu điều kiện khi đề xuất, và từ nối khi lập luận.',
    descriptionEn:
      'For working adults who need English now: the structures that separate an email people can act on from one that gets a reply asking what you meant.',
    cefrFrom: 'A2',
    cefrTo: 'B1',
    skills: ['writing', 'speaking', 'grammar', 'vocabulary'],
    outcomesVi: [
      'Viết email công việc ngắn gọn, đúng mức trang trọng',
      'Giữ được lượt nói trong cuộc họp trực tuyến',
      'Trình bày một ý trong 2 phút có mở, thân, kết',
    ],
    requirementsVi: ['Trình độ khoảng A2'],
    audience: ['PROFESSIONAL', 'ADULT'],
    accent: 'ink',
    estimatedHours: 28,
    deliveryModes: ['SELF_STUDY', 'ONLINE_CLASS', 'ONE_TO_ONE', 'SMALL_GROUP'],
    isFree: false,
    priceVnd: 3_400_000,
    teacherSlug: 'le-minh-quan',
    modules: [
      {
        slug: 'writing-clearly',
        titleVi: 'Chương 1 · Viết rõ ràng',
        titleEn: 'Unit 1 · Writing clearly',
        summaryVi: 'Cấu trúc làm câu dễ hiểu hơn.',
        lessons: [
          g('passive-voice', 'Bị động trong email', 'Dùng bị động để khách quan hoá, không để né trách nhiệm.', 'The passive in email', 'Objectivity, not evasion.', 20),
          g('linking-words', 'Từ nối trong lập luận', 'Nối ý bằng đúng loại từ.', 'Connectors', 'Join ideas correctly.', 20),
          g('conditionals-0-1-2', 'Điều kiện khi đề xuất', 'Đưa ra đề xuất và điều kiện lịch sự.', 'Conditionals for proposals', 'Propose politely.', 20),
        ],
      },
      {
        slug: 'meetings',
        titleVi: 'Chương 2 · Họp và trình bày',
        titleEn: 'Unit 2 · Meetings and presenting',
        summaryVi: 'Nghe và nói trong bối cảnh công việc.',
        lessons: [
          g('modals-can-must-should', 'Modal để đề nghị và từ chối', 'Nói “không” mà vẫn giữ quan hệ.', 'Modals for requests', 'Say no without damage.', 20),
          listen('be-listen-1', 'as-it-is', 5, 'Nghe bản tin công việc', 'Ghi lại cụm từ dùng được trong họp.'),
          read('be-read-1', 'education-tips', 2, 'Đọc bài về kỹ năng làm việc', 'Đọc và rút ra ba điều áp dụng được.'),
        ],
      },
    ],
  },
  {
    slug: 'pronunciation-for-vietnamese',
    track: 'pronunciation-lab',
    titleVi: 'Sửa phát âm cho người Việt',
    titleEn: 'Pronunciation for Vietnamese speakers',
    subtitleVi: 'Âm cuối, trọng âm và những âm tiếng Việt không có',
    descriptionVi:
      'Người Việt nói tiếng Anh khó nghe không phải vì thiếu từ, mà vì ba thứ: nuốt âm cuối, đặt sai trọng âm, và thay những âm tiếng Việt không có bằng âm gần giống. Khoá này xử lý đúng ba thứ đó. Mỗi từ luyện tập đều có bản thu của người bản xứ để so sánh.',
    descriptionEn:
      'Vietnamese speakers are hard to follow for three reasons: dropped final consonants, misplaced stress, and substituting the nearest Vietnamese sound. This course addresses exactly those.',
    cefrFrom: 'A1',
    cefrTo: 'B2',
    skills: ['pronunciation', 'speaking', 'listening'],
    outcomesVi: [
      'Phát âm rõ âm cuối — thay đổi lớn nhất với người nghe',
      'Đặt trọng âm đúng ở từ hai và ba âm tiết',
      'Phân biệt các cặp âm tiếng Việt không có',
    ],
    requirementsVi: ['Bất kỳ trình độ nào', 'Cần tai nghe để nghe rõ âm cuối'],
    audience: ['SECONDARY', 'HIGH_SCHOOL', 'UNIVERSITY', 'ADULT', 'PROFESSIONAL'],
    accent: 'coral',
    estimatedHours: 12,
    deliveryModes: ['SELF_STUDY', 'ONE_TO_ONE'],
    isFree: true,
    priceVnd: 0,
    teacherSlug: 'daniel-okoye',
    modules: [
      {
        slug: 'sounds',
        titleVi: 'Chương 1 · Âm và âm cuối',
        titleEn: 'Unit 1 · Sounds and endings',
        summaryVi: 'Nghe kỹ, so sánh với bản thu của người bản xứ.',
        lessons: [
          {
            slug: 'pron-final-consonants',
            kind: 'PRONUNCIATION',
            titleVi: 'Âm cuối — lỗi làm người nghe hiểu sai nhiều nhất',
            titleEn: 'Final consonants',
            objectiveVi:
              'Nhận ra và phát âm rõ các âm cuối /t/, /d/, /k/, /s/, /z/ — những âm mà tiếng Việt không phát ra ở cuối từ.',
            objectiveEn: 'Hear and produce the final consonants Vietnamese does not release.',
            vocabList: 'cefr-a1',
            minutes: 20,
            extraBlocks: [
              {
                type: 'prose',
                vi: 'Tiếng Việt có âm cuối, nhưng không **bật hơi** ra: trong chữ “bát”, lưỡi chạm vào vòm miệng rồi dừng lại. Tiếng Anh thì bật hẳn ra. Vì thế *bat*, *back*, *bad* trong miệng người Việt nghe gần như giống nhau, còn người nghe bản xứ lại phân biệt được rõ ràng ba từ khác nghĩa.',
              },
              {
                type: 'tip',
                tone: 'tip',
                titleVi: 'Cách tự kiểm tra',
                vi: 'Đặt lòng bàn tay trước miệng và nói *cat*. Nếu bạn không thấy một luồng hơi nhẹ ở cuối từ thì âm /t/ chưa được bật ra.',
              },
              {
                type: 'examples',
                titleVi: 'Ba cặp từ chỉ khác nhau ở âm cuối',
                items: [
                  { en: 'bat — back', vi: 'con dơi — phía sau', note: '/t/ và /k/' },
                  { en: 'nice — knives', vi: 'đẹp — những con dao', note: '/s/ và /z/' },
                  { en: 'hard — heart', vi: 'khó — trái tim', note: '/d/ và /t/' },
                ],
              },
            ],
            summaryVi:
              'Âm cuối là thay đổi cho hiệu quả nhanh nhất. Sửa được nó, người nghe hiểu bạn dễ hơn hẳn dù ngữ pháp chưa đổi gì.',
            nextStepVi: 'Sang bài trọng âm để câu nói có nhịp giống tiếng Anh hơn.',
          },
          {
            slug: 'pron-word-stress',
            kind: 'PRONUNCIATION',
            titleVi: 'Trọng âm từ',
            titleEn: 'Word stress',
            objectiveVi:
              'Đặt đúng trọng âm ở từ hai và ba âm tiết, và hiểu vì sao đặt sai trọng âm khiến người nghe không nhận ra từ.',
            objectiveEn: 'Place stress correctly and understand why misplaced stress hides a word.',
            vocabList: 'cefr-a2',
            minutes: 20,
            extraBlocks: [
              {
                type: 'prose',
                vi: 'Tiếng Việt là ngôn ngữ **có thanh điệu**: mỗi âm tiết mang một thanh riêng và các âm tiết đều nhau. Tiếng Anh là ngôn ngữ **có trọng âm**: trong mỗi từ có một âm tiết được đọc to hơn, dài hơn, rõ hơn, còn các âm tiết còn lại bị nuốt bớt.\n\nĐó là lý do người Việt đọc *PHOtograph*, *phoTOgraphy*, *photoGRAPHic* đều đều như nhau, còn người bản xứ nghe thì không nhận ra từ nào.',
              },
              {
                type: 'table',
                titleVi: 'Trọng âm đổi theo dạng từ',
                headers: ['Từ', 'Trọng âm', 'Nghĩa'],
                rows: [
                  ['PHOtograph', 'âm tiết 1', 'bức ảnh'],
                  ['phoTOgrapher', 'âm tiết 2', 'nhiếp ảnh gia'],
                  ['photoGRAPHic', 'âm tiết 3', 'thuộc về nhiếp ảnh'],
                ],
              },
            ],
            summaryVi:
              'Khi học một từ mới, hãy nghe bản thu và đánh dấu âm tiết được nhấn ngay từ đầu. Sửa trọng âm sau khi đã quen đọc sai mất rất nhiều thời gian.',
            nextStepVi: 'Nghe lại các từ trong danh sách A2 và đánh dấu trọng âm của từng từ.',
          },
        ],
      },
    ],
  },
  {
    slug: 'travel-english-a2',
    track: 'travel-english',
    titleVi: 'Tiếng Anh du lịch',
    titleEn: 'Travel English',
    subtitleVi: 'Sân bay, khách sạn, nhà hàng và khi có sự cố',
    descriptionVi:
      'Khoá ngắn cho người sắp đi nước ngoài. Tập trung vào những câu bạn thực sự cần nói ở sân bay, quầy lễ tân, nhà hàng và khi cần giúp đỡ — cộng với phần ngữ pháp tối thiểu để ghép câu đúng.',
    descriptionEn:
      'A short course for anyone about to travel: what you actually need to say at the airport, the front desk, a restaurant, and when something goes wrong.',
    cefrFrom: 'A1',
    cefrTo: 'A2',
    skills: ['speaking', 'listening', 'vocabulary'],
    outcomesVi: [
      'Làm thủ tục sân bay và trả lời câu hỏi hải quan',
      'Đặt phòng, đổi phòng và xử lý sự cố ở khách sạn',
      'Gọi món và hỏi thành phần món ăn',
      'Hỏi đường và nhờ giúp đỡ',
    ],
    requirementsVi: ['Trình độ A1 trở lên'],
    audience: ['ADULT', 'PROFESSIONAL', 'UNIVERSITY'],
    accent: 'teal',
    estimatedHours: 10,
    deliveryModes: ['SELF_STUDY', 'ONE_TO_ONE', 'SMALL_GROUP'],
    isFree: true,
    priceVnd: 0,
    modules: [
      {
        slug: 'on-the-way',
        titleVi: 'Chương 1 · Trên đường đi',
        titleEn: 'Unit 1 · Getting there',
        summaryVi: 'Sân bay, phương tiện và hỏi đường.',
        lessons: [
          g('prepositions-time-place', 'Giới từ chỉ nơi chốn và thời gian', 'Hỏi và trả lời về giờ giấc, địa điểm.', 'Prepositions', 'Times and places.', 15),
          g('modals-can-must-should', 'Câu đề nghị lịch sự', 'Nhờ giúp đỡ mà không cộc lốc.', 'Polite requests', 'Ask for help politely.', 15),
          v('cefr-a2', 'Từ vựng A2 cho chuyến đi', 'Ôn nhóm từ thông dụng trước khi đi.', 'A2 vocabulary'),
        ],
      },
    ],
  },
  {
    slug: 'academic-english-b2',
    track: 'academic-english',
    titleVi: 'Tiếng Anh học thuật B2–C1',
    titleEn: 'Academic English B2–C1',
    subtitleVi: 'Cho sinh viên và người chuẩn bị du học',
    descriptionVi:
      'Tiếng Anh học thuật khác tiếng Anh giao tiếp không chỉ ở từ vựng mà ở cách khẳng định: văn học thuật tránh nói tuyệt đối. Khoá này dạy cách viết thận trọng, cách nhấn mạnh bằng cấu trúc thay vì bằng ngữ điệu, và cách đọc bài dài mà không mất mạch.',
    descriptionEn:
      'Academic English differs from conversational English less in vocabulary than in how firmly it asserts. This course teaches hedging, emphasis by structure, and reading long arguments.',
    cefrFrom: 'B2',
    cefrTo: 'C1',
    skills: ['writing', 'reading', 'grammar', 'vocabulary'],
    outcomesVi: [
      'Viết câu thận trọng đúng chuẩn học thuật',
      'Dùng đảo ngữ và câu chẻ để nhấn mạnh',
      'Đọc bài dài 1.000 từ và tóm tắt lập luận',
    ],
    requirementsVi: ['Trình độ B1–B2', 'Đã nắm các thì và mệnh đề quan hệ'],
    audience: ['UNIVERSITY', 'ADULT', 'HIGH_SCHOOL'],
    accent: 'brand',
    estimatedHours: 30,
    deliveryModes: ['SELF_STUDY', 'ONLINE_CLASS', 'ONE_TO_ONE'],
    isFree: false,
    priceVnd: 4_200_000,
    teacherSlug: 'tracy-nguyen',
    modules: [
      {
        slug: 'academic-voice',
        titleVi: 'Chương 1 · Giọng văn học thuật',
        titleEn: 'Unit 1 · The academic voice',
        summaryVi: 'Thận trọng, chính xác, có cấu trúc.',
        lessons: [
          g('hedging-academic', 'Nói thận trọng', 'Tránh khẳng định tuyệt đối mà vẫn rõ quan điểm.', 'Hedging', 'Avoid absolutes without going vague.', 25),
          g('inversion', 'Đảo ngữ', 'Nhấn mạnh bằng cấu trúc, dùng đúng liều lượng.', 'Inversion', 'Emphasis by structure.', 25),
          g('cleft-sentences', 'Câu chẻ', 'Điều khiển trọng tâm thông tin của câu.', 'Cleft sentences', 'Control the focus.', 25),
          g('subjunctive-hypothetical', 'Thức giả định', 'wish, if only, would rather, it\'s time.', 'Subjunctive', 'Hypothetical structures.', 25),
        ],
      },
      {
        slug: 'academic-reading',
        titleVi: 'Chương 2 · Đọc bài dài',
        titleEn: 'Unit 2 · Reading long arguments',
        summaryVi: 'Bài đọc dài, văn phong trang trọng.',
        lessons: [
          read('acad-1', 'science-technology', 8, 'Đọc bài khoa học dài', 'Đọc 900 từ và tóm tắt lập luận.'),
          read('acad-2', 'us-history', 3, 'Đọc bài lịch sử', 'Theo dõi mạch lập luận qua nhiều đoạn.'),
          v('study-and-education', 'Từ vựng học thuật', 'Nhóm từ về học tập và giáo dục.', 'Study vocabulary'),
        ],
      },
    ],
  },
  {
    slug: 'secondary-english-core',
    track: 'english-for-secondary',
    titleVi: 'Tiếng Anh THCS — nền tảng lớp 6–9',
    titleEn: 'Lower secondary English — grades 6–9',
    subtitleVi: 'Bám sát chương trình và bài kiểm tra trên lớp',
    descriptionVi:
      'Khoá này đi qua toàn bộ ngữ pháp mà học sinh lớp 6–9 gặp trên lớp, theo đúng thứ tự sách giáo khoa thường dạy, kèm từ vựng theo chủ đề và bài đọc ngắn phù hợp lứa tuổi.',
    descriptionEn:
      'Every grammar point pupils in grades 6–9 meet at school, in the order textbooks usually teach them.',
    cefrFrom: 'A1',
    cefrTo: 'B1',
    skills: ['grammar', 'vocabulary', 'reading'],
    outcomesVi: [
      'Làm được bài kiểm tra ngữ pháp trên lớp',
      'Viết đoạn văn ngắn 80–120 từ',
      'Nắm từ vựng theo chủ đề sách giáo khoa',
    ],
    requirementsVi: ['Đang học lớp 6 trở lên'],
    audience: ['SECONDARY'],
    accent: 'teal',
    estimatedHours: 28,
    deliveryModes: ['SELF_STUDY', 'OFFLINE_CLASS', 'ONLINE_CLASS', 'SMALL_GROUP'],
    isFree: true,
    priceVnd: 0,
    teacherSlug: 'pham-thi-ha',
    modules: [
      {
        slug: 'grade-6-7',
        titleVi: 'Chương 1 · Lớp 6–7',
        titleEn: 'Unit 1 · Grades 6–7',
        summaryVi: 'Nền tảng: to be, hiện tại đơn, mạo từ, số nhiều.',
        lessons: [
          g('verb-to-be-present', 'To be', 'Câu tiếng Anh phải có động từ.', 'To be', 'Every sentence needs a verb.', 15),
          g('present-simple', 'Hiện tại đơn', 'Thói quen và sự thật.', 'Present simple', 'Habits and facts.', 15),
          g('articles-a-an-the', 'Mạo từ', 'a, an, the.', 'Articles', 'a, an, the.', 20),
          g('plural-nouns', 'Số nhiều', 'Thêm -s và các dạng bất quy tắc.', 'Plurals', 'Regular and irregular.', 15),
        ],
      },
      {
        slug: 'grade-8-9',
        titleVi: 'Chương 2 · Lớp 8–9',
        titleEn: 'Unit 2 · Grades 8–9',
        summaryVi: 'Quá khứ, tương lai, so sánh và bị động.',
        lessons: [
          g('past-simple', 'Quá khứ đơn', 'Động từ bất quy tắc.', 'Past simple', 'Irregular verbs.', 20),
          g('future-will-going-to', 'Tương lai', 'will và be going to.', 'Future', 'will and going to.', 20),
          g('comparatives-superlatives', 'So sánh', 'Hơn và nhất.', 'Comparison', 'Comparative and superlative.', 20),
          g('passive-voice', 'Bị động', 'be + V3.', 'Passive', 'be + past participle.', 20),
          g('relative-clauses', 'Mệnh đề quan hệ', 'who, which, that.', 'Relative clauses', 'who, which, that.', 20),
        ],
      },
    ],
  },
];
