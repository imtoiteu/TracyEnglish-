import { CEFR_LEVELS, SEGMENTS, SKILLS } from '@tracy/curriculum';

import { EXERCISE_TYPES } from '@tracy/exercise-engine';

/**
 * The admin resource registry.
 *
 * Twenty content types would otherwise mean twenty near-identical list-and-form pages. They
 * differ only in which columns to show and which fields to edit, so those differences are
 * declared here as data and rendered by two generic pages.
 *
 * That has a second benefit worth more than the saved code: an administrator sees the same
 * interface everywhere. Learning to edit a grammar topic teaches you how to edit a lesson.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'json'
  | 'jsonList'
  | 'blocks'
  | 'date'
  | 'relation';

export type AdminField = {
  name: string;
  label: string;
  type: FieldType;
  /** Options for select/multiselect. */
  options?: { value: string; label: string }[];
  /** Model to look up for `relation` fields. */
  relation?: { model: string; labelField: string };
  hint?: string;
  required?: boolean;
  /** Group fields into sections in the form. */
  group?: string;
  rows?: number;
  /** Hide from the create form (e.g. computed columns). */
  readOnly?: boolean;
};

export type AdminColumn = {
  name: string;
  label: string;
  /** Render hint for the list table. */
  kind?: 'text' | 'badge' | 'level' | 'boolean' | 'number' | 'date' | 'status';
  width?: string;
};

export type AdminResource = {
  key: string;
  model: string;
  labelVi: string;
  labelPluralVi: string;
  group: 'content' | 'people' | 'operations' | 'website';
  icon: string;
  /** Columns shown in the list. */
  columns: AdminColumn[];
  /** Fields shown in the form. */
  fields: AdminField[];
  /** Columns matched by the search box. */
  searchFields: string[];
  defaultOrder?: { field: string; direction: 'asc' | 'desc' };
  /** Whether a row can be created from the admin (some are ingested only). */
  creatable?: boolean;
  deletable?: boolean;
  duplicable?: boolean;
  /** Extra note shown at the top of the list. */
  noteVi?: string;
};

const STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

const LEVEL_OPTIONS = CEFR_LEVELS.map((level) => ({ value: level, label: level }));
const SKILL_OPTIONS = SKILLS.map((skill) => ({ value: skill, label: skill }));
const SEGMENT_OPTIONS = SEGMENTS.map((segment) => ({ value: segment, label: segment }));
const ACCENT_OPTIONS = ['brand', 'coral', 'teal', 'sky', 'sun', 'rose', 'ink'].map((accent) => ({
  value: accent,
  label: accent,
}));

const statusField: AdminField = {
  name: 'status',
  label: 'Trạng thái',
  type: 'select',
  options: STATUS_OPTIONS,
  group: 'Xuất bản',
};

const orderField: AdminField = {
  name: 'displayOrder',
  label: 'Thứ tự hiển thị',
  type: 'number',
  group: 'Xuất bản',
};

export const RESOURCES: AdminResource[] = [
  // ---------------------------------------------------------------- content --
  {
    key: 'courses',
    model: 'course',
    labelVi: 'Khoá học',
    labelPluralVi: 'Khoá học',
    group: 'content',
    icon: 'graduation-cap',
    creatable: true,
    deletable: true,
    duplicable: true,
    searchFields: ['titleVi', 'titleEn', 'slug'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'titleVi', label: 'Tên khoá' },
      { name: 'cefrFrom', label: 'Từ', kind: 'level', width: '5rem' },
      { name: 'cefrTo', label: 'Đến', kind: 'level', width: '5rem' },
      { name: 'priceVnd', label: 'Học phí', kind: 'number' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tên (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tên (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'subtitleVi', label: 'Phụ đề (VI)', type: 'text', group: 'Cơ bản' },
      { name: 'trackId', label: 'Lộ trình', type: 'relation', relation: { model: 'track', labelField: 'titleVi' }, required: true, group: 'Cơ bản' },
      { name: 'teacherId', label: 'Giáo viên phụ trách', type: 'relation', relation: { model: 'teacherProfile', labelField: 'slug' }, group: 'Cơ bản' },
      { name: 'descriptionVi', label: 'Mô tả (VI)', type: 'textarea', rows: 6, group: 'Nội dung' },
      { name: 'descriptionEn', label: 'Mô tả (EN)', type: 'textarea', rows: 4, group: 'Nội dung' },
      { name: 'outcomesVi', label: 'Đầu ra (mỗi dòng một mục)', type: 'jsonList', group: 'Nội dung' },
      { name: 'requirementsVi', label: 'Yêu cầu đầu vào', type: 'jsonList', group: 'Nội dung' },
      { name: 'cefrFrom', label: 'CEFR từ', type: 'select', options: LEVEL_OPTIONS, group: 'Phân loại' },
      { name: 'cefrTo', label: 'CEFR đến', type: 'select', options: LEVEL_OPTIONS, group: 'Phân loại' },
      { name: 'skills', label: 'Kỹ năng', type: 'multiselect', options: SKILL_OPTIONS, group: 'Phân loại' },
      { name: 'audience', label: 'Đối tượng', type: 'multiselect', options: SEGMENT_OPTIONS, group: 'Phân loại' },
      {
        name: 'deliveryModes',
        label: 'Hình thức học',
        type: 'multiselect',
        options: [
          { value: 'SELF_STUDY', label: 'Tự học' },
          { value: 'ONLINE_CLASS', label: 'Lớp trực tuyến' },
          { value: 'OFFLINE_CLASS', label: 'Lớp tại trung tâm' },
          { value: 'ONE_TO_ONE', label: 'Kèm 1–1' },
          { value: 'SMALL_GROUP', label: 'Nhóm nhỏ' },
        ],
        group: 'Phân loại',
      },
      { name: 'accent', label: 'Màu chủ đạo', type: 'select', options: ACCENT_OPTIONS, group: 'Phân loại' },
      { name: 'estimatedHours', label: 'Số giờ ước tính', type: 'number', group: 'Thương mại' },
      { name: 'isFree', label: 'Miễn phí', type: 'boolean', group: 'Thương mại' },
      { name: 'priceVnd', label: 'Học phí (VND)', type: 'number', group: 'Thương mại' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'modules',
    model: 'module',
    labelVi: 'Chương',
    labelPluralVi: 'Chương',
    group: 'content',
    icon: 'layers',
    creatable: true,
    deletable: true,
    searchFields: ['titleVi', 'slug'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'titleVi', label: 'Tên chương' },
      { name: 'slug', label: 'Slug' },
      { name: 'displayOrder', label: 'Thứ tự', kind: 'number', width: '6rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'courseId', label: 'Khoá học', type: 'relation', relation: { model: 'course', labelField: 'titleVi' }, required: true, group: 'Cơ bản' },
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tên (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tên (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'summaryVi', label: 'Tóm tắt (VI)', type: 'textarea', rows: 3, group: 'Cơ bản' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'lessons',
    model: 'lesson',
    labelVi: 'Bài học',
    labelPluralVi: 'Bài học',
    group: 'content',
    icon: 'book-open',
    creatable: true,
    deletable: true,
    duplicable: true,
    searchFields: ['titleVi', 'titleEn', 'slug'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'titleVi', label: 'Tên bài' },
      { name: 'kind', label: 'Loại', kind: 'badge', width: '8rem' },
      { name: 'cefr', label: 'CEFR', kind: 'level', width: '5rem' },
      { name: 'estimatedMinutes', label: 'Phút', kind: 'number', width: '5rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'moduleId', label: 'Chương', type: 'relation', relation: { model: 'module', labelField: 'titleVi' }, required: true, group: 'Cơ bản' },
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      {
        name: 'kind',
        label: 'Loại bài',
        type: 'select',
        options: [
          'GRAMMAR', 'VOCABULARY', 'LISTENING', 'READING', 'WRITING',
          'SPEAKING', 'PRONUNCIATION', 'REVIEW', 'ASSESSMENT',
        ].map((value) => ({ value, label: value })),
        group: 'Cơ bản',
      },
      { name: 'titleVi', label: 'Tên (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tên (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'objectiveVi', label: 'Mục tiêu (VI)', type: 'textarea', rows: 3, required: true, group: 'Nội dung' },
      { name: 'objectiveEn', label: 'Mục tiêu (EN)', type: 'textarea', rows: 2, group: 'Nội dung' },
      {
        name: 'blocks',
        label: 'Khối nội dung',
        type: 'blocks',
        hint: 'Mỗi khối là một phần của bài học. Xem tài liệu khối ở docs/authoring.md.',
        group: 'Nội dung',
      },
      { name: 'summaryVi', label: 'Tóm tắt (VI)', type: 'textarea', rows: 3, group: 'Nội dung' },
      { name: 'nextStepVi', label: 'Bước tiếp theo (VI)', type: 'textarea', rows: 2, group: 'Nội dung' },
      { name: 'grammarTopicId', label: 'Gắn với chủ điểm ngữ pháp', type: 'relation', relation: { model: 'grammarTopic', labelField: 'titleVi' }, group: 'Liên kết' },
      { name: 'vocabularyListId', label: 'Gắn với danh sách từ', type: 'relation', relation: { model: 'vocabularyList', labelField: 'titleVi' }, group: 'Liên kết' },
      { name: 'listeningId', label: 'Gắn với bài nghe', type: 'relation', relation: { model: 'listeningItem', labelField: 'titleVi' }, group: 'Liên kết' },
      { name: 'readingId', label: 'Gắn với bài đọc', type: 'relation', relation: { model: 'readingItem', labelField: 'titleVi' }, group: 'Liên kết' },
      { name: 'cefr', label: 'CEFR', type: 'select', options: LEVEL_OPTIONS, group: 'Phân loại' },
      { name: 'estimatedMinutes', label: 'Thời lượng (phút)', type: 'number', group: 'Phân loại' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'exercises',
    model: 'exercise',
    labelVi: 'Bài tập',
    labelPluralVi: 'Bài tập',
    group: 'content',
    icon: 'list-checks',
    creatable: true,
    deletable: true,
    duplicable: true,
    searchFields: ['promptEn', 'promptVi', 'answer'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    noteVi:
      'Bài tập được sinh từ học liệu đã nhập. Sửa tay thì phần ghi công nguồn vẫn giữ nguyên — hãy cập nhật ô “Ghi công” nếu bạn thay đổi nội dung câu hỏi.',
    columns: [
      { name: 'promptEn', label: 'Câu hỏi' },
      { name: 'type', label: 'Dạng', kind: 'badge', width: '9rem' },
      { name: 'skill', label: 'Kỹ năng', kind: 'badge', width: '7rem' },
      { name: 'cefr', label: 'CEFR', kind: 'level', width: '5rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'type', label: 'Dạng bài', type: 'select', options: EXERCISE_TYPES.map((value) => ({ value, label: value })), required: true, group: 'Cơ bản' },
      { name: 'skill', label: 'Kỹ năng', type: 'select', options: SKILL_OPTIONS, group: 'Cơ bản' },
      { name: 'cefr', label: 'CEFR', type: 'select', options: LEVEL_OPTIONS, group: 'Cơ bản' },
      { name: 'difficulty', label: 'Độ khó (1–5)', type: 'number', group: 'Cơ bản' },
      { name: 'promptVi', label: 'Yêu cầu (VI)', type: 'text', group: 'Nội dung' },
      { name: 'promptEn', label: 'Câu hỏi', type: 'textarea', rows: 3, required: true, group: 'Nội dung' },
      { name: 'context', label: 'Ngữ cảnh phụ', type: 'textarea', rows: 2, group: 'Nội dung' },
      { name: 'payload', label: 'Dữ liệu (JSON)', type: 'json', hint: 'Ví dụ: {"options":["a","b"]}', group: 'Nội dung' },
      { name: 'answer', label: 'Đáp án', type: 'text', required: true, hint: 'Nhiều đáp án chấp nhận được: ngăn bằng dấu |', group: 'Nội dung' },
      { name: 'explanationVi', label: 'Giải thích (VI)', type: 'textarea', rows: 3, group: 'Nội dung' },
      { name: 'hintVi', label: 'Gợi ý (VI)', type: 'text', group: 'Nội dung' },
      { name: 'points', label: 'Điểm', type: 'number', group: 'Phân loại' },
      { name: 'attribution', label: 'Ghi công nguồn', type: 'text', group: 'Nguồn' },
      { name: 'lessonId', label: 'Thuộc bài học', type: 'relation', relation: { model: 'lesson', labelField: 'titleVi' }, group: 'Liên kết' },
      { name: 'grammarTopicId', label: 'Thuộc chủ điểm ngữ pháp', type: 'relation', relation: { model: 'grammarTopic', labelField: 'titleVi' }, group: 'Liên kết' },
      { name: 'vocabularyListId', label: 'Thuộc danh sách từ', type: 'relation', relation: { model: 'vocabularyList', labelField: 'titleVi' }, group: 'Liên kết' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'vocabulary',
    model: 'vocabularyItem',
    labelVi: 'Từ vựng',
    labelPluralVi: 'Từ vựng',
    group: 'content',
    icon: 'sparkles',
    creatable: true,
    deletable: true,
    searchFields: ['word', 'meaningVi'],
    defaultOrder: { field: 'word', direction: 'asc' },
    noteVi:
      'Nghĩa tiếng Việt lấy từ Wiktionary tiếng Việt (CC BY-SA 4.0); phiên âm từ Wiktionary tiếng Anh. Sửa tay được, nhưng lần chạy lại quy trình nhập liệu sẽ không ghi đè — dữ liệu ở đây là bản đã lưu.',
    columns: [
      { name: 'word', label: 'Từ', width: '10rem' },
      { name: 'ipaUk', label: 'IPA (UK)', width: '10rem' },
      { name: 'meaningVi', label: 'Nghĩa tiếng Việt' },
      { name: 'cefr', label: 'CEFR', kind: 'level', width: '5rem' },
      { name: 'audioPath', label: 'Audio', kind: 'boolean', width: '5rem' },
    ],
    fields: [
      { name: 'word', label: 'Từ', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'cefr', label: 'CEFR', type: 'select', options: LEVEL_OPTIONS, group: 'Cơ bản' },
      { name: 'partsOfSpeech', label: 'Từ loại', type: 'jsonList', group: 'Cơ bản' },
      { name: 'ipaUk', label: 'IPA (UK)', type: 'text', group: 'Phát âm' },
      { name: 'ipaUs', label: 'IPA (US)', type: 'text', group: 'Phát âm' },
      { name: 'audioPath', label: 'Đường dẫn audio', type: 'text', hint: '/media/pronunciation/word.mp3', group: 'Phát âm' },
      { name: 'audioCredit', label: 'Ghi công bản thu', type: 'text', group: 'Phát âm' },
      { name: 'meaningVi', label: 'Nghĩa tiếng Việt (ngắn)', type: 'text', group: 'Nghĩa' },
      { name: 'explanationVi', label: 'Giải thích tiếng Việt', type: 'textarea', rows: 4, group: 'Nghĩa' },
      { name: 'pitfallVi', label: 'Lỗi thường gặp', type: 'textarea', rows: 3, group: 'Nghĩa' },
      { name: 'sensesEn', label: 'Định nghĩa tiếng Anh (JSON)', type: 'json', group: 'Nghĩa' },
      { name: 'sensesVi', label: 'Nghĩa chi tiết (JSON)', type: 'json', group: 'Nghĩa' },
      { name: 'forms', label: 'Dạng khác', type: 'jsonList', group: 'Nghĩa' },
      { name: 'etymology', label: 'Nguồn gốc', type: 'textarea', rows: 3, group: 'Nghĩa' },
      statusField,
    ],
  },
  {
    key: 'vocabulary-lists',
    model: 'vocabularyList',
    labelVi: 'Danh sách từ vựng',
    labelPluralVi: 'Danh sách từ vựng',
    group: 'content',
    icon: 'layers',
    creatable: true,
    deletable: true,
    searchFields: ['titleVi', 'slug'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'titleVi', label: 'Tên danh sách' },
      { name: 'topic', label: 'Chủ đề', kind: 'badge' },
      { name: 'cefr', label: 'CEFR', kind: 'level', width: '5rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tên (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tên (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'summaryVi', label: 'Mô tả (VI)', type: 'textarea', rows: 3, group: 'Cơ bản' },
      { name: 'cefr', label: 'CEFR', type: 'select', options: LEVEL_OPTIONS, group: 'Phân loại' },
      { name: 'topic', label: 'Chủ đề', type: 'text', group: 'Phân loại' },
      { name: 'accent', label: 'Màu', type: 'select', options: ACCENT_OPTIONS, group: 'Phân loại' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'grammar',
    model: 'grammarTopic',
    labelVi: 'Chủ điểm ngữ pháp',
    labelPluralVi: 'Ngữ pháp',
    group: 'content',
    icon: 'scroll-text',
    creatable: true,
    deletable: true,
    duplicable: true,
    searchFields: ['titleVi', 'titleEn', 'slug'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'titleVi', label: 'Chủ điểm' },
      { name: 'category', label: 'Nhóm', kind: 'badge', width: '9rem' },
      { name: 'cefr', label: 'CEFR', kind: 'level', width: '5rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tên (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tên (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'cefr', label: 'CEFR', type: 'select', options: LEVEL_OPTIONS, group: 'Cơ bản' },
      { name: 'category', label: 'Nhóm', type: 'text', group: 'Cơ bản' },
      { name: 'summaryVi', label: 'Tóm tắt (VI)', type: 'textarea', rows: 2, group: 'Nội dung' },
      { name: 'theoryVi', label: 'Lý thuyết (VI)', type: 'richtext', rows: 14, required: true, hint: 'Hỗ trợ **in đậm**, *nghiêng*, `mã`. Dòng trống ngăn đoạn.', group: 'Nội dung' },
      { name: 'patterns', label: 'Công thức (JSON)', type: 'json', hint: '[{"form":"...","example":"...","vi":"..."}]', group: 'Nội dung' },
      { name: 'examples', label: 'Ví dụ (JSON)', type: 'json', group: 'Nội dung' },
      { name: 'pitfallsVi', label: 'Lỗi hay mắc (mỗi dòng một mục)', type: 'jsonList', group: 'Nội dung' },
      { name: 'tipsVi', label: 'Mẹo nhớ (mỗi dòng một mục)', type: 'jsonList', group: 'Nội dung' },
      { name: 'readingId', label: 'Bài đọc liên quan', type: 'relation', relation: { model: 'readingItem', labelField: 'titleVi' }, group: 'Liên kết' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'listening',
    model: 'listeningItem',
    labelVi: 'Bài nghe',
    labelPluralVi: 'Bài nghe',
    group: 'content',
    icon: 'headphones',
    creatable: true,
    deletable: true,
    searchFields: ['titleVi', 'slug', 'series'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    noteVi:
      'Bài nghe nhập từ VOA Learning English (phạm vi công cộng). Trường “Đường dẫn audio” trỏ tới CDN của VOA; nếu bạn tải bản sao về máy chủ thì điền vào “Audio nội bộ”.',
    columns: [
      { name: 'titleVi', label: 'Tiêu đề' },
      { name: 'series', label: 'Chuyên mục', kind: 'badge', width: '11rem' },
      { name: 'cefr', label: 'CEFR', kind: 'level', width: '5rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tiêu đề (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tiêu đề (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'series', label: 'Chuyên mục', type: 'text', group: 'Cơ bản' },
      { name: 'seriesNameVi', label: 'Tên chuyên mục (VI)', type: 'text', group: 'Cơ bản' },
      { name: 'cefr', label: 'CEFR', type: 'select', options: LEVEL_OPTIONS, group: 'Cơ bản' },
      { name: 'summaryVi', label: 'Tóm tắt (VI)', type: 'textarea', rows: 3, group: 'Nội dung' },
      { name: 'audioUrl', label: 'Đường dẫn audio', type: 'text', required: true, group: 'Media' },
      { name: 'audioPath', label: 'Audio nội bộ', type: 'text', group: 'Media' },
      { name: 'imageUrl', label: 'Ảnh minh hoạ', type: 'text', group: 'Media' },
      { name: 'transcript', label: 'Lời thoại (JSON mảng đoạn)', type: 'json', rows: 12, group: 'Nội dung' },
      { name: 'translationVi', label: 'Bản dịch (JSON mảng đoạn)', type: 'json', rows: 8, group: 'Nội dung' },
      { name: 'glossary', label: 'Từ khoá (JSON)', type: 'json', rows: 8, group: 'Nội dung' },
      { name: 'sourceUrl', label: 'Nguồn gốc', type: 'text', group: 'Nguồn' },
      { name: 'attribution', label: 'Ghi công', type: 'textarea', rows: 2, group: 'Nguồn' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'reading',
    model: 'readingItem',
    labelVi: 'Bài đọc',
    labelPluralVi: 'Bài đọc',
    group: 'content',
    icon: 'book-open',
    creatable: true,
    deletable: true,
    searchFields: ['titleVi', 'slug', 'series'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'titleVi', label: 'Tiêu đề' },
      { name: 'kind', label: 'Loại', kind: 'badge', width: '8rem' },
      { name: 'wordCount', label: 'Số từ', kind: 'number', width: '6rem' },
      { name: 'cefr', label: 'CEFR', kind: 'level', width: '5rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tiêu đề (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tiêu đề (EN)', type: 'text', group: 'Cơ bản' },
      {
        name: 'kind',
        label: 'Loại',
        type: 'select',
        options: [
          { value: 'ARTICLE', label: 'Bài báo' },
          { value: 'STORY', label: 'Truyện' },
          { value: 'DIALOGUE', label: 'Hội thoại' },
          { value: 'EXAM_PASSAGE', label: 'Bài luyện thi' },
        ],
        group: 'Cơ bản',
      },
      { name: 'series', label: 'Chuyên mục', type: 'text', group: 'Cơ bản' },
      { name: 'cefr', label: 'CEFR', type: 'select', options: LEVEL_OPTIONS, group: 'Cơ bản' },
      { name: 'summaryVi', label: 'Tóm tắt (VI)', type: 'textarea', rows: 3, group: 'Nội dung' },
      { name: 'body', label: 'Nội dung (JSON mảng đoạn)', type: 'json', rows: 16, required: true, group: 'Nội dung' },
      { name: 'glossary', label: 'Từ khoá (JSON)', type: 'json', rows: 8, group: 'Nội dung' },
      { name: 'wordCount', label: 'Số từ', type: 'number', group: 'Phân loại' },
      { name: 'readingMinutes', label: 'Phút đọc', type: 'number', group: 'Phân loại' },
      { name: 'audioUrl', label: 'Audio (nếu có)', type: 'text', group: 'Media' },
      { name: 'imageUrl', label: 'Ảnh minh hoạ', type: 'text', group: 'Media' },
      { name: 'sourceUrl', label: 'Nguồn gốc', type: 'text', group: 'Nguồn' },
      { name: 'attribution', label: 'Ghi công', type: 'textarea', rows: 2, group: 'Nguồn' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'tracks',
    model: 'track',
    labelVi: 'Lộ trình',
    labelPluralVi: 'Lộ trình',
    group: 'content',
    icon: 'route',
    creatable: true,
    deletable: true,
    searchFields: ['titleVi', 'slug'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'titleVi', label: 'Lộ trình' },
      { name: 'category', label: 'Nhóm', kind: 'badge' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tên (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tên (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'summaryVi', label: 'Mô tả (VI)', type: 'textarea', rows: 3, group: 'Cơ bản' },
      { name: 'summaryEn', label: 'Mô tả (EN)', type: 'textarea', rows: 2, group: 'Cơ bản' },
      {
        name: 'category',
        label: 'Nhóm',
        type: 'select',
        options: [
          { value: 'AGE', label: 'Theo độ tuổi' },
          { value: 'GENERAL', label: 'Tổng quát' },
          { value: 'EXAM', label: 'Luyện thi' },
          { value: 'SKILL', label: 'Theo kỹ năng' },
        ],
        group: 'Phân loại',
      },
      { name: 'audience', label: 'Đối tượng', type: 'multiselect', options: SEGMENT_OPTIONS, group: 'Phân loại' },
      { name: 'accent', label: 'Màu', type: 'select', options: ACCENT_OPTIONS, group: 'Phân loại' },
      statusField,
      orderField,
    ],
  },

  // ----------------------------------------------------------------- people --
  {
    key: 'teachers',
    model: 'teacherProfile',
    labelVi: 'Giáo viên',
    labelPluralVi: 'Giáo viên',
    group: 'people',
    icon: 'graduation-cap',
    deletable: true,
    searchFields: ['slug', 'headlineVi'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'slug', label: 'Slug' },
      { name: 'headlineVi', label: 'Chức danh' },
      { name: 'yearsExperience', label: 'Năm KN', kind: 'number', width: '6rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'headlineVi', label: 'Chức danh (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'headlineEn', label: 'Chức danh (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'bioVi', label: 'Giới thiệu (VI)', type: 'textarea', rows: 6, group: 'Nội dung' },
      { name: 'bioEn', label: 'Giới thiệu (EN)', type: 'textarea', rows: 4, group: 'Nội dung' },
      { name: 'photoUrl', label: 'Ảnh', type: 'text', group: 'Nội dung' },
      { name: 'yearsExperience', label: 'Số năm kinh nghiệm', type: 'number', group: 'Hồ sơ' },
      { name: 'educationVi', label: 'Học vấn (JSON)', type: 'json', rows: 6, group: 'Hồ sơ' },
      { name: 'certificatesVi', label: 'Chứng chỉ (JSON)', type: 'json', rows: 6, group: 'Hồ sơ' },
      { name: 'achievementsVi', label: 'Thành tích (mỗi dòng một mục)', type: 'jsonList', group: 'Hồ sơ' },
      { name: 'methodsVi', label: 'Phương pháp dạy (mỗi dòng một mục)', type: 'jsonList', group: 'Hồ sơ' },
      { name: 'specialties', label: 'Chuyên môn', type: 'jsonList', group: 'Hồ sơ' },
      { name: 'rating', label: 'Điểm đánh giá', type: 'number', group: 'Hồ sơ' },
      { name: 'reviewCount', label: 'Số đánh giá', type: 'number', group: 'Hồ sơ' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'students',
    model: 'user',
    labelVi: 'Người dùng',
    labelPluralVi: 'Học viên & tài khoản',
    group: 'people',
    icon: 'users',
    deletable: true,
    searchFields: ['name', 'email', 'phone'],
    defaultOrder: { field: 'createdAt', direction: 'desc' },
    columns: [
      { name: 'name', label: 'Họ tên' },
      { name: 'email', label: 'Email' },
      { name: 'role', label: 'Vai trò', kind: 'badge', width: '7rem' },
      { name: 'isActive', label: 'Hoạt động', kind: 'boolean', width: '6rem' },
      { name: 'createdAt', label: 'Tạo lúc', kind: 'date', width: '9rem' },
    ],
    fields: [
      { name: 'name', label: 'Họ tên', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'email', label: 'Email', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'phone', label: 'Điện thoại', type: 'text', group: 'Cơ bản' },
      {
        name: 'role',
        label: 'Vai trò',
        type: 'select',
        options: [
          { value: 'STUDENT', label: 'Học viên' },
          { value: 'TEACHER', label: 'Giáo viên' },
          { value: 'ADMIN', label: 'Quản trị' },
        ],
        group: 'Phân quyền',
      },
      { name: 'isActive', label: 'Đang hoạt động', type: 'boolean', group: 'Phân quyền' },
      { name: 'locale', label: 'Ngôn ngữ', type: 'select', options: [{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }], group: 'Phân quyền' },
    ],
  },

  // ------------------------------------------------------------- operations --
  {
    key: 'classes',
    model: 'classGroup',
    labelVi: 'Lớp học',
    labelPluralVi: 'Lớp học',
    group: 'operations',
    icon: 'users',
    creatable: true,
    deletable: true,
    searchFields: ['code', 'titleVi'],
    defaultOrder: { field: 'startDate', direction: 'desc' },
    columns: [
      { name: 'code', label: 'Mã lớp', width: '9rem' },
      { name: 'titleVi', label: 'Tên lớp' },
      { name: 'mode', label: 'Hình thức', kind: 'badge', width: '8rem' },
      { name: 'enrolled', label: 'Đã ghi danh', kind: 'number', width: '8rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'code', label: 'Mã lớp', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'courseId', label: 'Khoá học', type: 'relation', relation: { model: 'course', labelField: 'titleVi' }, required: true, group: 'Cơ bản' },
      { name: 'teacherId', label: 'Giáo viên', type: 'relation', relation: { model: 'teacherProfile', labelField: 'slug' }, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tên lớp', type: 'text', required: true, group: 'Cơ bản' },
      {
        name: 'format',
        label: 'Quy mô',
        type: 'select',
        options: [
          { value: 'ONE_TO_ONE', label: 'Kèm 1–1' },
          { value: 'SMALL_GROUP', label: 'Nhóm nhỏ' },
          { value: 'CLASS', label: 'Lớp' },
        ],
        group: 'Tổ chức',
      },
      {
        name: 'mode',
        label: 'Hình thức',
        type: 'select',
        options: [
          { value: 'ONLINE', label: 'Trực tuyến' },
          { value: 'OFFLINE', label: 'Tại trung tâm' },
          { value: 'HYBRID', label: 'Kết hợp' },
        ],
        group: 'Tổ chức',
      },
      { name: 'scheduleVi', label: 'Lịch học', type: 'text', group: 'Tổ chức' },
      { name: 'room', label: 'Phòng', type: 'text', group: 'Tổ chức' },
      { name: 'capacity', label: 'Sĩ số tối đa', type: 'number', group: 'Tổ chức' },
      { name: 'enrolled', label: 'Đã ghi danh', type: 'number', group: 'Tổ chức' },
      { name: 'priceVnd', label: 'Học phí (VND)', type: 'number', group: 'Tổ chức' },
      { name: 'startDate', label: 'Ngày bắt đầu', type: 'date', group: 'Tổ chức' },
      { name: 'endDate', label: 'Ngày kết thúc', type: 'date', group: 'Tổ chức' },
      {
        name: 'status',
        label: 'Trạng thái',
        type: 'select',
        options: ['OPEN', 'RUNNING', 'FULL', 'FINISHED', 'CANCELLED'].map((value) => ({ value, label: value })),
        group: 'Xuất bản',
      },
    ],
  },
  {
    key: 'enrollments',
    model: 'enrollment',
    labelVi: 'Ghi danh',
    labelPluralVi: 'Ghi danh',
    group: 'operations',
    icon: 'clipboard-list',
    deletable: true,
    searchFields: [],
    defaultOrder: { field: 'startedAt', direction: 'desc' },
    columns: [
      { name: 'mode', label: 'Hình thức', kind: 'badge' },
      { name: 'progress', label: 'Tiến độ', kind: 'number', width: '7rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
      { name: 'startedAt', label: 'Bắt đầu', kind: 'date', width: '9rem' },
    ],
    fields: [
      {
        name: 'status',
        label: 'Trạng thái',
        type: 'select',
        options: ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'].map((value) => ({ value, label: value })),
        group: 'Cơ bản',
      },
      { name: 'progress', label: 'Tiến độ (%)', type: 'number', group: 'Cơ bản' },
      {
        name: 'mode',
        label: 'Hình thức',
        type: 'select',
        options: ['SELF_STUDY', 'ONLINE_CLASS', 'OFFLINE_CLASS', 'ONE_TO_ONE', 'SMALL_GROUP'].map((value) => ({ value, label: value })),
        group: 'Cơ bản',
      },
    ],
  },
  {
    key: 'products',
    model: 'product',
    labelVi: 'Gói dịch vụ',
    labelPluralVi: 'Gói dịch vụ & học phí',
    group: 'operations',
    icon: 'tag',
    creatable: true,
    deletable: true,
    searchFields: ['sku', 'titleVi'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'sku', label: 'Mã', width: '11rem' },
      { name: 'titleVi', label: 'Tên gói' },
      { name: 'priceVnd', label: 'Giá', kind: 'number' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'sku', label: 'Mã gói', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'kind', label: 'Loại', type: 'select', options: ['COURSE', 'PACKAGE', 'TUTORING', 'CLASS', 'CONSULTATION'].map((value) => ({ value, label: value })), group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tên (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tên (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'descriptionVi', label: 'Mô tả', type: 'textarea', rows: 3, group: 'Cơ bản' },
      { name: 'priceVnd', label: 'Giá (VND)', type: 'number', group: 'Giá' },
      { name: 'comparePriceVnd', label: 'Giá gạch ngang', type: 'number', group: 'Giá' },
      { name: 'quantity', label: 'Số buổi', type: 'number', group: 'Giá' },
      { name: 'durationDays', label: 'Hiệu lực (ngày)', type: 'number', group: 'Giá' },
      { name: 'features', label: 'Quyền lợi (mỗi dòng một mục)', type: 'jsonList', group: 'Nội dung' },
      { name: 'isPopular', label: 'Nổi bật', type: 'boolean', group: 'Xuất bản' },
      statusField,
      orderField,
    ],
  },

  // ---------------------------------------------------------------- website --
  {
    key: 'testimonials',
    model: 'testimonial',
    labelVi: 'Cảm nhận học viên',
    labelPluralVi: 'Cảm nhận học viên',
    group: 'website',
    icon: 'quote',
    creatable: true,
    deletable: true,
    searchFields: ['name', 'quoteVi'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'name', label: 'Học viên', width: '12rem' },
      { name: 'roleVi', label: 'Vai trò' },
      { name: 'resultVi', label: 'Kết quả' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Tên học viên', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'roleVi', label: 'Vai trò / lớp', type: 'text', group: 'Cơ bản' },
      { name: 'quoteVi', label: 'Cảm nhận (VI)', type: 'textarea', rows: 5, required: true, group: 'Nội dung' },
      { name: 'quoteEn', label: 'Cảm nhận (EN)', type: 'textarea', rows: 3, group: 'Nội dung' },
      { name: 'resultVi', label: 'Kết quả đạt được', type: 'text', group: 'Nội dung' },
      { name: 'courseSlug', label: 'Khoá liên quan (slug)', type: 'text', group: 'Nội dung' },
      { name: 'rating', label: 'Số sao', type: 'number', group: 'Nội dung' },
      statusField,
      orderField,
    ],
  },
  {
    key: 'faq',
    model: 'faqItem',
    labelVi: 'Câu hỏi thường gặp',
    labelPluralVi: 'Câu hỏi thường gặp',
    group: 'website',
    icon: 'help-circle',
    creatable: true,
    deletable: true,
    searchFields: ['questionVi', 'answerVi'],
    defaultOrder: { field: 'displayOrder', direction: 'asc' },
    columns: [
      { name: 'questionVi', label: 'Câu hỏi' },
      { name: 'category', label: 'Nhóm', kind: 'badge', width: '8rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'questionVi', label: 'Câu hỏi (VI)', type: 'text', required: true, group: 'Nội dung' },
      { name: 'answerVi', label: 'Trả lời (VI)', type: 'textarea', rows: 5, required: true, group: 'Nội dung' },
      { name: 'questionEn', label: 'Câu hỏi (EN)', type: 'text', group: 'Nội dung' },
      { name: 'answerEn', label: 'Trả lời (EN)', type: 'textarea', rows: 4, group: 'Nội dung' },
      {
        name: 'category',
        label: 'Nhóm',
        type: 'select',
        options: [
          { value: 'general', label: 'Chung' },
          { value: 'learning', label: 'Việc học' },
          { value: 'classes', label: 'Lớp học' },
          { value: 'payment', label: 'Học phí' },
        ],
        group: 'Phân loại',
      },
      statusField,
      orderField,
    ],
  },
  {
    key: 'announcements',
    model: 'announcement',
    labelVi: 'Thông báo',
    labelPluralVi: 'Thông báo',
    group: 'website',
    icon: 'megaphone',
    creatable: true,
    deletable: true,
    searchFields: ['titleVi'],
    columns: [
      { name: 'titleVi', label: 'Nội dung' },
      { name: 'level', label: 'Mức', kind: 'badge', width: '7rem' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'titleVi', label: 'Nội dung (VI)', type: 'text', required: true, group: 'Nội dung' },
      { name: 'bodyVi', label: 'Chi tiết (VI)', type: 'textarea', rows: 3, group: 'Nội dung' },
      { name: 'href', label: 'Đường dẫn', type: 'text', group: 'Nội dung' },
      { name: 'level', label: 'Mức độ', type: 'select', options: ['INFO', 'SUCCESS', 'WARNING'].map((value) => ({ value, label: value })), group: 'Phân loại' },
      statusField,
    ],
  },
  {
    key: 'pages',
    model: 'page',
    labelVi: 'Trang tĩnh',
    labelPluralVi: 'Trang tĩnh',
    group: 'website',
    icon: 'file-text',
    creatable: true,
    deletable: true,
    searchFields: ['slug', 'titleVi'],
    columns: [
      { name: 'slug', label: 'Slug', width: '12rem' },
      { name: 'titleVi', label: 'Tiêu đề' },
      { name: 'status', label: 'Trạng thái', kind: 'status' },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleVi', label: 'Tiêu đề (VI)', type: 'text', required: true, group: 'Cơ bản' },
      { name: 'titleEn', label: 'Tiêu đề (EN)', type: 'text', group: 'Cơ bản' },
      { name: 'bodyVi', label: 'Nội dung (VI)', type: 'textarea', rows: 20, required: true, hint: 'Dùng "## " cho tiêu đề mục và "- " cho danh sách.', group: 'Nội dung' },
      { name: 'bodyEn', label: 'Nội dung (EN)', type: 'textarea', rows: 12, group: 'Nội dung' },
      statusField,
    ],
  },
];

export function findResource(key: string): AdminResource | undefined {
  return RESOURCES.find((resource) => resource.key === key);
}

export const RESOURCE_GROUPS: { key: AdminResource['group']; labelVi: string }[] = [
  { key: 'content', labelVi: 'Nội dung học' },
  { key: 'people', labelVi: 'Con người' },
  { key: 'operations', labelVi: 'Vận hành' },
  { key: 'website', labelVi: 'Website' },
];
