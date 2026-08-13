"""
The grammar topic catalogue.

A note on what is sourced and what is written here, because the distinction matters.

**Sourced.** The CEFR level of each topic is anchored to the CEFR-J Grammar Profile
(CC BY-SA 4.0), which lists 500 grammatical items with the level at which learners control
them. The example sentences are real sentences from Tatoeba, matched to each topic by the
patterns below and shown with their Vietnamese translations and their contributors' names.
Where VOA's Everyday Grammar has covered a point, that public-domain article is attached to
the topic so a learner can read a fuller treatment with audio.

**Written for this platform.** The Vietnamese explanations, the form tables, and the
"mistakes Vietnamese learners make" notes. There is no openly licensed Vietnamese-language
English grammar reference to draw on, and a machine translation of an English explanation
would be worse than useless — the whole value of a Vietnamese explanation is that it names
the specific interference from Vietnamese (no verb inflection, no articles, no plural
marking, tense carried by adverbs) that causes the error in the first place.

So: levels and examples are evidence; the Vietnamese scaffolding around them is editorial.
Both are labelled as such in the UI.
"""

from __future__ import annotations

# `match` is a list of regular expressions run against Tatoeba English sentences to find
# real attestations of the pattern. `avoid` removes false positives.
TOPICS: list[dict] = [
    # ---------------------------------------------------------------- A1 ----
    {
        "slug": "verb-to-be-present",
        "titleVi": "Động từ to be ở hiện tại (am / is / are)",
        "titleEn": "The verb to be — present simple",
        "cefr": "A1",
        "category": "tense",
        "cefrjCodes": ["PP.I_am", "PP.I_am_not", "PP.am_I"],
        "summaryVi": "Câu tiếng Anh bắt buộc phải có động từ. Tiếng Việt nói “Tôi là học sinh” hay “Tôi mệt” đều được, nhưng tiếng Anh phải có am/is/are.",
        "theoryVi": (
            "To be là động từ dùng để nói ai đó **là gì**, **thế nào** hoặc **ở đâu**. "
            "Đây là điểm khác biệt lớn đầu tiên giữa tiếng Việt và tiếng Anh: trong tiếng Việt, "
            "câu “Tôi mệt” không cần từ nào giữa “tôi” và “mệt”, nhưng tiếng Anh bắt buộc phải có "
            "*am*: **I am tired**. Bỏ động từ to be là lỗi phổ biến nhất của người mới học.\n\n"
            "Dạng của to be thay đổi theo chủ ngữ — đây là điều tiếng Việt không có, vì động từ "
            "tiếng Việt không bao giờ đổi hình. Bạn cần thuộc lòng ba dạng: *am* đi với I, "
            "*is* đi với he / she / it và danh từ số ít, *are* đi với you / we / they và danh từ số nhiều.\n\n"
            "Khi nói, người bản xứ hầu như luôn dùng dạng rút gọn: *I'm*, *he's*, *they're*. "
            "Dạng đầy đủ nghe rất trang trọng hoặc mang ý nhấn mạnh."
        ),
        "patterns": [
            {"form": "I am + (danh từ / tính từ / nơi chốn)", "example": "I am a student.", "vi": "Tôi là học sinh."},
            {"form": "He / She / It is …", "example": "She is from Hue.", "vi": "Cô ấy đến từ Huế."},
            {"form": "You / We / They are …", "example": "They are at school.", "vi": "Họ đang ở trường."},
            {"form": "Phủ định: chủ ngữ + am/is/are + not", "example": "He is not hungry.", "vi": "Anh ấy không đói."},
            {"form": "Nghi vấn: Am/Is/Are + chủ ngữ …?", "example": "Are you ready?", "vi": "Bạn sẵn sàng chưa?"},
        ],
        "match": [r"\b(I am|I'm)\b", r"\b(he|she|it) is\b", r"\b(you|we|they) are\b", r"^(Am|Is|Are) "],
        "pitfallsVi": [
            "**Thiếu to be**: ✗ *I hungry.* → ✓ *I am hungry.* Tiếng Việt không cần động từ ở đây nên rất dễ quên.",
            "**Dùng to be cùng động từ thường**: ✗ *I am go to school.* → ✓ *I go to school.* Chỉ dùng to be khi sau đó **không** có động từ thường.",
            "**Sai dạng theo chủ ngữ**: ✗ *She are a teacher.* → ✓ *She is a teacher.*",
        ],
        "tipsVi": [
            "Nhớ theo cặp: I–am, He/She/It–is, You/We/They–are. Đọc to ba cặp này mỗi ngày một lần trong tuần đầu.",
            "Khi viết xong một câu, tự hỏi: “Câu này có động từ chưa?” Nếu chỉ có chủ ngữ và tính từ thì chắc chắn thiếu to be.",
        ],
        "voaKeywords": ["be verb", "verb be", "am is are"],
    },
    {
        "slug": "present-simple",
        "titleVi": "Thì hiện tại đơn",
        "titleEn": "Present simple",
        "cefr": "A1",
        "category": "tense",
        "cefrjCodes": ["SP.I_verb", "SP.he_verbs"],
        "summaryVi": "Dùng cho thói quen, sự thật và lịch trình. Điểm khó duy nhất với người Việt: thêm -s khi chủ ngữ là ngôi thứ ba số ít.",
        "theoryVi": (
            "Hiện tại đơn nói về những việc **lặp đi lặp lại** (thói quen), những điều **luôn đúng** "
            "(sự thật), và **lịch trình cố định** (tàu xe, thời khoá biểu).\n\n"
            "Hình thức rất đơn giản — dùng nguyên thể của động từ — **trừ** khi chủ ngữ là *he*, *she*, "
            "*it* hoặc một danh từ số ít, thì động từ phải thêm **-s**. Người Việt hay quên chữ -s này, "
            "vì động từ tiếng Việt không bao giờ đổi theo chủ ngữ: “tôi đi”, “anh ấy đi” — cùng một chữ “đi”.\n\n"
            "Ở dạng phủ định và nghi vấn, ta mượn trợ động từ *do* / *does*. Khi đã có *does*, "
            "động từ chính **quay lại nguyên thể**: ✓ *She doesn't like coffee* — không phải *doesn't likes*."
        ),
        "patterns": [
            {"form": "I / You / We / They + V", "example": "They live in Da Nang.", "vi": "Họ sống ở Đà Nẵng."},
            {"form": "He / She / It + V-s", "example": "She works at a bank.", "vi": "Cô ấy làm ở ngân hàng."},
            {"form": "Phủ định: do/does + not + V", "example": "He doesn't smoke.", "vi": "Anh ấy không hút thuốc."},
            {"form": "Nghi vấn: Do/Does + chủ ngữ + V?", "example": "Do you speak English?", "vi": "Bạn có nói tiếng Anh không?"},
        ],
        "match": [r"\b(usually|always|often|every day|every morning|sometimes|never)\b", r"^(Do|Does) (you|he|she|they|we|I)\b"],
        "pitfallsVi": [
            "**Quên -s**: ✗ *He live in Hanoi.* → ✓ *He lives in Hanoi.*",
            "**Thêm -s hai lần**: ✗ *She doesn't works.* → ✓ *She doesn't work.* Sau *does* thì động từ trở về nguyên thể.",
            "**Dùng hiện tại đơn cho việc đang xảy ra**: ✗ *Look! He runs.* → ✓ *Look! He is running.*",
        ],
        "tipsVi": [
            "Quy tắc gọn: **he / she / it → thêm s**. Ba từ này viết ra giấy dán lên bàn học tuần đầu.",
            "Trạng từ tần suất (always, usually, often, never) đứng **trước** động từ thường nhưng **sau** to be.",
        ],
        "voaKeywords": ["present tense", "simple present"],
    },
    {
        "slug": "articles-a-an-the",
        "titleVi": "Mạo từ a / an / the",
        "titleEn": "Articles: a, an, the",
        "cefr": "A1",
        "category": "article",
        "cefrjCodes": ["NP.a_N", "NP.the_N"],
        "summaryVi": "Tiếng Việt không có mạo từ, nên đây là phần người Việt sai nhiều nhất suốt nhiều năm học.",
        "theoryVi": (
            "Tiếng Việt không có mạo từ. “Tôi mua sách” có thể là một quyển hay nhiều quyển, quyển nào "
            "cũng được — người nghe tự hiểu theo ngữ cảnh. Tiếng Anh thì bắt buộc phải chọn: *a book*, "
            "*the book*, hay *books*. Vì vậy đây là lỗi kéo dài nhất của người học Việt Nam, kể cả ở trình độ cao.\n\n"
            "**a / an** dùng khi nhắc đến một thứ **lần đầu**, hoặc một thứ **bất kỳ** trong nhóm. "
            "Chọn *an* khi từ đứng sau bắt đầu bằng **âm** nguyên âm — chú ý là âm chứ không phải chữ: "
            "*an hour* (h câm), nhưng *a university* (đọc là /juː/).\n\n"
            "**the** dùng khi cả người nói và người nghe **đều biết** đang nói tới cái nào: đã nhắc trước đó, "
            "là duy nhất (*the sun*), hoặc được xác định bằng ngữ cảnh (*the teacher* — giáo viên của lớp mình).\n\n"
            "**Không dùng mạo từ** với danh từ số nhiều hoặc danh từ không đếm được khi nói chung chung: "
            "*I like coffee*, *Books are expensive*."
        ),
        "patterns": [
            {"form": "a + phụ âm", "example": "a book, a student, a university", "vi": "một quyển sách, một học sinh"},
            {"form": "an + nguyên âm", "example": "an apple, an hour, an honest man", "vi": "một quả táo, một giờ"},
            {"form": "the + thứ đã xác định", "example": "I bought a book. The book was cheap.", "vi": "Tôi mua một quyển sách. Quyển sách đó rẻ."},
            {"form": "không mạo từ + danh từ chung chung", "example": "I like music.", "vi": "Tôi thích âm nhạc."},
        ],
        "match": [r"\ban (hour|apple|egg|umbrella|idea|honest|old|English|island)\b", r"\bthe (sun|moon|world|same|first|best)\b"],
        "pitfallsVi": [
            "**Bỏ mạo từ**: ✗ *I am student.* → ✓ *I am a student.*",
            "**Thừa the**: ✗ *I like the music.* (nếu nói về âm nhạc nói chung) → ✓ *I like music.*",
            "**Chọn a/an theo chữ cái thay vì theo âm**: ✗ *a hour* → ✓ *an hour*; ✗ *an university* → ✓ *a university*.",
        ],
        "tipsVi": [
            "Tự hỏi hai câu: (1) Người nghe có biết mình đang nói cái nào không? → có thì dùng *the*. (2) Đây là lần đầu nhắc tới? → dùng *a/an*.",
            "Đọc to câu lên. Nếu nghe *a* trước một nguyên âm thấy vướng miệng thì đúng là phải dùng *an*.",
        ],
        "voaKeywords": ["articles", "the article"],
    },
    {
        "slug": "plural-nouns",
        "titleVi": "Danh từ số nhiều",
        "titleEn": "Plural nouns",
        "cefr": "A1",
        "category": "noun",
        "cefrjCodes": ["NP.Ns"],
        "summaryVi": "Tiếng Việt dùng “những”, “các” tách rời; tiếng Anh gắn -s vào chính danh từ và bắt buộc phải có.",
        "theoryVi": (
            "Trong tiếng Việt, số nhiều được thể hiện bằng từ riêng đứng trước (“hai quyển sách”, “các bạn”), "
            "còn bản thân danh từ không đổi. Tiếng Anh làm ngược lại: danh từ **tự đổi hình** bằng đuôi -s, "
            "và khi đã có số đếm lớn hơn một thì đuôi -s là **bắt buộc**, không phải tuỳ chọn.\n\n"
            "Quy tắc chính tả: thêm **-es** sau s, x, z, ch, sh (*boxes*, *watches*); đổi **y → ies** khi "
            "trước y là phụ âm (*city → cities*) nhưng giữ nguyên khi trước y là nguyên âm (*boy → boys*).\n\n"
            "Một nhóm danh từ có dạng số nhiều bất quy tắc và phải học thuộc: *man → men*, *woman → women*, "
            "*child → children*, *foot → feet*, *tooth → teeth*, *person → people*, *mouse → mice*.\n\n"
            "Cuối cùng, danh từ **không đếm được** (*water*, *rice*, *information*, *advice*, *furniture*) "
            "không bao giờ có -s. Đây là chỗ hay sai vì tiếng Việt đếm được tất cả: “nhiều lời khuyên”."
        ),
        "patterns": [
            {"form": "danh từ + s", "example": "two books, three cats", "vi": "hai quyển sách, ba con mèo"},
            {"form": "s/x/ch/sh + es", "example": "boxes, watches, brushes", "vi": "những cái hộp, những cái đồng hồ"},
            {"form": "phụ âm + y → ies", "example": "city → cities", "vi": "thành phố → những thành phố"},
            {"form": "bất quy tắc", "example": "child → children, person → people", "vi": "trẻ em, người"},
        ],
        "match": [r"\b(children|people|men|women|feet|teeth|mice)\b", r"\b(two|three|four|five|many|several) [a-z]+s\b"],
        "pitfallsVi": [
            "**Quên -s sau số đếm**: ✗ *I have two book.* → ✓ *I have two books.*",
            "**Thêm -s vào danh từ không đếm được**: ✗ *many informations* → ✓ *a lot of information*.",
            "**Dùng số nhiều kép**: ✗ *childrens* → ✓ *children*.",
        ],
        "tipsVi": [
            "Mỗi khi viết một số đếm, dừng lại kiểm tra danh từ ngay sau nó đã có -s chưa.",
            "Học danh từ không đếm được theo nhóm: chất lỏng, chất bột, khái niệm trừu tượng.",
        ],
        "voaKeywords": ["plural", "count nouns", "noncount"],
    },
    {
        "slug": "there-is-there-are",
        "titleVi": "Cấu trúc There is / There are",
        "titleEn": "There is / There are",
        "cefr": "A1",
        "category": "word-order",
        "cefrjCodes": ["EX.there_is"],
        "summaryVi": "Dùng để nói “có …”. Đây là cấu trúc mà dịch từng chữ từ tiếng Việt sẽ sai hoàn toàn.",
        "theoryVi": (
            "Tiếng Việt nói “Trong phòng **có** ba người”. Nếu dịch từng chữ sang tiếng Anh thành "
            "*In the room have three people* thì sai — vì *have* nghĩa là **sở hữu**, không phải **tồn tại**.\n\n"
            "Tiếng Anh dùng cấu trúc riêng: **There is** cho số ít và danh từ không đếm được, "
            "**There are** cho số nhiều. Chữ *there* ở đây không có nghĩa “ở đó”, nó chỉ là một chủ ngữ "
            "giả để câu có đủ hình thức.\n\n"
            "Động từ chia theo danh từ **đứng ngay sau** nó: *There is a book and two pens* — dùng *is* "
            "vì danh từ gần nhất là *a book*."
        ),
        "patterns": [
            {"form": "There is + danh từ số ít / không đếm được", "example": "There is a problem.", "vi": "Có một vấn đề."},
            {"form": "There are + danh từ số nhiều", "example": "There are many students here.", "vi": "Ở đây có nhiều học sinh."},
            {"form": "Phủ định", "example": "There isn't any milk.", "vi": "Không có sữa."},
            {"form": "Nghi vấn", "example": "Is there a bank near here?", "vi": "Gần đây có ngân hàng không?"},
        ],
        "match": [r"\bThere (is|are|isn't|aren't|was|were)\b", r"\bIs there\b", r"\bAre there\b"],
        "pitfallsVi": [
            "**Dùng have thay there is**: ✗ *In my class have 30 students.* → ✓ *There are 30 students in my class.*",
            "**Sai số ít/số nhiều**: ✗ *There is many people.* → ✓ *There are many people.*",
        ],
        "tipsVi": [
            "Khi định viết chữ “có” theo nghĩa tồn tại, hãy nghĩ ngay tới *There is/are* chứ không phải *have*.",
        ],
        "voaKeywords": ["there is", "there are"],
    },
    {
        "slug": "possessives",
        "titleVi": "Sở hữu cách: 's và tính từ sở hữu",
        "titleEn": "Possessives: 's and possessive adjectives",
        "cefr": "A1",
        "category": "noun",
        "cefrjCodes": ["NP.Ns_poss"],
        "summaryVi": "Tiếng Anh đặt người sở hữu **trước** vật sở hữu — ngược hoàn toàn với trật tự tiếng Việt.",
        "theoryVi": (
            "Tiếng Việt nói “sách **của tôi**” — vật trước, người sau. Tiếng Anh nói **my** book — "
            "người trước, vật sau. Trật tự ngược nhau là nguyên nhân của rất nhiều câu sai.\n\n"
            "Với danh từ chỉ **người** hoặc **động vật**, ta thêm **'s**: *Lan's book*, *the dog's tail*. "
            "Nếu danh từ đã có sẵn -s số nhiều thì chỉ thêm dấu nháy: *the students' room*.\n\n"
            "Với **vật vô tri**, tiếng Anh thường dùng *of* thay vì 's: *the door of the car* "
            "(dù *the car door* cũng rất tự nhiên).\n\n"
            "Tính từ sở hữu — *my, your, his, her, its, our, their* — luôn đứng trước danh từ và "
            "**không đổi** theo số ít hay số nhiều của vật: *my book*, *my books*."
        ),
        "patterns": [
            {"form": "người + 's + vật", "example": "Nam's bicycle", "vi": "xe đạp của Nam"},
            {"form": "danh từ số nhiều + '", "example": "the teachers' room", "vi": "phòng giáo viên"},
            {"form": "tính từ sở hữu + danh từ", "example": "her family", "vi": "gia đình cô ấy"},
            {"form": "vật + of + vật", "example": "the end of the street", "vi": "cuối con phố"},
        ],
        "match": [r"\b[A-Z][a-z]+'s [a-z]+\b", r"\b(my|your|his|her|our|their) [a-z]+\b"],
        "pitfallsVi": [
            "**Đảo trật tự**: ✗ *the book of me* → ✓ *my book*.",
            "**Nhầm its và it's**: *its* là sở hữu, *it's* là *it is*.",
            "**Thêm 's vào tính từ sở hữu**: ✗ *my's book* → ✓ *my book*.",
        ],
        "tipsVi": ["Đọc ngược từ tiếng Việt: “sách của Nam” → lấy “Nam” ra trước, thành *Nam's book*."],
        "voaKeywords": ["possessive"],
    },
    # ---------------------------------------------------------------- A2 ----
    {
        "slug": "present-continuous",
        "titleVi": "Thì hiện tại tiếp diễn",
        "titleEn": "Present continuous",
        "cefr": "A2",
        "category": "tense",
        "cefrjCodes": ["PROG.be_Ving"],
        "summaryVi": "Việc đang xảy ra ngay lúc nói. Tương ứng với “đang” trong tiếng Việt — nhưng không phải lúc nào cũng dịch được như vậy.",
        "theoryVi": (
            "Hiện tại tiếp diễn = **am/is/are + V-ing**. Dùng cho ba trường hợp: việc **đang diễn ra ngay bây giờ** "
            "(*I am reading*), việc **đang diễn ra trong giai đoạn này** dù không phải ngay lúc nói "
            "(*I am learning English this year*), và **kế hoạch đã sắp xếp** trong tương lai gần "
            "(*We are meeting at seven tonight*).\n\n"
            "Người Việt thường dịch “đang” thành hiện tại tiếp diễn và ngược lại, nhưng hai thứ không trùng nhau "
            "hoàn toàn. Trường hợp thứ ba ở trên là ví dụ: *We are meeting at seven* nói về tương lai, "
            "không có chữ “đang” nào cả.\n\n"
            "Quan trọng: một nhóm động từ **không dùng** ở tiếp diễn vì chúng chỉ trạng thái chứ không chỉ hành động — "
            "*know, understand, like, love, want, need, believe, belong*. Không nói *I am knowing*."
        ),
        "patterns": [
            {"form": "am/is/are + V-ing", "example": "She is cooking dinner.", "vi": "Cô ấy đang nấu bữa tối."},
            {"form": "Phủ định", "example": "They aren't listening.", "vi": "Họ không nghe."},
            {"form": "Nghi vấn", "example": "What are you doing?", "vi": "Bạn đang làm gì vậy?"},
            {"form": "Kế hoạch gần", "example": "I'm flying to Hanoi tomorrow.", "vi": "Mai tôi bay ra Hà Nội."},
        ],
        "match": [r"\b(am|is|are) [a-z]+ing\b", r"\bWhat (are|is) (you|he|she|they) [a-z]+ing\b"],
        "pitfallsVi": [
            "**Quên to be**: ✗ *I going home.* → ✓ *I am going home.*",
            "**Dùng với động từ trạng thái**: ✗ *I am wanting a coffee.* → ✓ *I want a coffee.*",
            "**Dùng hiện tại đơn cho việc đang xảy ra**: ✗ *He sleeps now.* → ✓ *He is sleeping now.*",
        ],
        "tipsVi": [
            "Có *now*, *at the moment*, *look!*, *listen!* → gần như chắc chắn dùng tiếp diễn.",
            "Danh sách động từ trạng thái không dài. Học thuộc một lần là dùng được mãi.",
        ],
        "voaKeywords": ["continuous", "progressive"],
    },
    {
        "slug": "past-simple",
        "titleVi": "Thì quá khứ đơn",
        "titleEn": "Past simple",
        "cefr": "A2",
        "category": "tense",
        "cefrjCodes": ["SP.V_ed"],
        "summaryVi": "Việc đã kết thúc trong quá khứ. Tiếng Việt dùng “đã” hoặc chỉ dựa vào trạng từ; tiếng Anh phải đổi hình động từ.",
        "theoryVi": (
            "Tiếng Việt diễn đạt quá khứ bằng từ chỉ thời gian (“hôm qua”, “năm ngoái”) hoặc trợ từ “đã”, "
            "còn động từ giữ nguyên. Tiếng Anh **bắt buộc đổi hình động từ**, kể cả khi trong câu đã có "
            "*yesterday*. Đây là lý do người Việt hay viết *Yesterday I go to school*.\n\n"
            "Động từ **có quy tắc** thêm **-ed**. Động từ **bất quy tắc** có dạng riêng phải học thuộc: "
            "*go → went*, *see → saw*, *buy → bought*, *take → took*. Khoảng 100 động từ bất quy tắc "
            "chiếm phần lớn động từ thông dụng, nên đầu tư học thuộc là xứng đáng.\n\n"
            "Ở phủ định và nghi vấn, ta dùng **did** và động từ chính **trở về nguyên thể**: "
            "✓ *I didn't go* — không phải *didn't went*."
        ),
        "patterns": [
            {"form": "V-ed (có quy tắc)", "example": "I worked late yesterday.", "vi": "Hôm qua tôi làm muộn."},
            {"form": "V2 (bất quy tắc)", "example": "She went to Hue last year.", "vi": "Năm ngoái cô ấy đi Huế."},
            {"form": "Phủ định: didn't + V", "example": "We didn't see him.", "vi": "Chúng tôi không gặp anh ấy."},
            {"form": "Nghi vấn: Did + chủ ngữ + V?", "example": "Did you finish the homework?", "vi": "Bạn làm xong bài tập chưa?"},
        ],
        "match": [r"\b(yesterday|last (night|week|year|month)|ago)\b", r"^(Did) (you|he|she|they|we|I)\b", r"\bdidn't\b"],
        "pitfallsVi": [
            "**Không chia động từ**: ✗ *Yesterday I go to school.* → ✓ *Yesterday I went to school.*",
            "**Chia hai lần**: ✗ *Did you went?* → ✓ *Did you go?*",
            "**Dùng was/were với động từ thường**: ✗ *I was go.* → ✓ *I went.*",
        ],
        "tipsVi": [
            "Học động từ bất quy tắc theo nhóm âm giống nhau: *sing–sang–sung*, *ring–rang–rung*, *drink–drank–drunk*.",
            "Sau *did* và *didn't*, động từ **luôn** ở nguyên thể. Quy tắc này không có ngoại lệ.",
        ],
        "voaKeywords": ["past tense", "simple past", "irregular verbs"],
    },
    {
        "slug": "future-will-going-to",
        "titleVi": "Tương lai: will và be going to",
        "titleEn": "Future: will and be going to",
        "cefr": "A2",
        "category": "tense",
        "cefrjCodes": ["MOD.will", "FUT.be_going_to"],
        "summaryVi": "Cả hai đều dịch là “sẽ”, nhưng người bản xứ chọn theo việc quyết định đã có từ trước hay vừa nảy ra.",
        "theoryVi": (
            "Tiếng Việt chỉ có một chữ “sẽ”, nên người học thường dùng *will* cho mọi trường hợp. "
            "Người bản xứ phân biệt rõ:\n\n"
            "**will** dùng cho quyết định **vừa nảy ra ngay lúc nói**, lời hứa, lời đề nghị, và dự đoán "
            "dựa trên cảm nhận cá nhân: *The phone is ringing — I'll get it.*\n\n"
            "**be going to** dùng cho kế hoạch **đã định từ trước**, và dự đoán có **bằng chứng nhìn thấy được**: "
            "*Look at those clouds — it's going to rain.*\n\n"
            "Ngoài ra, hiện tại tiếp diễn cũng diễn đạt tương lai khi việc đã được **sắp xếp cụ thể** "
            "(có hẹn, có vé): *I'm meeting Lan at six.*"
        ),
        "patterns": [
            {"form": "will + V", "example": "I'll help you.", "vi": "Để tôi giúp bạn."},
            {"form": "be going to + V", "example": "We're going to buy a house.", "vi": "Chúng tôi định mua nhà."},
            {"form": "Phủ định", "example": "She won't come.", "vi": "Cô ấy sẽ không đến."},
            {"form": "Dự đoán có bằng chứng", "example": "It's going to rain.", "vi": "Trời sắp mưa."},
        ],
        "match": [r"\b(will|won't|'ll) [a-z]+\b", r"\bgoing to [a-z]+\b"],
        "pitfallsVi": [
            "**Dùng will cho kế hoạch đã định**: nghe không tự nhiên. ✗ *I will visit my aunt tomorrow, I bought the ticket already.* → ✓ *I'm going to visit…*",
            "**Thêm to sau will**: ✗ *I will to go.* → ✓ *I will go.*",
        ],
        "tipsVi": [
            "Tự hỏi: “Mình đã quyết định việc này từ trước khi nói chưa?” Rồi → *going to*. Vừa nghĩ ra → *will*.",
        ],
        "voaKeywords": ["will", "going to", "future"],
    },
    {
        "slug": "comparatives-superlatives",
        "titleVi": "So sánh hơn và so sánh nhất",
        "titleEn": "Comparatives and superlatives",
        "cefr": "A2",
        "category": "adjective",
        "cefrjCodes": ["ADJ.er_than", "ADJ.the_est"],
        "summaryVi": "Tính từ ngắn thêm -er/-est, tính từ dài dùng more/most. Ranh giới nằm ở số âm tiết.",
        "theoryVi": (
            "Tiếng Việt so sánh bằng cách thêm từ: “cao **hơn**”, “cao **nhất**”, và tính từ không đổi. "
            "Tiếng Anh có hai cách, chọn theo **độ dài của tính từ**.\n\n"
            "Tính từ **một âm tiết** (và tính từ hai âm tiết kết thúc bằng -y) thêm **-er** / **-est**: "
            "*tall → taller → the tallest*, *happy → happier → the happiest*.\n\n"
            "Tính từ **từ hai âm tiết trở lên** dùng **more** / **most**: "
            "*expensive → more expensive → the most expensive*.\n\n"
            "Một số dạng bất quy tắc phải thuộc: *good → better → the best*, *bad → worse → the worst*, "
            "*far → further → the furthest*.\n\n"
            "So sánh hơn đi với **than**; so sánh nhất luôn có **the** đứng trước."
        ),
        "patterns": [
            {"form": "tính từ ngắn + er + than", "example": "He is taller than me.", "vi": "Anh ấy cao hơn tôi."},
            {"form": "more + tính từ dài + than", "example": "This book is more interesting than that one.", "vi": "Quyển này hay hơn quyển kia."},
            {"form": "the + tính từ ngắn + est", "example": "She is the youngest in the class.", "vi": "Cô ấy nhỏ tuổi nhất lớp."},
            {"form": "as + tính từ + as (so sánh bằng)", "example": "He is as tall as his father.", "vi": "Anh ấy cao bằng bố."},
        ],
        "match": [r"\b[a-z]+er than\b", r"\bmore [a-z]+ than\b", r"\bthe (most|best|worst|biggest|largest) \b", r"\bas [a-z]+ as\b"],
        "pitfallsVi": [
            "**Dùng cả hai cách**: ✗ *more taller* → ✓ *taller*.",
            "**Quên the ở so sánh nhất**: ✗ *He is best student.* → ✓ *He is the best student.*",
            "**Dùng with thay than**: ✗ *taller with me* → ✓ *taller than me*.",
        ],
        "tipsVi": ["Đếm âm tiết trước khi chọn. Một âm tiết → -er. Ba âm tiết trở lên → *more*. Hai âm tiết thì nghe thử cả hai."],
        "voaKeywords": ["comparative", "superlative"],
    },
    {
        "slug": "modals-can-must-should",
        "titleVi": "Động từ khuyết thiếu: can, must, should",
        "titleEn": "Modals: can, must, should",
        "cefr": "A2",
        "category": "modality",
        "cefrjCodes": ["MOD.can", "MOD.must", "MOD.should"],
        "summaryVi": "Sau động từ khuyết thiếu, động từ chính luôn ở nguyên thể — không to, không -s, không -ed.",
        "theoryVi": (
            "Động từ khuyết thiếu diễn đạt **khả năng**, **sự bắt buộc** và **lời khuyên**. Chúng có ba đặc điểm "
            "chung mà người học cần nhớ một lần rồi áp dụng cho tất cả:\n\n"
            "1. Không bao giờ thêm **-s** ở ngôi thứ ba: ✓ *She can swim*, không phải *cans*.\n"
            "2. Động từ theo sau luôn ở **nguyên thể không to**: ✓ *You should go*, không phải *should to go*.\n"
            "3. Phủ định và nghi vấn **không cần** *do/does/did*: ✓ *Can you help?*, ✓ *He can't come*.\n\n"
            "**can** = có khả năng, được phép. **must** = bắt buộc (thường do người nói thấy cần thiết). "
            "**have to** = bắt buộc do quy định bên ngoài. **should** = lời khuyên, nên làm."
        ),
        "patterns": [
            {"form": "can + V", "example": "I can speak a little English.", "vi": "Tôi nói được một chút tiếng Anh."},
            {"form": "must + V", "example": "You must wear a helmet.", "vi": "Bạn phải đội mũ bảo hiểm."},
            {"form": "should + V", "example": "You should see a doctor.", "vi": "Bạn nên đi khám."},
            {"form": "Phủ định", "example": "She can't drive.", "vi": "Cô ấy không biết lái xe."},
        ],
        "match": [r"\b(can|can't|cannot|must|should|shouldn't|could) [a-z]+\b"],
        "pitfallsVi": [
            "**Thêm to**: ✗ *You should to study.* → ✓ *You should study.*",
            "**Thêm -s**: ✗ *He cans swim.* → ✓ *He can swim.*",
            "**Dùng do trong câu hỏi**: ✗ *Do you can swim?* → ✓ *Can you swim?*",
        ],
        "tipsVi": ["Ghi nhớ một câu: “Sau modal, động từ **trần trụi**.” Không to, không s, không ed."],
        "voaKeywords": ["modal", "can", "must", "should"],
    },
    {
        "slug": "prepositions-time-place",
        "titleVi": "Giới từ chỉ thời gian và nơi chốn: in, on, at",
        "titleEn": "Prepositions of time and place: in, on, at",
        "cefr": "A2",
        "category": "preposition",
        "cefrjCodes": ["PREP.in_on_at"],
        "summaryVi": "Ba giới từ này tuân theo quy tắc “từ rộng đến hẹp” — nhớ được nguyên tắc đó là giải quyết được phần lớn trường hợp.",
        "theoryVi": (
            "Giới từ tiếng Anh không tương ứng một–một với tiếng Việt, nên dịch từng chữ sẽ sai. "
            "May mắn là *in*, *on*, *at* theo một logic khá đều: **rộng → hẹp**.\n\n"
            "**Thời gian**: *in* dùng cho khoảng dài (năm, tháng, mùa, buổi trong ngày) — *in 2025*, *in July*, "
            "*in the morning*. *on* dùng cho ngày cụ thể — *on Monday*, *on 5 May*. *at* dùng cho giờ và "
            "thời điểm — *at 7 o'clock*, *at night*.\n\n"
            "**Nơi chốn**: *in* là bên trong một không gian — *in the room*, *in Vietnam*. *on* là trên một bề mặt — "
            "*on the table*, *on the wall*. *at* là một điểm hoặc địa chỉ cụ thể — *at the bus stop*, *at 5 Le Loi Street*.\n\n"
            "Có ngoại lệ cần thuộc riêng: *at night* (không phải *in*), *on the weekend* (Mỹ) / *at the weekend* (Anh)."
        ),
        "patterns": [
            {"form": "in + năm/tháng/mùa", "example": "in 2026, in April, in summer", "vi": "vào năm 2026, tháng Tư"},
            {"form": "on + thứ/ngày", "example": "on Monday, on 5 May", "vi": "vào thứ Hai"},
            {"form": "at + giờ", "example": "at 6 p.m., at noon", "vi": "lúc 6 giờ chiều"},
            {"form": "in / on / at (nơi chốn)", "example": "in the box, on the desk, at the door", "vi": "trong hộp, trên bàn, ở cửa"},
        ],
        "match": [r"\bat \d+ (o'clock|a\.m\.|p\.m\.)", r"\bin (the morning|the afternoon|the evening)\b", r"\bon (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b"],
        "pitfallsVi": [
            "**Dịch “ở” thành in mọi lúc**: ✗ *I am in the bus stop.* → ✓ *at the bus stop*.",
            "**in the night**: ✓ *at night*.",
            "**Thừa giới từ với next/last/every**: ✗ *in next week* → ✓ *next week*.",
        ],
        "tipsVi": ["Hình dung: *in* = trong một khối, *on* = chạm một mặt phẳng, *at* = một chấm trên bản đồ."],
        "voaKeywords": ["preposition"],
    },
    {
        "slug": "adverbs-of-frequency",
        "titleVi": "Trạng từ tần suất",
        "titleEn": "Adverbs of frequency",
        "cefr": "A2",
        "category": "word-order",
        "cefrjCodes": ["ADV.freq"],
        "summaryVi": "Always, usually, often, sometimes, never — vị trí của chúng trong câu là điều cần nhớ.",
        "theoryVi": (
            "Trạng từ tần suất cho biết việc gì đó xảy ra bao nhiêu lần: *always* (100%), *usually*, *often*, "
            "*sometimes*, *rarely*, *never* (0%).\n\n"
            "Quy tắc vị trí rất gọn và không có ngoại lệ đáng kể: **trước động từ thường**, nhưng **sau động từ to be**. "
            "*I **always** get up early* / *He is **always** late*.\n\n"
            "Nếu câu có trợ động từ (*can*, *have*, *will*), trạng từ đứng **sau trợ động từ đầu tiên**: "
            "*I have **never** been to Japan*.\n\n"
            "Lưu ý: *never* đã mang nghĩa phủ định, nên không dùng thêm *not*."
        ),
        "patterns": [
            {"form": "chủ ngữ + trạng từ + động từ thường", "example": "She often walks to work.", "vi": "Cô ấy thường đi bộ đi làm."},
            {"form": "to be + trạng từ", "example": "They are never late.", "vi": "Họ không bao giờ đến muộn."},
            {"form": "trợ động từ + trạng từ + V", "example": "I have never eaten durian.", "vi": "Tôi chưa bao giờ ăn sầu riêng."},
        ],
        "match": [r"\b(always|usually|often|sometimes|rarely|seldom|never) [a-z]+\b"],
        "pitfallsVi": [
            "**Đặt sai vị trí**: ✗ *I go always to school.* → ✓ *I always go to school.*",
            "**Phủ định kép**: ✗ *I don't never go.* → ✓ *I never go.*",
        ],
        "tipsVi": ["Một câu để nhớ: “Trước động từ thường, sau to be.”"],
        "voaKeywords": ["adverbs of frequency", "adverb"],
    },
    # ---------------------------------------------------------------- B1 ----
    {
        "slug": "present-perfect",
        "titleVi": "Thì hiện tại hoàn thành",
        "titleEn": "Present perfect",
        "cefr": "B1",
        "category": "tense",
        "cefrjCodes": ["PERF.have_Ved"],
        "summaryVi": "Thì khó nhất với người Việt, vì tiếng Việt không có khái niệm “quá khứ còn liên quan đến hiện tại”.",
        "theoryVi": (
            "Hiện tại hoàn thành = **have/has + V3**. Đây là thì gây khó khăn nhất cho người Việt, vì tiếng Việt "
            "không phân biệt “đã làm xong rồi” với “đã làm và việc đó vẫn còn ảnh hưởng tới bây giờ”.\n\n"
            "Nguyên tắc cốt lõi: hiện tại hoàn thành nối **quá khứ với hiện tại**. Nó dùng khi:\n\n"
            "• Việc xảy ra trong quá khứ nhưng **thời điểm không quan trọng** — *I have read that book.*\n"
            "• Việc bắt đầu trong quá khứ và **vẫn còn tiếp tục** — *I have lived here for ten years.*\n"
            "• Việc vừa xảy ra và **kết quả còn thấy được** — *She has broken her leg.* (chân vẫn đang gãy)\n\n"
            "Ngược lại, **quá khứ đơn** dùng khi có mốc thời gian đã đóng lại: *yesterday*, *in 2020*, *last week*. "
            "Nguyên tắc kiểm tra nhanh: nếu trong câu có mốc thời gian quá khứ cụ thể thì **không** dùng hiện tại hoàn thành.\n\n"
            "*for* đi với khoảng thời gian (*for three years*), *since* đi với mốc bắt đầu (*since 2020*)."
        ),
        "patterns": [
            {"form": "have/has + V3", "example": "I have finished my homework.", "vi": "Tôi làm xong bài tập rồi."},
            {"form": "for + khoảng thời gian", "example": "She has worked here for five years.", "vi": "Cô ấy làm ở đây được năm năm."},
            {"form": "since + mốc thời gian", "example": "We have known each other since 2019.", "vi": "Chúng tôi quen nhau từ 2019."},
            {"form": "never / ever", "example": "Have you ever been to Japan?", "vi": "Bạn đã từng đến Nhật chưa?"},
        ],
        "match": [r"\b(have|has|haven't|hasn't) (never |ever |just |already |not )?[a-z]+(ed|en)\b", r"\bsince \d{4}\b", r"\bfor (two|three|four|five|ten|many) years\b"],
        "pitfallsVi": [
            "**Dùng với mốc thời gian quá khứ**: ✗ *I have seen him yesterday.* → ✓ *I saw him yesterday.*",
            "**Dùng quá khứ đơn cho việc còn tiếp diễn**: ✗ *I lived here for ten years* (và vẫn sống) → ✓ *I have lived here for ten years.*",
            "**Nhầm for và since**: ✗ *for 2020* → ✓ *since 2020*.",
        ],
        "tipsVi": [
            "Quy tắc kiểm tra: tìm mốc thời gian quá khứ trong câu. Có → quá khứ đơn. Không → cân nhắc hiện tại hoàn thành.",
            "*since* + một **điểm**, *for* + một **đoạn**.",
        ],
        "voaKeywords": ["present perfect", "perfect tense"],
    },
    {
        "slug": "past-continuous",
        "titleVi": "Thì quá khứ tiếp diễn",
        "titleEn": "Past continuous",
        "cefr": "B1",
        "category": "tense",
        "cefrjCodes": ["PROG.was_Ving"],
        "summaryVi": "Bối cảnh đang diễn ra thì một việc khác cắt ngang — cặp thì kinh điển trong kể chuyện.",
        "theoryVi": (
            "Quá khứ tiếp diễn = **was/were + V-ing**. Nó mô tả một hành động **đang diễn ra** tại một thời "
            "điểm trong quá khứ, thường làm **nền** cho một hành động khác xảy ra chen vào.\n\n"
            "Cặp thì này gần như luôn đi cùng nhau trong kể chuyện: hành động dài dùng quá khứ tiếp diễn, "
            "hành động ngắn cắt ngang dùng quá khứ đơn, nối bằng *when* hoặc *while*.\n\n"
            "*While* thường đi với hành động dài (*While I was cooking…*), *when* thường đi với hành động ngắn "
            "(*…when the phone rang*)."
        ),
        "patterns": [
            {"form": "was/were + V-ing", "example": "I was watching TV at nine last night.", "vi": "Chín giờ tối qua tôi đang xem TV."},
            {"form": "was V-ing when + quá khứ đơn", "example": "She was cooking when I arrived.", "vi": "Cô ấy đang nấu ăn thì tôi đến."},
            {"form": "While + was V-ing", "example": "While we were talking, it started to rain.", "vi": "Trong lúc chúng tôi nói chuyện thì trời bắt đầu mưa."},
        ],
        "match": [r"\b(was|were) [a-z]+ing\b", r"\bwhile (I|he|she|they|we) (was|were)\b"],
        "pitfallsVi": [
            "**Dùng quá khứ đơn cho cả hai vế**: ✗ *I watched TV when he came.* (nếu ý là đang xem) → ✓ *I was watching TV when he came.*",
            "**Dùng tiếp diễn với động từ trạng thái**: ✗ *I was knowing.* → ✓ *I knew.*",
        ],
        "tipsVi": ["Vẽ một đường thẳng dài (tiếp diễn) và một dấu × cắt ngang (quá khứ đơn). Hình đó đúng cho hầu hết các câu."],
        "voaKeywords": ["past continuous", "past progressive"],
    },
    {
        "slug": "conditionals-0-1-2",
        "titleVi": "Câu điều kiện loại 0, 1 và 2",
        "titleEn": "Conditionals: zero, first and second",
        "cefr": "B1",
        "category": "conditional",
        "cefrjCodes": ["COND.if_present", "COND.if_past"],
        "summaryVi": "“Nếu … thì …”. Cái khó không phải nghĩa mà là thì của động từ ở mỗi vế.",
        "theoryVi": (
            "Tiếng Việt chỉ cần “nếu … thì …” và động từ không đổi. Tiếng Anh đổi thì ở cả hai vế, "
            "và mỗi loại điều kiện mang một mức độ **thực tế** khác nhau.\n\n"
            "**Loại 0** — sự thật luôn đúng: *If you heat water to 100°C, it boils.* Cả hai vế đều hiện tại đơn.\n\n"
            "**Loại 1** — điều kiện có thật, có thể xảy ra: *If it rains, I will stay home.* "
            "Vế *if* dùng **hiện tại đơn**, vế chính dùng **will**. Lỗi kinh điển là viết *If it will rain* — "
            "sau *if* không dùng *will*.\n\n"
            "**Loại 2** — điều kiện **không có thật** ở hiện tại, hoặc rất khó xảy ra: "
            "*If I had a car, I would drive to Da Lat.* Vế *if* dùng **quá khứ đơn**, vế chính dùng **would**. "
            "Với động từ to be, dùng *were* cho mọi ngôi: *If I were you…*\n\n"
            "Hai vế có thể đảo thứ tự; khi vế *if* đứng trước thì có dấu phẩy ngăn cách."
        ),
        "patterns": [
            {"form": "Loại 0: If + hiện tại, hiện tại", "example": "If you press this, the light turns on.", "vi": "Nếu bấm nút này thì đèn sáng."},
            {"form": "Loại 1: If + hiện tại, will + V", "example": "If you study, you will pass.", "vi": "Nếu bạn học thì bạn sẽ đỗ."},
            {"form": "Loại 2: If + quá khứ, would + V", "example": "If I were rich, I would travel the world.", "vi": "Nếu tôi giàu thì tôi sẽ đi khắp thế giới."},
        ],
        "match": [r"\bIf (I|you|he|she|we|they) [a-z]+,", r"\bwould [a-z]+\b", r"\bIf I were\b"],
        "pitfallsVi": [
            "**will sau if ở loại 1**: ✗ *If it will rain…* → ✓ *If it rains…*",
            "**Dùng loại 1 cho điều không có thật**: ✗ *If I am you, I will go.* → ✓ *If I were you, I would go.*",
            "**Quên would ở vế chính loại 2**: ✗ *If I had money, I buy a car.* → ✓ *…I would buy a car.*",
        ],
        "tipsVi": [
            "Ghi nhớ theo cặp: loại 1 = **hiện tại + will**; loại 2 = **quá khứ + would**. Lùi một thì thì thêm chữ “would”.",
            "*If I were you* là câu khuyên thông dụng nhất — học thuộc nguyên câu.",
        ],
        "voaKeywords": ["conditional", "if clause"],
    },
    {
        "slug": "passive-voice",
        "titleVi": "Câu bị động",
        "titleEn": "The passive voice",
        "cefr": "B1",
        "category": "voice",
        "cefrjCodes": ["PASS.be_Ved"],
        "summaryVi": "Tiếng Việt dùng “được” và “bị”; tiếng Anh dùng be + V3 và không phân biệt tốt hay xấu.",
        "theoryVi": (
            "Bị động = **be + V3 (quá khứ phân từ)**. Ta dùng nó khi **người thực hiện không quan trọng**, "
            "không biết, hoặc đã quá hiển nhiên: *The bridge was built in 1990.*\n\n"
            "Tiếng Việt có hai từ: “**được**” cho việc tốt và “**bị**” cho việc xấu. Tiếng Anh **không phân biệt** — "
            "cùng một cấu trúc dùng cho cả *She was promoted* và *He was fired*. Người học đôi khi tìm hai cấu trúc "
            "khác nhau và không thấy.\n\n"
            "Thì của câu nằm ở động từ **be**, còn động từ chính luôn ở **V3**: *is written*, *was written*, "
            "*has been written*, *will be written*.\n\n"
            "Nếu cần nêu người thực hiện, thêm **by**: *The letter was written by Lan.* Nhưng phần lớn câu bị động "
            "trong thực tế **không có** *by*, vì đó chính là lý do người ta dùng bị động."
        ),
        "patterns": [
            {"form": "is/are + V3", "example": "English is spoken here.", "vi": "Ở đây người ta nói tiếng Anh."},
            {"form": "was/were + V3", "example": "The house was built in 2010.", "vi": "Ngôi nhà được xây năm 2010."},
            {"form": "has/have been + V3", "example": "The report has been sent.", "vi": "Báo cáo đã được gửi."},
            {"form": "will be + V3", "example": "The results will be announced tomorrow.", "vi": "Kết quả sẽ được công bố vào ngày mai."},
        ],
        "match": [r"\b(is|are|was|were|been|be) [a-z]+ed by\b", r"\b(was|were) (built|made|written|sent|given|taken|found|used)\b"],
        "pitfallsVi": [
            "**Quên be**: ✗ *The book written by him.* → ✓ *The book was written by him.*",
            "**Dùng V2 thay V3**: ✗ *was wrote* → ✓ *was written*.",
            "**Bị động hoá động từ nội động**: *happen*, *arrive*, *die* không có dạng bị động.",
        ],
        "tipsVi": ["Muốn đổi sang bị động: đưa tân ngữ lên đầu, chia *be* đúng thì của động từ cũ, đổi động từ chính sang V3."],
        "voaKeywords": ["passive", "passive voice"],
    },
    {
        "slug": "relative-clauses",
        "titleVi": "Mệnh đề quan hệ",
        "titleEn": "Relative clauses",
        "cefr": "B1",
        "category": "clause",
        "cefrjCodes": ["REL.who", "REL.which", "REL.that"],
        "summaryVi": "Dùng who, which, that để nối hai câu ngắn thành một câu dài, thay vì lặp lại danh từ.",
        "theoryVi": (
            "Mệnh đề quan hệ giúp thêm thông tin cho một danh từ mà không phải viết câu mới. "
            "Tiếng Việt làm việc này bằng cách đặt cụm bổ nghĩa **sau** danh từ, không cần từ nối: "
            "“người đàn ông **sống cạnh nhà tôi**”. Tiếng Anh **bắt buộc** có đại từ quan hệ: "
            "*the man **who** lives next door*.\n\n"
            "Chọn đại từ theo loại danh từ: **who** cho người, **which** cho vật, **that** cho cả hai "
            "(nhưng chỉ trong mệnh đề xác định), **whose** cho sở hữu, **where** cho nơi chốn.\n\n"
            "Có hai loại mệnh đề. **Xác định** (không có dấu phẩy) cho biết đang nói về cái nào — bỏ đi thì câu "
            "mất nghĩa. **Không xác định** (có dấu phẩy) chỉ thêm thông tin phụ, và **không dùng được** *that*.\n\n"
            "Khi đại từ quan hệ đóng vai **tân ngữ**, có thể lược bỏ: *the book (which) I bought*."
        ),
        "patterns": [
            {"form": "người + who", "example": "The woman who teaches us is from Hue.", "vi": "Cô giáo dạy chúng tôi quê ở Huế."},
            {"form": "vật + which/that", "example": "The bike that I bought is red.", "vi": "Chiếc xe tôi mua màu đỏ."},
            {"form": "whose (sở hữu)", "example": "The boy whose father is a doctor…", "vi": "Cậu bé có bố là bác sĩ…"},
            {"form": "Không xác định (có phẩy)", "example": "My brother, who lives in Hue, is a teacher.", "vi": "Anh tôi, người sống ở Huế, là giáo viên."},
        ],
        "match": [r"\b(who|which|that|whose|where) (is|are|was|were|has|have|lives|works)\b", r"\bthe (man|woman|person|book|house) (who|which|that)\b"],
        "pitfallsVi": [
            "**Lặp lại chủ ngữ**: ✗ *The man who he lives next door…* → ✓ *The man who lives next door…*",
            "**Dùng that sau dấu phẩy**: ✗ *My brother, that lives in Hue…* → ✓ *…, who lives in Hue…*",
            "**Dùng which cho người**: ✗ *the girl which* → ✓ *the girl who*.",
        ],
        "tipsVi": ["Sau đại từ quan hệ, **không** viết lại chủ ngữ nữa — chính đại từ đó đã là chủ ngữ rồi."],
        "voaKeywords": ["relative clause", "who which that"],
    },
    {
        "slug": "reported-speech",
        "titleVi": "Câu tường thuật",
        "titleEn": "Reported speech",
        "cefr": "B1",
        "category": "reported",
        "cefrjCodes": ["REP.said_that"],
        "summaryVi": "Khi thuật lại lời người khác, thì lùi lại một bậc và đại từ, thời gian, nơi chốn đều đổi theo.",
        "theoryVi": (
            "Khi thuật lại lời nói của người khác, tiếng Anh **lùi thì** một bậc — điều mà tiếng Việt không làm. "
            "Người Việt nói “Anh ấy nói anh ấy **bận**”, giữ nguyên động từ; tiếng Anh thành "
            "*He said he **was** busy*.\n\n"
            "Bảng lùi thì: hiện tại đơn → quá khứ đơn; hiện tại tiếp diễn → quá khứ tiếp diễn; "
            "quá khứ đơn → quá khứ hoàn thành; *will* → *would*; *can* → *could*.\n\n"
            "Đại từ và từ chỉ thời gian/nơi chốn cũng đổi theo góc nhìn: *I → he/she*, *my → his/her*, "
            "*now → then*, *today → that day*, *tomorrow → the next day*, *here → there*.\n\n"
            "Câu hỏi tường thuật **không đảo ngữ** và **không có dấu hỏi**: "
            "*He asked where I lived* — không phải *where did I live*.\n\n"
            "Ngoại lệ hữu ích: nếu điều được nói **vẫn còn đúng** thì có thể giữ nguyên thì: "
            "*She said she lives in Hanoi* (và cô ấy vẫn sống ở đó)."
        ),
        "patterns": [
            {"form": "said (that) + mệnh đề lùi thì", "example": "He said he was tired.", "vi": "Anh ấy nói anh ấy mệt."},
            {"form": "told + người + that", "example": "She told me she would come.", "vi": "Cô ấy bảo tôi cô ấy sẽ đến."},
            {"form": "asked + if/whether", "example": "He asked if I was ready.", "vi": "Anh ấy hỏi tôi đã sẵn sàng chưa."},
            {"form": "asked + từ để hỏi (không đảo ngữ)", "example": "She asked where I lived.", "vi": "Cô ấy hỏi tôi sống ở đâu."},
        ],
        "match": [r"\b(said|told|asked) (that |me |him |her |us |them )?(he|she|I|they|we)\b", r"\basked (if|whether)\b"],
        "pitfallsVi": [
            "**Không lùi thì**: ✗ *He said he is tired.* → ✓ *He said he was tired.*",
            "**Đảo ngữ trong câu hỏi tường thuật**: ✗ *She asked where did I live.* → ✓ *She asked where I lived.*",
            "**Nhầm say và tell**: *tell* bắt buộc có tân ngữ người (*tell me*), *say* thì không (*say that*).",
        ],
        "tipsVi": ["Nhớ ba việc phải đổi: **thì**, **đại từ**, **thời gian/nơi chốn**. Thiếu một trong ba là câu sai."],
        "voaKeywords": ["reported speech", "indirect speech"],
    },
    {
        "slug": "gerund-infinitive",
        "titleVi": "Danh động từ và động từ nguyên thể",
        "titleEn": "Gerunds and infinitives",
        "cefr": "B1",
        "category": "verb-pattern",
        "cefrjCodes": ["VP.V_ing", "VP.V_to_V"],
        "summaryVi": "Sau một động từ thì dùng V-ing hay to V? Không có quy tắc chung — phải học theo nhóm.",
        "theoryVi": (
            "Tiếng Việt nối hai động từ trực tiếp: “tôi thích **đọc** sách”, “tôi muốn **đi**”. "
            "Tiếng Anh bắt buộc chọn giữa **V-ing** và **to + V**, và lựa chọn phụ thuộc vào **động từ đứng trước**.\n\n"
            "**Theo sau bằng V-ing**: enjoy, finish, avoid, mind, suggest, practise, keep, consider, "
            "và **mọi giới từ** (*good at swimming*, *interested in learning*).\n\n"
            "**Theo sau bằng to + V**: want, need, decide, hope, plan, promise, agree, learn, offer, refuse.\n\n"
            "**Cả hai đều được, nghĩa không đổi**: begin, start, continue, like, love, hate.\n\n"
            "**Cả hai được nhưng nghĩa khác nhau** — nhóm đáng chú ý nhất: "
            "*stop smoking* (bỏ thuốc) ≠ *stop to smoke* (dừng lại để hút); "
            "*remember locking the door* (nhớ là đã khoá) ≠ *remember to lock the door* (nhớ mà khoá)."
        ),
        "patterns": [
            {"form": "enjoy / finish / avoid + V-ing", "example": "I enjoy reading books.", "vi": "Tôi thích đọc sách."},
            {"form": "want / decide / hope + to V", "example": "She decided to study abroad.", "vi": "Cô ấy quyết định đi du học."},
            {"form": "giới từ + V-ing", "example": "He is good at cooking.", "vi": "Anh ấy nấu ăn giỏi."},
            {"form": "stop + V-ing / to V", "example": "He stopped smoking. / He stopped to smoke.", "vi": "Anh ấy bỏ thuốc. / Anh ấy dừng lại để hút thuốc."},
        ],
        "match": [r"\b(enjoy|enjoyed|finish|finished|avoid|mind|suggest|practise|practiced|keep|kept) [a-z]+ing\b", r"\b(want|wanted|decide|decided|hope|hoped|plan|planned|need|needed|agree|agreed) to [a-z]+\b"],
        "pitfallsVi": [
            "**Dùng nguyên thể sau giới từ**: ✗ *good at to swim* → ✓ *good at swimming*.",
            "**Dùng V-ing sau want**: ✗ *I want going.* → ✓ *I want to go.*",
            "**Nối trực tiếp hai động từ**: ✗ *I like read.* → ✓ *I like reading* hoặc *I like to read*.",
        ],
        "tipsVi": [
            "Học theo nhóm động từ chứ đừng học từng từ lẻ. Ba nhóm chính, mỗi nhóm khoảng mười từ.",
            "Sau **mọi** giới từ (*at, in, on, of, about, for*) luôn là V-ing. Quy tắc này không có ngoại lệ.",
        ],
        "voaKeywords": ["gerund", "infinitive"],
    },
    {
        "slug": "quantifiers",
        "titleVi": "Lượng từ: some, any, much, many, a few, a little",
        "titleEn": "Quantifiers",
        "cefr": "B1",
        "category": "noun",
        "cefrjCodes": ["QNT.some_any", "QNT.much_many"],
        "summaryVi": "Chọn lượng từ nào phụ thuộc vào danh từ đếm được hay không — một phân biệt tiếng Việt không có.",
        "theoryVi": (
            "Tiếng Việt dùng “nhiều”, “một ít”, “vài” cho mọi loại danh từ. Tiếng Anh chia đôi: "
            "**đếm được** (books, people, cars) và **không đếm được** (water, money, information, advice).\n\n"
            "**many** + đếm được, **much** + không đếm được. Trong câu khẳng định, người bản xứ thường "
            "thay cả hai bằng *a lot of* — *much* trong câu khẳng định nghe hơi trang trọng.\n\n"
            "**a few** + đếm được, **a little** + không đếm được — cả hai mang nghĩa tích cực “có một ít”. "
            "Bỏ mạo từ *a* đi thì nghĩa đổi hẳn: *few* / *little* nghĩa là “rất ít, gần như không có”.\n\n"
            "**some** dùng trong câu khẳng định và trong lời mời/đề nghị; **any** dùng trong câu phủ định và nghi vấn."
        ),
        "patterns": [
            {"form": "many + danh từ số nhiều", "example": "many students", "vi": "nhiều học sinh"},
            {"form": "much + không đếm được", "example": "much time", "vi": "nhiều thời gian"},
            {"form": "a few / a little", "example": "a few friends / a little water", "vi": "vài người bạn / một ít nước"},
            {"form": "some / any", "example": "I have some money. / I don't have any money.", "vi": "Tôi có ít tiền. / Tôi không có tiền."},
        ],
        "match": [r"\b(many|much|a few|a little|some|any) [a-z]+\b"],
        "pitfallsVi": [
            "**many với danh từ không đếm được**: ✗ *many informations* → ✓ *much information*.",
            "**some trong câu phủ định**: ✗ *I don't have some money.* → ✓ *any money*.",
            "**Nhầm a few và few**: *a few friends* = có vài người bạn; *few friends* = hầu như không có bạn nào.",
        ],
        "tipsVi": ["Trước khi chọn lượng từ, hỏi: “Danh từ này đếm được không?” Trả lời xong thì lựa chọn chỉ còn một."],
        "voaKeywords": ["quantifier", "much many", "some any"],
    },
    # ---------------------------------------------------------------- B2 ----
    {
        "slug": "present-perfect-continuous",
        "titleVi": "Thì hiện tại hoàn thành tiếp diễn",
        "titleEn": "Present perfect continuous",
        "cefr": "B2",
        "category": "tense",
        "cefrjCodes": ["PERF.have_been_Ving"],
        "summaryVi": "Nhấn vào quá trình kéo dài, không phải kết quả — khác biệt tinh tế với hiện tại hoàn thành.",
        "theoryVi": (
            "**have/has been + V-ing** nhấn mạnh **khoảng thời gian** và **quá trình**, trong khi hiện tại "
            "hoàn thành đơn nhấn mạnh **kết quả**.\n\n"
            "So sánh: *I have painted the kitchen* (xong rồi, nhìn thấy kết quả) và "
            "*I have been painting the kitchen* (nên tay tôi đầy sơn — nhấn vào việc tôi đã làm suốt nãy giờ).\n\n"
            "Thì này rất hay dùng để giải thích một tình trạng hiện tại: *Your eyes are red — have you been crying?*\n\n"
            "Các động từ trạng thái (*know, be, have* nghĩa sở hữu) không dùng ở dạng tiếp diễn."
        ),
        "patterns": [
            {"form": "have/has been + V-ing", "example": "I have been studying English for three years.", "vi": "Tôi học tiếng Anh được ba năm rồi."},
            {"form": "Giải thích tình trạng hiện tại", "example": "She's tired. She has been working all day.", "vi": "Cô ấy mệt vì làm việc cả ngày."},
        ],
        "match": [r"\b(have|has|'ve|'s) been [a-z]+ing\b"],
        "pitfallsVi": [
            "**Dùng với động từ trạng thái**: ✗ *I have been knowing him.* → ✓ *I have known him.*",
            "**Nhầm với hiện tại hoàn thành khi cần nói kết quả**: nếu nhấn vào “xong bao nhiêu” thì dùng dạng đơn.",
        ],
        "tipsVi": ["Hỏi: mình muốn nói **bao lâu** hay **bao nhiêu**? “Bao lâu” → tiếp diễn. “Bao nhiêu” → đơn."],
        "voaKeywords": ["present perfect continuous"],
    },
    {
        "slug": "past-perfect",
        "titleVi": "Thì quá khứ hoàn thành",
        "titleEn": "Past perfect",
        "cefr": "B2",
        "category": "tense",
        "cefrjCodes": ["PERF.had_Ved"],
        "summaryVi": "Việc xảy ra trước một việc quá khứ khác — cần khi thứ tự thời gian không theo thứ tự kể.",
        "theoryVi": (
            "**had + V3** đánh dấu việc xảy ra **trước** một mốc quá khứ khác. Nó chỉ cần thiết khi "
            "thứ tự kể **khác** thứ tự xảy ra; nếu bạn kể đúng trình tự thì quá khứ đơn là đủ.\n\n"
            "*When I arrived, the train had left.* — tàu rời đi trước, tôi đến sau, nhưng câu kể ngược lại, "
            "nên phải dùng quá khứ hoàn thành để người nghe biết cái nào trước.\n\n"
            "So sánh: *When I arrived, the train left.* — tôi đến rồi tàu mới đi.\n\n"
            "Thì này cũng bắt buộc trong câu điều kiện loại 3 và trong tường thuật khi lời gốc đã ở quá khứ đơn."
        ),
        "patterns": [
            {"form": "had + V3", "example": "The film had already started when we arrived.", "vi": "Phim đã bắt đầu khi chúng tôi đến."},
            {"form": "After + had V3, quá khứ đơn", "example": "After she had finished, she went home.", "vi": "Sau khi làm xong, cô ấy về nhà."},
        ],
        "match": [r"\bhad (already |just |never |not )?[a-z]+(ed|en)\b", r"\bhad (gone|been|seen|done|left|taken|written)\b"],
        "pitfallsVi": [
            "**Dùng quá khứ hoàn thành cho mọi việc quá khứ**: chỉ dùng khi cần chỉ rõ cái nào xảy ra trước.",
            "**Quên had trong câu điều kiện loại 3**: ✗ *If I knew, I would have come.* → ✓ *If I had known…*",
        ],
        "tipsVi": ["Vẽ hai mốc trên trục thời gian. Cái xa hơn về quá khứ dùng *had + V3*."],
        "voaKeywords": ["past perfect"],
    },
    {
        "slug": "conditionals-3-mixed",
        "titleVi": "Câu điều kiện loại 3 và điều kiện hỗn hợp",
        "titleEn": "Third and mixed conditionals",
        "cefr": "B2",
        "category": "conditional",
        "cefrjCodes": ["COND.if_had_Ved"],
        "summaryVi": "Nói về điều đã không xảy ra trong quá khứ — thường mang sắc thái tiếc nuối.",
        "theoryVi": (
            "**Loại 3** nói về quá khứ **trái với thực tế**: *If I had studied harder, I would have passed.* "
            "(Thực tế: tôi đã không học chăm và đã trượt.) Công thức: "
            "**If + had + V3, would have + V3**.\n\n"
            "**Điều kiện hỗn hợp** ghép hai mốc thời gian: nguyên nhân ở quá khứ, hậu quả ở hiện tại. "
            "*If I had taken that job, I would be in Singapore now.*\n\n"
            "Cấu trúc này thường mang sắc thái **tiếc nuối** hoặc **trách móc**, nên trong giao tiếp cần cân nhắc giọng điệu."
        ),
        "patterns": [
            {"form": "If + had V3, would have V3", "example": "If we had left earlier, we would have caught the train.", "vi": "Nếu đi sớm hơn thì chúng ta đã kịp tàu."},
            {"form": "Hỗn hợp: If + had V3, would + V", "example": "If I had learnt English earlier, I would have a better job now.", "vi": "Nếu học tiếng Anh sớm hơn thì giờ tôi đã có việc tốt hơn."},
        ],
        "match": [r"\bIf .* had [a-z]+(ed|en)\b", r"\bwould have [a-z]+(ed|en)\b"],
        "pitfallsVi": [
            "**Dùng would have ở vế if**: ✗ *If I would have known…* → ✓ *If I had known…*",
            "**Lẫn loại 2 và loại 3**: loại 2 nói về hiện tại, loại 3 nói về quá khứ.",
        ],
        "tipsVi": ["Loại 3 luôn có **hai** chữ *had*/*have*: một ở vế if, một ở vế chính."],
        "voaKeywords": ["third conditional", "conditional"],
    },
    {
        "slug": "linking-words",
        "titleVi": "Từ nối và liên kết ý",
        "titleEn": "Linking words and connectors",
        "cefr": "B2",
        "category": "discourse",
        "cefrjCodes": ["CONJ.however", "CONJ.although"],
        "summaryVi": "Điểm khác nhau giữa although, however, despite nằm ở loại từ đi sau, không phải ở nghĩa.",
        "theoryVi": (
            "Ba từ *although*, *however*, *despite* đều có nghĩa gần “tuy nhiên / mặc dù”, nhưng "
            "**ngữ pháp đi sau chúng khác nhau** — và đó mới là chỗ sai.\n\n"
            "**Although / though / even though** + **mệnh đề** (có chủ ngữ và động từ): "
            "*Although it was raining, we went out.*\n\n"
            "**Despite / in spite of** + **danh từ hoặc V-ing**: *Despite the rain, we went out.* "
            "Muốn dùng mệnh đề sau chúng thì phải thêm *the fact that*.\n\n"
            "**However / nevertheless** là **trạng từ nối hai câu**, đứng đầu câu và có dấu phẩy: "
            "*It was raining. However, we went out.*\n\n"
            "Trong bài viết học thuật (IELTS Writing, TOEFL), dùng đúng nhóm này là một trong những "
            "tiêu chí chấm điểm mạch lạc."
        ),
        "patterns": [
            {"form": "Although + mệnh đề", "example": "Although he was tired, he kept working.", "vi": "Mặc dù mệt, anh ấy vẫn làm tiếp."},
            {"form": "Despite + danh từ / V-ing", "example": "Despite being tired, he kept working.", "vi": "Dù mệt, anh ấy vẫn làm tiếp."},
            {"form": "However, + câu", "example": "He was tired. However, he kept working.", "vi": "Anh ấy mệt. Tuy nhiên, anh ấy vẫn làm tiếp."},
            {"form": "Nguyên nhân – kết quả", "example": "Therefore / As a result / Consequently", "vi": "Do đó / Kết quả là"},
        ],
        "match": [r"\b(Although|although|However|however|Despite|despite|Nevertheless|Therefore|Moreover|Furthermore)\b"],
        "pitfallsVi": [
            "**Despite + mệnh đề**: ✗ *Despite it was raining…* → ✓ *Despite the rain…* hoặc *Although it was raining…*",
            "**However nối hai mệnh đề bằng dấu phẩy**: ✗ *He was tired, however he worked.* → ✓ *He was tired. However, he worked.*",
            "**Dùng cả although và but**: ✗ *Although it rained, but we went.* → chỉ dùng một.",
        ],
        "tipsVi": ["Nhớ theo loại từ đi sau: *although* + **câu**; *despite* + **danh từ**; *however* + **dấu phẩy**."],
        "voaKeywords": ["although", "however", "linking words", "conjunction"],
    },
    {
        "slug": "phrasal-verbs",
        "titleVi": "Cụm động từ (phrasal verbs)",
        "titleEn": "Phrasal verbs",
        "cefr": "B2",
        "category": "vocabulary-grammar",
        "cefrjCodes": ["VP.V_prt"],
        "summaryVi": "Nghĩa của cụm không suy ra được từ nghĩa từng từ — phải học nguyên cụm như một từ mới.",
        "theoryVi": (
            "Cụm động từ = động từ + tiểu từ (*up, out, on, off, in, down*). Nghĩa của cụm thường "
            "**không liên quan** đến nghĩa gốc: *give up* không phải “cho lên” mà là “từ bỏ”.\n\n"
            "Đây là phần khiến người học nghe hiểu người bản xứ rất vất vả, vì hội thoại đời thường dùng "
            "cụm động từ nhiều hơn dùng động từ trang trọng: người ta nói *put off* chứ ít khi nói *postpone*.\n\n"
            "Về ngữ pháp, có hai loại. Cụm **tách được**: tân ngữ có thể đứng giữa (*turn the light off* "
            "hoặc *turn off the light*), và nếu tân ngữ là **đại từ** thì **bắt buộc** đứng giữa: "
            "*turn it off*, không phải *turn off it*. Cụm **không tách được**: tân ngữ luôn đứng sau "
            "cả cụm (*look after the baby*)."
        ),
        "patterns": [
            {"form": "give up", "example": "He gave up smoking.", "vi": "Anh ấy bỏ thuốc."},
            {"form": "look after", "example": "She looks after her grandmother.", "vi": "Cô ấy chăm sóc bà."},
            {"form": "tách được + đại từ", "example": "Turn it off, please.", "vi": "Làm ơn tắt nó đi."},
            {"form": "find out", "example": "I found out the truth.", "vi": "Tôi phát hiện ra sự thật."},
        ],
        "match": [r"\b(give|gave|look|looked|turn|turned|put|find|found|get|got|take|took|come|came|go|went|pick|picked) (up|out|on|off|in|down|after|over|through|away|back)\b"],
        "pitfallsVi": [
            "**Đặt đại từ sau tiểu từ**: ✗ *turn off it* → ✓ *turn it off*.",
            "**Dịch từng từ**: *look after* không phải “nhìn sau”.",
        ],
        "tipsVi": [
            "Học cụm động từ theo **chủ đề** (công việc, du lịch, quan hệ) chứ đừng học theo bảng chữ cái.",
            "Ghi cả câu ví dụ, không ghi mỗi cụm — vị trí tân ngữ nằm trong câu ví dụ đó.",
        ],
        "voaKeywords": ["phrasal verb"],
    },
    {
        "slug": "used-to-would",
        "titleVi": "Used to, be used to và would",
        "titleEn": "Used to, be used to, would",
        "cefr": "B2",
        "category": "verb-pattern",
        "cefrjCodes": ["MOD.used_to"],
        "summaryVi": "Ba cấu trúc trông giống nhau nhưng nghĩa hoàn toàn khác — khác biệt nằm ở chữ “be” và ở dạng từ đi sau.",
        "theoryVi": (
            "**used to + V** = thói quen trong quá khứ, **nay không còn**: *I used to smoke.* "
            "(Trước tôi hút thuốc, giờ thì không.)\n\n"
            "**be used to + V-ing / danh từ** = **đã quen** với điều gì: *I am used to getting up early.* "
            "(Việc dậy sớm với tôi là bình thường.) Chú ý sau đây là **V-ing**, không phải nguyên thể.\n\n"
            "**would + V** cũng diễn tả thói quen quá khứ, nhưng chỉ dùng cho **hành động lặp lại**, "
            "không dùng cho **trạng thái**: ✓ *We would go swimming every summer*, nhưng ✗ *I would have a car* "
            "(phải là *I used to have a car*).\n\n"
            "Hai cấu trúc đầu chỉ khác nhau một chữ *be*, nên đọc kỹ trước khi chọn."
        ),
        "patterns": [
            {"form": "used to + V", "example": "I used to live in Da Nang.", "vi": "Trước đây tôi sống ở Đà Nẵng."},
            {"form": "be used to + V-ing", "example": "She is used to living alone.", "vi": "Cô ấy đã quen sống một mình."},
            {"form": "would + V (thói quen)", "example": "Every summer we would visit our grandparents.", "vi": "Mỗi mùa hè chúng tôi lại về thăm ông bà."},
        ],
        "match": [r"\bused to [a-z]+\b", r"\b(am|is|are|was|were) used to [a-z]+ing\b"],
        "pitfallsVi": [
            "**Nhầm hai cấu trúc**: ✗ *I am used to smoke.* → ✓ *I used to smoke* (thói quen cũ) hoặc *I am used to smoking* (đã quen).",
            "**would cho trạng thái**: ✗ *I would be shy.* → ✓ *I used to be shy.*",
        ],
        "tipsVi": ["Có chữ *be* → sau nó là **V-ing**. Không có *be* → sau nó là **nguyên thể**."],
        "voaKeywords": ["used to"],
    },
    {
        "slug": "articles-advanced",
        "titleVi": "Mạo từ nâng cao: tên riêng, khái niệm và trường hợp không dùng mạo từ",
        "titleEn": "Advanced article use",
        "cefr": "B2",
        "category": "article",
        "cefrjCodes": ["NP.zero_article"],
        "summaryVi": "Ở trình độ cao, lỗi mạo từ chuyển từ “quên” sang “dùng thừa” — nhất là với danh từ trừu tượng.",
        "theoryVi": (
            "Đến B2, người học Việt Nam ít khi quên mạo từ nữa, nhưng lại hay **dùng thừa** *the*. "
            "Nguyên tắc: *the* chỉ dùng khi đối tượng đã **xác định**.\n\n"
            "**Không dùng mạo từ** với: danh từ trừu tượng nói chung (*Education is important*), "
            "tên quốc gia (*Vietnam*, *Japan*), tên thành phố, tên ngôn ngữ (*English*), bữa ăn "
            "(*have breakfast*), phương tiện với *by* (*by bus*), và các cụm như *at home*, *at school*, *in bed*.\n\n"
            "**Dùng the** với: tên có chữ *of* hoặc dạng số nhiều (*the United States*, *the Philippines*), "
            "sông biển núi dãy (*the Mekong*, *the Alps*), thứ duy nhất (*the sun*), so sánh nhất "
            "(*the best*), và số thứ tự (*the first*).\n\n"
            "**a/an** khi phân loại nghề nghiệp: *She is an engineer.*"
        ),
        "patterns": [
            {"form": "không mạo từ + danh từ trừu tượng", "example": "Happiness is more important than money.", "vi": "Hạnh phúc quan trọng hơn tiền."},
            {"form": "the + tên số nhiều/của", "example": "the Netherlands, the Gulf of Tonkin", "vi": "Hà Lan, vịnh Bắc Bộ"},
            {"form": "không mạo từ trong cụm cố định", "example": "go to school, at home, by bus", "vi": "đi học, ở nhà, đi xe buýt"},
        ],
        "match": [r"\bthe (United States|Philippines|Netherlands|first|second|best|only|same)\b", r"\bby (bus|car|train|plane)\b", r"\bat (home|school|work)\b"],
        "pitfallsVi": [
            "**the + danh từ trừu tượng**: ✗ *The education is important.* → ✓ *Education is important.*",
            "**the + tên nước**: ✗ *the Vietnam* → ✓ *Vietnam*.",
            "**the trong cụm cố định**: ✗ *go to the school* (khi nói đi học) → ✓ *go to school*.",
        ],
        "tipsVi": ["Khi định viết *the* trước một danh từ trừu tượng, dừng lại hỏi: “Mình đang nói cái cụ thể nào?” Nếu không trả lời được thì bỏ *the* đi."],
        "voaKeywords": ["articles"],
    },
    # ---------------------------------------------------------------- C1 ----
    {
        "slug": "inversion",
        "titleVi": "Đảo ngữ",
        "titleEn": "Inversion",
        "cefr": "C1",
        "category": "word-order",
        "cefrjCodes": ["INV.neg_fronting"],
        "summaryVi": "Đưa từ phủ định lên đầu câu để nhấn mạnh — cấu trúc ghi điểm trong IELTS Writing và Speaking.",
        "theoryVi": (
            "Khi một trạng từ mang nghĩa **phủ định hoặc giới hạn** được đưa lên đầu câu, phần còn lại "
            "của câu phải **đảo ngữ** như câu hỏi.\n\n"
            "Các từ thường gặp: *never*, *rarely*, *seldom*, *hardly*, *scarcely*, *little*, *no sooner*, "
            "*not only*, *under no circumstances*, *only when*, *only after*.\n\n"
            "*Never have I seen such a beautiful sunset.* (thay vì *I have never seen…*)\n"
            "*Not only did she pass, but she also got the highest score.*\n\n"
            "Đảo ngữ cũng xuất hiện trong câu điều kiện khi lược bỏ *if*: "
            "*Had I known, I would have come* = *If I had known…*\n\n"
            "Đây là cấu trúc **trang trọng**. Dùng đúng một hai lần trong bài viết học thuật là điểm cộng; "
            "dùng liên tục trong hội thoại thường ngày thì nghe rất gượng."
        ),
        "patterns": [
            {"form": "Never + trợ động từ + chủ ngữ", "example": "Never have I heard such a story.", "vi": "Chưa bao giờ tôi nghe chuyện như vậy."},
            {"form": "Not only … but also", "example": "Not only did he apologise, but he also paid for the damage.", "vi": "Anh ấy không chỉ xin lỗi mà còn đền bù."},
            {"form": "Had + chủ ngữ + V3 (điều kiện lược if)", "example": "Had I known, I would have told you.", "vi": "Nếu biết thì tôi đã nói với bạn."},
        ],
        "match": [r"^(Never|Rarely|Seldom|Hardly|Little|Not only|No sooner) ", r"\bHad (I|he|she|we|they) [a-z]+(ed|en)\b"],
        "pitfallsVi": [
            "**Quên đảo ngữ**: ✗ *Never I have seen…* → ✓ *Never have I seen…*",
            "**Lạm dụng**: một bài viết 250 từ chỉ nên có một, cùng lắm hai câu đảo ngữ.",
        ],
        "tipsVi": ["Sau từ phủ định đứng đầu câu, viết tiếp **y như một câu hỏi**: trợ động từ trước, chủ ngữ sau."],
        "voaKeywords": ["inversion"],
    },
    {
        "slug": "cleft-sentences",
        "titleVi": "Câu chẻ (cleft sentences)",
        "titleEn": "Cleft sentences",
        "cefr": "C1",
        "category": "word-order",
        "cefrjCodes": ["CLEFT.it_is"],
        "summaryVi": "Tách câu ra để nhấn mạnh một thành phần — tiếng Việt làm bằng ngữ điệu, tiếng Anh làm bằng cấu trúc.",
        "theoryVi": (
            "Tiếng Việt nhấn mạnh chủ yếu bằng **ngữ điệu** và trợ từ (“chính là”, “mới”). Tiếng Anh viết "
            "thì không có ngữ điệu, nên dùng **cấu trúc** để nhấn mạnh.\n\n"
            "**It-cleft**: *It was Lan who called you.* — nhấn mạnh vào Lan chứ không phải người khác.\n\n"
            "**Wh-cleft** (pseudo-cleft): *What I need is a holiday.* — nhấn mạnh vào điều mình cần.\n\n"
            "**All-cleft**: *All I want is a quiet evening.*\n\n"
            "Cấu trúc này rất hữu ích trong IELTS Speaking Part 3 và trong văn viết học thuật, vì nó "
            "cho phép bạn điều khiển trọng tâm thông tin của câu."
        ),
        "patterns": [
            {"form": "It + be + thành phần nhấn + who/that", "example": "It was the rain that ruined the trip.", "vi": "Chính cơn mưa đã làm hỏng chuyến đi."},
            {"form": "What + mệnh đề + be", "example": "What surprised me was his answer.", "vi": "Điều làm tôi ngạc nhiên là câu trả lời của anh ấy."},
            {"form": "All + mệnh đề + be", "example": "All I want is to sleep.", "vi": "Tất cả những gì tôi muốn là được ngủ."},
        ],
        "match": [r"\bIt (was|is) [a-z A-Z]+ (who|that) \b", r"^What (I|he|she|they|we) [a-z]+ (is|was)\b"],
        "pitfallsVi": [
            "**Sai thì của be**: thì của *It was/is* phải khớp với thì của mệnh đề sau.",
            "**Dùng which cho người**: ✗ *It was Lan which called.* → ✓ *…who called*.",
        ],
        "tipsVi": ["Muốn nhấn mạnh phần nào, đưa phần đó lên ngay sau *It is/was*."],
        "voaKeywords": ["cleft"],
    },
    {
        "slug": "subjunctive-hypothetical",
        "titleVi": "Thức giả định và cấu trúc giả thiết",
        "titleEn": "Subjunctive and hypothetical structures",
        "cefr": "C1",
        "category": "modality",
        "cefrjCodes": ["SUBJ.suggest_that"],
        "summaryVi": "Wish, if only, would rather, it's time — nhóm cấu trúc dùng thì quá khứ để nói về hiện tại.",
        "theoryVi": (
            "Một nhóm cấu trúc dùng **thì quá khứ để nói về hiện tại**, vì quá khứ ở đây đánh dấu "
            "“không có thật” chứ không đánh dấu thời gian.\n\n"
            "**wish / if only + quá khứ đơn** = tiếc về hiện tại: *I wish I had more time.*\n"
            "**wish / if only + quá khứ hoàn thành** = tiếc về quá khứ: *I wish I had studied harder.*\n"
            "**wish + would** = mong người khác đổi hành vi: *I wish you would listen.*\n\n"
            "**would rather + quá khứ đơn**: *I'd rather you didn't smoke here.*\n"
            "**It's time + quá khứ đơn**: *It's time we left.*\n\n"
            "Thức giả định hình thức (*mandative subjunctive*) dùng **nguyên thể trần** sau các động từ "
            "đề nghị, yêu cầu: *I suggest that he **be** informed.* Dạng này phổ biến trong tiếng Anh Mỹ "
            "và trong văn bản trang trọng."
        ),
        "patterns": [
            {"form": "wish + quá khứ đơn", "example": "I wish I knew the answer.", "vi": "Ước gì tôi biết câu trả lời."},
            {"form": "wish + quá khứ hoàn thành", "example": "I wish I hadn't said that.", "vi": "Ước gì tôi đã không nói câu đó."},
            {"form": "would rather + quá khứ", "example": "I'd rather you came tomorrow.", "vi": "Tôi muốn bạn đến vào ngày mai hơn."},
            {"form": "suggest that + nguyên thể trần", "example": "They suggested that she apply again.", "vi": "Họ đề nghị cô ấy nộp đơn lại."},
        ],
        "match": [r"\bI wish (I|you|he|she|they|we)\b", r"\bIf only\b", r"\bwould rather\b", r"\bIt's time\b"],
        "pitfallsVi": [
            "**Dùng hiện tại sau wish**: ✗ *I wish I have more money.* → ✓ *I wish I had more money.*",
            "**Dùng will sau wish**: ✗ *I wish you will help.* → ✓ *I wish you would help.*",
        ],
        "tipsVi": ["Sau *wish* và *if only*, lùi thì một bậc so với điều bạn đang tiếc."],
        "voaKeywords": ["wish", "subjunctive"],
    },
    {
        "slug": "hedging-academic",
        "titleVi": "Ngôn ngữ giảm nhẹ trong văn học thuật",
        "titleEn": "Hedging in academic writing",
        "cefr": "C1",
        "category": "discourse",
        "cefrjCodes": ["MOD.may_might"],
        "summaryVi": "Cách nói thận trọng — kỹ năng bắt buộc cho IELTS Writing Task 2 và bài luận đại học.",
        "theoryVi": (
            "Văn học thuật tiếng Anh tránh khẳng định tuyệt đối. Câu “Học sinh Việt Nam **luôn** giỏi toán” "
            "sẽ bị coi là thiếu cơ sở; người viết học thuật sẽ nói “Vietnamese students **tend to** perform "
            "well in mathematics”.\n\n"
            "Người học Việt Nam thường viết quá dứt khoát vì trong tiếng Việt, câu khẳng định mạnh nghe "
            "tự tin chứ không nghe thiếu căn cứ. Trong tiếng Anh học thuật thì ngược lại.\n\n"
            "Công cụ giảm nhẹ gồm: **động từ khuyết thiếu** (*may*, *might*, *could*), **động từ báo cáo** "
            "(*appear to*, *seem to*, *tend to*), **trạng từ** (*possibly*, *arguably*, *generally*, *largely*), "
            "**lượng từ** (*many*, *some*, *the majority of* thay cho *all*), và **cấu trúc phi ngôi** "
            "(*It is widely believed that…*).\n\n"
            "Ngược lại, khi cần khẳng định mạnh có bằng chứng, dùng *clearly*, *undoubtedly*, *the evidence shows that*."
        ),
        "patterns": [
            {"form": "may / might + V", "example": "This may explain the difference.", "vi": "Điều này có thể giải thích cho sự khác biệt."},
            {"form": "tend to / appear to", "example": "Younger learners tend to acquire accents more easily.", "vi": "Người học nhỏ tuổi thường bắt chước giọng dễ hơn."},
            {"form": "It is widely believed that…", "example": "It is widely believed that reading improves writing.", "vi": "Nhiều người cho rằng đọc nhiều giúp viết tốt hơn."},
        ],
        "match": [r"\b(may|might|could) (be|have|explain|suggest|indicate)\b", r"\b(tend|tends|tended) to\b", r"\b(appears|appear|seems|seem) to\b"],
        "pitfallsVi": [
            "**Khẳng định tuyệt đối**: ✗ *Everyone knows that…* → ✓ *It is generally accepted that…*",
            "**Giảm nhẹ quá đà**: ba lớp *might possibly perhaps* trong một câu làm câu mất trọng lượng.",
        ],
        "tipsVi": ["Trong bài IELTS Task 2, mỗi đoạn thân bài nên có ít nhất một cấu trúc giảm nhẹ."],
        "voaKeywords": ["may might", "modal"],
    },
]
