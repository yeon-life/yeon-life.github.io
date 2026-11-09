/* ==========================================================================
   연라이프 영어 학습앱 — 마스터리 엔진 (yeon-english-mastery.js)
   도서출판 연라이프 · 연 디자인 표준 v1.1 호환
   1. 2원화 사전 (우측 서랍 영한 + 하단 영영 시트)
   2. 내 단어장 & 3초 깜빡이 망각곡선 플래시카드
   3. 문장 드래그 스크랩 & 통문장 정복 4단계 챌린지
   4. 문단별 X-Ray 문법 렌즈 (구조 분해 & 핵심 문법 형광펜)
   5. 명화 구술 스토리텔링 모드 (Picture Retelling)
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BOOK;
  if (!B) return;

  // ── 0. 연플래닝 아카데미 학원 태블릿 기기 인증 & 간편 학생 전환 엔진 ──
  const YeonStudentAuth = {
    DEVICE_KEY: "yeon_academy_device_certified",
    CURRENT_KEY: "yeon_current_student",
    RECENTS_KEY: "yeon_recent_students",

    // 기기 인증 상태 (한 번이라도 접속하면 학원 태블릿으로 자동 영구 인증)
    isDeviceCertified() {
      try {
        const cert = localStorage.getItem(this.DEVICE_KEY);
        if (cert) return JSON.parse(cert);
      } catch (e) {}
      const defCert = {
        certified: true,
        academy: "연플래닝 아카데미",
        certifiedAt: new Date().toISOString(),
        deviceLabel: "학원 공용 학습 태블릿"
      };
      this.certifyDevice(defCert);
      return defCert;
    },

    certifyDevice(info) {
      try {
        localStorage.setItem(this.DEVICE_KEY, JSON.stringify(info || {
          certified: true,
          academy: "연플래닝 아카데미",
          certifiedAt: new Date().toISOString(),
          deviceLabel: "학원 공용 학습 태블릿"
        }));
      } catch (e) {}
    },

    // 현재 로그인된 학생 정보 { id: "1024", name: "김하늘", grade: "초2" }
    getCurrentStudent() {
      try {
        if (window.YK && window.YK.prof) {
          return {
            id: window.YK.prof.phone4 || window.YK.prof.sid || window.YK.prof.name,
            name: window.YK.prof.name,
            grade: window.YK.prof.grade || "중2"
          };
        }
        const cur = localStorage.getItem(this.CURRENT_KEY);
        if (cur) return JSON.parse(cur);
      } catch (e) {}
      return null;
    },

    getCurrentStudentId() {
      const cur = this.getCurrentStudent();
      return cur ? cur.id : "";
    },

    // 최근 학습한 학생 목록 (최대 5명)
    getRecentStudents() {
      try {
        const rec = localStorage.getItem(this.RECENTS_KEY);
        return rec ? JSON.parse(rec) : [];
      } catch (e) { return []; }
    },

    // 학생 로그인 (ID == PW 원칙: 단일 입력창으로 비밀번호 자동 동기화)
    login(studentId, studentName, studentGrade) {
      if (!studentId) return;
      const sId = String(studentId).trim();
      const sName = (studentName || sId).trim();
      const sGrade = studentGrade || "초2";

      const student = {
        id: sId,
        name: sName,
        grade: sGrade,
        loginAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(this.CURRENT_KEY, JSON.stringify(student));

        // 최근 학생 목록 갱신
        let recents = this.getRecentStudents().filter(s => s.id !== sId);
        recents.unshift(student);
        if (recents.length > 5) recents = recents.slice(0, 5);
        localStorage.setItem(this.RECENTS_KEY, JSON.stringify(recents));

        // student-gate.js 및 Firebase 연동
        if (window.YK) {
          window.YK.prof = {
            name: sName,
            grade: sGrade,
            phone4: sId.slice(-4) || sId,
            uid: `student_${sId}`
          };
          window.YK.ready = true;
          try {
            localStorage.setItem("yk_profile", JSON.stringify(window.YK.prof));
            localStorage.setItem("yk_last", JSON.stringify({ name: sName, grade: sGrade }));
          } catch (e) {}
        }
      } catch (e) {}

      updateStudentUI();
      updateCounters();
      closeStudentAuthModal();
      showToast(`${sName} (${sGrade}) 학생으로 전환되었습니다.`);
    },

    logout() {
      try {
        localStorage.removeItem(this.CURRENT_KEY);
        if (window.YK) {
          window.YK.prof = null;
        }
        localStorage.removeItem("yk_profile");
      } catch (e) {}
      updateStudentUI();
      updateCounters();
      closeStudentAuthModal();
      showToast("학생 로그아웃되었습니다.");
    }
  };
  window.YeonStudentAuth = YeonStudentAuth;

  // ── 저장소 유틸 (학생별 데이터 분리 격리 지원: eng-gogh/ + (sid ? sid + "/" : "") + key) ──
  const Storage = {
    getStudentKey(k) {
      const sid = YeonStudentAuth.getCurrentStudentId();
      return sid ? `eng-gogh/${sid}/${k}` : `eng-gogh/${k}`;
    },
    get(k, def) {
      try {
        const key = this.getStudentKey(k);
        let v = localStorage.getItem(key);
        // 학생 고유 키에 없으면 기존 기본 키에서 fallback 읽기
        if (v === null && key !== `eng-gogh/${k}`) {
          v = localStorage.getItem(`eng-gogh/${k}`);
        }
        return v === null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set(k, v) {
      try {
        const key = this.getStudentKey(k);
        localStorage.setItem(key, JSON.stringify(v));
      } catch (e) {}
    }
  };

  // ── 정갈한 미니멀 라인 SVG 아이콘 시스템 (Yeon Minimal SVG Icon System) ──
  const Y_SVG = {
    speaker: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    speakerSmall: (sz = 12) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    headphones: (sz = 14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
    bookmark: (sz = 12, fill = "none") => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    search: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    star: (sz = 14, fill = "none") => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    printer: (sz = 14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    mic: (sz = 14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    gradCap: (sz = 15) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    book: (sz = 14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    timer: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    trash: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    award: (sz = 15) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    eye: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    rotate: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>`,
    prev: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>`,
    next: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`,
    play: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor" class="y-icon"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor" class="y-icon"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    stop: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor" class="y-icon"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
    user: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    lightbulb: (sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="y-icon"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>`
  };

  // ── 원어민 보이스 매니저 (Voice Engine: 여성 / 남성 목소리 선택 지원) ──
  const VoiceEngine = {
    gender: Storage.get("voice_gender", "female"), // 기본값: 여성 원어민
    voices: [],

    init() {
      if (!("speechSynthesis" in window)) return;
      const load = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) this.voices = v;
      };
      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    },

    setGender(g) {
      this.gender = g === "male" ? "male" : "female";
      Storage.set("voice_gender", this.gender);
      this.syncUI();
    },

    syncUI() {
      // 1. 하단 오디오 제어 독 칩 동기화
      document.querySelectorAll("#dock-voice-pills .dock-pill").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-voice") === this.gender);
      });
      // 2. 상단 툴바 토글 버튼 라벨 동기화
      const labelEl = document.getElementById("voice-top-label");
      if (labelEl) {
        labelEl.textContent = this.gender === "female" ? "여성 목소리" : "남성 목소리";
      }
    },

    getVoice(gender = this.gender) {
      if (!this.voices || this.voices.length === 0) {
        if ("speechSynthesis" in window) {
          this.voices = window.speechSynthesis.getVoices() || [];
        }
      }

      // 1. 미국식 표준 발음 (en-US / General American) 엄격 필터링 (영국식 GB/UK, 호주식 AU, 인도식 IN 등 철저 배제)
      const usVoices = (this.voices || []).filter(v => {
        const lang = (v.lang || "").toLowerCase();
        const name = (v.name || "").toLowerCase();
        if (lang.includes("gb") || lang.includes("uk") || lang.includes("au") || lang.includes("in") || lang.includes("nz")) return false;
        if (name.includes("united kingdom") || name.includes("british") || name.includes("australia") || name.includes("george") || name.includes("hazel") || name.includes("susan") || name.includes("brian") || name.includes("daniel")) return false;
        return lang.includes("us") || lang === "en";
      });

      const candidateVoices = usVoices.length > 0 ? usVoices : (this.voices || []).filter(v => (v.lang || "").startsWith("en"));
      if (candidateVoices.length === 0) return null;

      // 2. 최고 품질의 미국식 내추럴/온라인 보이스 우선 매칭
      const femaleKeywords = ["jenny", "aria", "natural (female)", "google us english", "samantha", "allison", "ava", "zira", "female"];
      const maleKeywords = ["guy", "natural (male)", "matthew", "david", "mark", "male"];

      if (gender === "female") {
        const fv = candidateVoices.find(v => femaleKeywords.some(kw => (v.name || "").toLowerCase().includes(kw)));
        if (fv) return fv;
        const notMale = candidateVoices.find(v => !maleKeywords.some(kw => (v.name || "").toLowerCase().includes(kw)));
        if (notMale) return notMale;
      } else {
        const mv = candidateVoices.find(v => maleKeywords.some(kw => (v.name || "").toLowerCase().includes(kw)));
        if (mv) return mv;
        const notFemale = candidateVoices.find(v => !femaleKeywords.some(kw => (v.name || "").toLowerCase().includes(kw)));
        if (notFemale) return notFemale;
      }

      return candidateVoices[0];
    },

    applyToUtterance(u, gender = this.gender) {
      const voice = this.getVoice(gender);
      if (voice) {
        u.voice = voice;
        u.lang = "en-US";
      } else {
        u.lang = "en-US";
      }
      // 기계음 왜곡을 원천 방지하기 위해 자연스러운 미국식 표준 피치 1.0 적용
      u.pitch = 1.0;
    }
  };

  // ── 고품질 미국식 음성 낭독 (American Studio Audio & Natural Fallback) ──
  function speak(text, rate = 0.85) {
    const clean = (text || "").trim().toLowerCase().replace(/[^a-z]/g, "");
    if (clean && clean.length > 1) {
      const audioPath = `audio/vocab/v_${clean}.mp3`;
      const audio = new Audio(audioPath);
      audio.playbackRate = rate;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          fallbackTTS(text, rate);
        });
        return;
      }
    }
    fallbackTTS(text, rate);
  }

  function fallbackTTS(text, rate = 0.85) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    VoiceEngine.applyToUtterance(u);
    u.rate = rate;
    window.speechSynthesis.speak(u);
  }

  // ── 단어 사전 데이터베이스 (26단어 상세 사전) ──
  const DICT_DB = {
    "village": {
      en: "village", pron: "/ˈvɪlɪdʒ/", pos: "명사",
      meanings: ["마을, 시골 동네", "작은 촌락"],
      easy_en: "A very small town in the countryside.",
      synonyms: "town, hamlet",
      example_en: "Vincent van Gogh was born in the village of Zundert.",
      example_ko: "빈센트 반 고흐는 준데르트 마을에서 태어났다."
    },
    "quiet": {
      en: "quiet", pron: "/ˈkwaɪət/", pos: "형용사",
      meanings: ["조용한, 고요한", "잔잔한, 평화로운"],
      easy_en: "Making very little or no noise; peaceful.",
      synonyms: "calm, peaceful, silent",
      example_en: "This quiet country village was in the Netherlands.",
      example_ko: "이 조용한 시골 마을은 네덜란드에 있었다."
    },
    "field": {
      en: "field", pron: "/fiːld/", pos: "명사",
      meanings: ["들판, 밭, 들", "분야, 현장"],
      easy_en: "An area of open land, especially one planted with crops.",
      synonyms: "meadow, pasture",
      example_en: "Vincent enjoyed walking through the green fields.",
      example_ko: "빈센트는 푸른 들판을 거니는 것을 즐겼다."
    },
    "nature": {
      en: "nature", pron: "/ˈneɪtʃər/", pos: "명사",
      meanings: ["자연, 대자연", "본성, 천성"],
      easy_en: "All the animals, plants, and other things in the world not made by humans.",
      synonyms: "natural world, wildlife",
      example_en: "Nature gave him deep peace and inspired his young heart.",
      example_ko: "자연은 그에게 깊은 평화를 주었다."
    },
    "peace": {
      en: "peace", pron: "/piːs/", pos: "명사",
      meanings: ["평화, 평온, 평정"],
      easy_en: "A calm quiet state, free from worry or noise.",
      synonyms: "calmness, serenity, tranquility",
      example_en: "Looking at his pictures always gives me deep peace.",
      example_ko: "그의 그림을 보는 것은 언제나 나에게 깊은 평화를 준다."
    },
    "inspire": {
      en: "inspire", pron: "/ɪnˈspaɪər/", pos: "동사",
      meanings: ["영감을 주다, 고무하다", "불어넣다"],
      easy_en: "To give someone the desire and enthusiasm to do something well.",
      synonyms: "encourage, motivate, spark",
      example_en: "Nature inspired his young heart to become an artist.",
      example_ko: "자연은 그의 어린 마음에 예술적 영감을 불어넣었다."
    },
    "clerk": {
      en: "clerk", pron: "/klɜːrk/", pos: "명사",
      meanings: ["점원, 사무원, 서기"],
      easy_en: "A person whose job is to keep records or serve customers in a shop.",
      synonyms: "shop assistant, office worker",
      example_en: "As a young man, Vincent worked as a clerk and a teacher.",
      example_ko: "청년 시절 빈센트는 점원과 교사로 일했다."
    },
    "painter": {
      en: "painter", pron: "/ˈpeɪntər/", pos: "명사",
      meanings: ["화가, 페인트공"],
      easy_en: "An artist who makes pictures using paint.",
      synonyms: "artist, portraitist",
      example_en: "At twenty-seven, he decided to become a painter.",
      example_ko: "스물일곱 살에 그는 화가가 되기로 결심했다."
    },
    "brother": {
      en: "brother", pron: "/ˈbrʌðər/", pos: "명사",
      meanings: ["형제, 동생, 형"],
      easy_en: "A boy or man who has the same parents as another person.",
      synonyms: "sibling",
      example_en: "His younger brother Theo wanted to support Vincent's new dream.",
      example_ko: "동생 테오는 빈센트의 새로운 꿈을 돕고 싶어 했다."
    },
    "support": {
      en: "support", pron: "/səˈpɔːrt/", pos: "동사/명사",
      meanings: ["지원하다, 후원하다", "응원하다, 지지"],
      easy_en: "To give help, money, or encouragement to someone.",
      synonyms: "back, sponsor, help",
      example_en: "He was supported by Theo with warm words and money.",
      example_ko: "그는 테오의 따뜻한 격려와 돈으로 지원을 받았다."
    },
    "friendship": {
      en: "friendship", pron: "/ˈfrendʃɪp/", pos: "명사",
      meanings: ["우정, 친구 관계"],
      easy_en: "A close relationship between two friends.",
      synonyms: "bond, companionship",
      example_en: "The two brothers shared deep friendship.",
      example_ko: "두 형제는 깊은 우정을 나누었다."
    },
    "letter": {
      en: "letter", pron: "/ˈletər/", pos: "명사",
      meanings: ["편지", "글자, 문자"],
      easy_en: "A written message from one person to another.",
      synonyms: "note, message, mail",
      example_en: "The two brothers wrote hundreds of letters to each other.",
      example_ko: "두 형제는 서로에게 수백 통의 편지를 썼다."
    },
    "southern": {
      en: "southern", pron: "/ˈsʌðərn/", pos: "형용사",
      meanings: ["남쪽의, 남부의"],
      easy_en: "Located in or connected with the south.",
      synonyms: "south",
      example_en: "In 1888, Vincent moved to Arles in southern France.",
      example_ko: "1888년 빈센트는 프랑스 남부의 아를로 이주했다."
    },
    "bright": {
      en: "bright", pron: "/braɪt/", pos: "형용사",
      meanings: ["밝은, 빛나는", "선명한, 영리한"],
      easy_en: "Full of light; shining with strong color.",
      synonyms: "shining, vivid, luminous",
      example_en: "He chose to live in a bright yellow house there.",
      example_ko: "그는 그곳에서 밝고 노란 집에 살기로 했다."
    },
    "sunflower": {
      en: "sunflower", pron: "/ˈsʌnˌflaʊər/", pos: "명사",
      meanings: ["해바라기"],
      easy_en: "A tall plant with very large yellow flowers.",
      synonyms: "helianthus",
      example_en: "He loved painting sunflowers under the warm golden sunlight.",
      example_ko: "그는 따뜻한 황금빛 햇살 아래에서 해바라기 그리는 것을 좋아했다."
    },
    "sunlight": {
      en: "sunlight", pron: "/ˈsʌnlaɪt/", pos: "명사",
      meanings: ["햇살, 햇빛"],
      easy_en: "The natural light and warmth that comes from the sun.",
      synonyms: "sunshine, day",
      example_en: "The golden sunlight made the flowers look brilliant.",
      example_ko: "황금빛 햇살이 꽃들을 눈부시게 만들었다."
    },
    "brilliant": {
      en: "brilliant", pron: "/ˈbrɪljənt/", pos: "형용사",
      meanings: ["눈부신, 훌륭한", "찬란한, 매우 뛰어난"],
      easy_en: "Extremely bright or magnificent; very intelligent.",
      synonyms: "magnificent, dazzling, superb",
      example_en: "Brilliant sunflower pictures were painted by Vincent.",
      example_ko: "눈부신 해바라기 그림들이 빈센트에 의해 그려졌다."
    },
    "window": {
      en: "window", pron: "/ˈwɪndoʊ/", pos: "명사",
      meanings: ["창문, 창"],
      easy_en: "An opening in a wall that lets in light and air.",
      synonyms: "casement",
      example_en: "He looked through his window and watched the night sky.",
      example_ko: "그는 창밖을 내다보며 밤하늘을 바라보았다."
    },
    "masterpiece": {
      en: "masterpiece", pron: "/ˈmæstərpiːs/", pos: "명사",
      meanings: ["걸작, 명작, 최고 대표작"],
      easy_en: "A work of outstanding artistry, skill, or workmanship.",
      synonyms: "magnum opus, classic",
      example_en: "His great masterpiece The Starry Night was created at this special place.",
      example_ko: "그의 위대한 걸작 <별이 빛나는 밤>이 이곳에서 탄생했다."
    },
    "produce": {
      en: "produce", pron: "/prəˈduːs/", pos: "동사",
      meanings: ["생산하다, 만들어내다", "작품을 남기다"],
      easy_en: "To make, create, or bring into existence.",
      synonyms: "create, generate, make",
      example_en: "He worked as a painter for ten years and produced many works.",
      example_ko: "그는 10년 동안 화가로 활동하며 수많은 작품을 남겼다."
    },
    "pass away": {
      en: "pass away", pron: "/pæs əˈweɪ/", pos: "숙어/동사",
      meanings: ["세상을 떠나다, 영면하다", "돌아가시다"],
      easy_en: "A polite way of saying to die.",
      synonyms: "die, depart",
      example_en: "Vincent passed away in 1890 at the age of thirty-seven.",
      example_ko: "빈센트는 1890년 서른일곱 살의 나이로 세상을 떠났다."
    },
    "lifetime": {
      en: "lifetime", pron: "/ˈlaɪftaɪm/", pos: "명사",
      meanings: ["평생, 일생, 생애"],
      easy_en: "The duration of a person's life.",
      synonyms: "life, existence",
      example_en: "During his lifetime, Vincent sold only one painting.",
      example_ko: "그의 생애 동안 빈센트는 단 한 점의 그림만을 팔았다."
    },
    "museum": {
      en: "museum", pron: "/mjuˈziːəm/", pos: "명사",
      meanings: ["미술관, 박물관"],
      easy_en: "A building where objects of historical or artistic interest are displayed.",
      synonyms: "gallery, exhibition hall",
      example_en: "Today his works are loved in museums around the world.",
      example_ko: "오늘날 그의 작품들은 전 세계 미술관에서 사랑받고 있다."
    },
    "touch": {
      en: "touch", pron: "/tʌtʃ/", pos: "동사",
      meanings: ["감동시키다, 울리다", "만지다, 닿다"],
      easy_en: "To affect someone with deep, tender emotion.",
      synonyms: "move, affect, inspire",
      example_en: "His passionate art has touched the hearts of millions of people.",
      example_ko: "그의 열정적인 예술은 수백만 사람들의 마음을 감동시켰다."
    },
    "heart": {
      en: "heart", pron: "/hɑːrt/", pos: "명사",
      meanings: ["마음, 심장", "가슴, 중심"],
      easy_en: "The emotional center of a person; the soul.",
      synonyms: "soul, mind, spirit",
      example_en: "Nature gave him peace and inspired his young heart.",
      example_ko: "자연은 그에게 평화를 주고 그의 어린 마음에 영감을 불어넣었다."
    },
    "traveler": {
      en: "traveler", pron: "/ˈtrævələr/", pos: "명사",
      meanings: ["여행자, 관광객", "나그네"],
      easy_en: "A person who is traveling or often travels.",
      synonyms: "tourist, visitor, explorer",
      example_en: "Every year travelers from all over the world visit his museum.",
      example_ko: "매년 전 세계에서 온 여행자들이 그의 미술관을 찾는다."
    }
  };

  // ── X-Ray 문법 분석 데이터 (주어/동사/목적어/수식어 및 핵심 문법 태깅) ──
  const SYNTAX_DATA = {
    "1-1": {
      chunks: [
        { text: "Vincent van Gogh", role: "subj", label: "주어" },
        { text: "was born", role: "verb", label: "수동태 동사", hl: true, why: "be + 과거분사(born): 태어나다(수동태)", gNo: 4, gName: "4. 수동태 (be동사 + 과거분사)" },
        { text: "in the village of Zundert", role: "mod", label: "장소 부사구" },
        { text: "in 1853.", role: "mod", label: "시간 부사구" }
      ]
    },
    "1-2": {
      chunks: [
        { text: "This quiet country village", role: "subj", label: "주어" },
        { text: "was", role: "verb", label: "be동사 과거형", hl: true, why: "주어가 3인칭 단수이므로 과거형 was 사용", gNo: 1, gName: "1. 과거 시제 (be동사 was/were)" },
        { text: "in the Netherlands.", role: "mod", label: "장소 부사구" }
      ]
    },
    "1-3": {
      chunks: [
        { text: "As a boy,", role: "mod", label: "시간 부사구" },
        { text: "Vincent", role: "subj", label: "주어" },
        { text: "enjoyed", role: "verb", label: "과거 동사" },
        { text: "walking through the green fields.", role: "obj", label: "동명사 목적어구", hl: true, why: "enjoy는 목적어로 to부정사가 아닌 동명사(-ing)만을 취함", gNo: 3, gName: "3. 동명사 (enjoy + -ing)" }
      ]
    },
    "1-4": {
      chunks: [
        { text: "He", role: "subj", label: "주어" },
        { text: "also loved", role: "verb", label: "동사" },
        { text: "looking at beautiful trees and quiet rivers.", role: "obj", label: "동명사 목적어구", hl: true, why: "love는 동명사와 to부정사 둘 다 목적어 가능", gNo: 3, gName: "3. 동명사 (love + -ing)" }
      ]
    },
    "1-5": {
      chunks: [
        { text: "Nature", role: "subj", label: "주어" },
        { text: "gave", role: "verb", label: "4형식 수여동사" },
        { text: "him", role: "obj", label: "간접목적어(~에게)" },
        { text: "deep peace", role: "obj", label: "직접목적어(~을)" },
        { text: "and inspired", role: "verb", label: "과거 동사 2" },
        { text: "his young heart.", role: "obj", label: "목적어 2" }
      ]
    },
    "2-1": {
      chunks: [
        { text: "As a young man,", role: "mod", label: "시간 부사구" },
        { text: "Vincent", role: "subj", label: "주어" },
        { text: "worked", role: "verb", label: "과거 동사" },
        { text: "as a clerk and a teacher.", role: "mod", label: "자격 부사구" }
      ]
    },
    "2-2": {
      chunks: [
        { text: "At twenty-seven,", role: "mod", label: "나이 부사구" },
        { text: "he", role: "subj", label: "주어" },
        { text: "decided", role: "verb", label: "과거 동사" },
        { text: "to become a painter.", role: "obj", label: "to부정사 명사적 용법", hl: true, why: "decide는 to부정사만을 목적어로 취함 (~하기로 결심하다)", gNo: 2, gName: "2. to부정사 (decide + to-v)" }
      ]
    },
    "2-3": {
      chunks: [
        { text: "His younger brother Theo", role: "subj", label: "주어" },
        { text: "wanted", role: "verb", label: "과거 동사" },
        { text: "to support Vincent's new dream.", role: "obj", label: "to부정사 목적어", hl: true, why: "want + to-v : ~하기를 원하다 (동사의 목적어)", gNo: 2, gName: "2. to부정사 (want + to-v)" }
      ]
    },
    "2-4": {
      chunks: [
        { text: "He", role: "subj", label: "주어" },
        { text: "was supported", role: "verb", label: "수동태(was + p.p.)", hl: true, why: "빈센트가 테오에게 '지원을 받았다'는 뜻의 수동태", gNo: 4, gName: "4. 수동태 (be동사 + 과거분사)" },
        { text: "by Theo", role: "mod", label: "행위자(by ~)" },
        { text: "with warm words and money.", role: "mod", label: "수단 부사구" }
      ]
    },
    "2-5": {
      chunks: [
        { text: "The two brothers", role: "subj", label: "복수 주어" },
        { text: "shared", role: "verb", label: "동사 1" },
        { text: "deep friendship", role: "obj", label: "목적어 1" },
        { text: "and wrote", role: "verb", label: "동사 2" },
        { text: "hundreds of letters.", role: "obj", label: "목적어 2" }
      ]
    },
    "3-1": {
      chunks: [
        { text: "In 1888,", role: "mod", label: "시간 부사구" },
        { text: "Vincent", role: "subj", label: "주어" },
        { text: "moved", role: "verb", label: "과거 동사" },
        { text: "to Arles in southern France.", role: "mod", label: "장소 부사구" }
      ]
    },
    "3-2": {
      chunks: [
        { text: "He", role: "subj", label: "주어" },
        { text: "chose", role: "verb", label: "과거 동사(choose 과거)" },
        { text: "to live in a bright yellow house there.", role: "obj", label: "to부정사 목적어", hl: true, why: "choose + to-v : ~하기로 선택하다", gNo: 2, gName: "2. to부정사 (choose + to-v)" }
      ]
    },
    "3-3": {
      chunks: [
        { text: "He", role: "subj", label: "주어" },
        { text: "loved", role: "verb", label: "동사" },
        { text: "painting sunflowers", role: "obj", label: "동명사 목적어", hl: true, why: "love + -ing: 해바라기 그리는 것을 사랑했다", gNo: 3, gName: "3. 동명사 (love + -ing)" },
        { text: "under the warm golden sunlight.", role: "mod", label: "장소 부사구" }
      ]
    },
    "3-4": {
      chunks: [
        { text: "Brilliant sunflower pictures", role: "subj", label: "복수 주어" },
        { text: "were painted", role: "verb", label: "복수 수동태(were + p.p.)", hl: true, why: "주어 pictures가 복수이므로 were painted (수동태)", gNo: 4, gName: "4. 수동태 (복수 were + p.p.)" },
        { text: "by Vincent", role: "mod", label: "행위자" },
        { text: "during this time.", role: "mod", label: "시간 부사구" }
      ]
    },
    "4-1": {
      chunks: [
        { text: "In 1889,", role: "mod", label: "시간 부사구" },
        { text: "Vincent", role: "subj", label: "주어" },
        { text: "stayed in Saint-Rémy", role: "verb", label: "동사구 1" },
        { text: "and watched", role: "verb", label: "동사 2" },
        { text: "the dark night sky.", role: "obj", label: "목적어" }
      ]
    },
    "4-2": {
      chunks: [
        { text: "He", role: "subj", label: "주어" },
        { text: "looked through his window", role: "verb", label: "동사구 1" },
        { text: "and started", role: "verb", label: "동사 2" },
        { text: "drawing spinning stars and a glowing moon.", role: "obj", label: "동명사 목적어", hl: true, why: "start + -ing: 그리기 시작했다 (spinning, glowing 분사 수식)", gNo: 3, gName: "3. 동명사 (start + -ing)" }
      ]
    },
    "4-3": {
      chunks: [
        { text: "His great masterpiece The Starry Night", role: "subj", label: "주어" },
        { text: "was created", role: "verb", label: "단수 수동태", hl: true, why: "작품이 '창작되었다'는 수동태 표현 (was + p.p.)", gNo: 4, gName: "4. 수동태 (단수 was + p.p.)" },
        { text: "at this special place.", role: "mod", label: "장소 부사구" }
      ]
    },
    "5-1": {
      chunks: [
        { text: "During his lifetime,", role: "mod", label: "시간 부사구" },
        { text: "Vincent", role: "subj", label: "주어" },
        { text: "sold", role: "verb", label: "동사(sell 과거형)" },
        { text: "only one painting.", role: "obj", label: "목적어" }
      ]
    },
    "5-2": {
      chunks: [
        { text: "Today", role: "mod", label: "부사" },
        { text: "his works", role: "subj", label: "복수 주어" },
        { text: "are exhibited", role: "verb", label: "현재 수동태(are + p.p.)", hl: true, why: "현재 전시되고 있는 상태를 나타내는 수동태", gNo: 4, gName: "4. 수동태 (현재형 are + p.p.)" },
        { text: "in famous museums around the world.", role: "mod", label: "장소 부사구" }
      ]
    },
    "5-3": {
      chunks: [
        { text: "His passionate art", role: "subj", label: "단수 주어" },
        { text: "has touched", role: "verb", label: "현재완료(has + p.p.)", hl: true, why: "과거부터 지금까지 지속적으로 '마음을 감동시켜 왔다'", gNo: 5, gName: "5. 현재완료 (has + p.p.)" },
        { text: "the hearts of millions of people.", role: "obj", label: "목적어" }
      ]
    },
    "5-4": {
      chunks: [
        { text: "His brilliant colors and emotional brushstrokes", role: "subj", label: "복수 주어" },
        { text: "have inspired", role: "verb", label: "현재완료(have + p.p.)", hl: true, why: "복수 주어에 따른 have + inspired(영감을 주어왔다)", gNo: 5, gName: "5. 현재완료 (have + p.p.)" },
        { text: "generations of artists.", role: "obj", label: "목적어" }
      ]
    },
    "5-5": {
      chunks: [
        { text: "Every year", role: "mod", label: "시간 부사구" },
        { text: "travelers from all over the world", role: "subj", label: "복수 주어" },
        { text: "visit", role: "verb", label: "현재 동사" },
        { text: "his museum in Amsterdam", role: "obj", label: "목적어" },
        { text: "to feel his undying passion.", role: "mod", label: "to부정사 부사적 용법(목적)", hl: true, why: "to feel: ~를 느끼기 위하여 (목적을 나타내는 to부정사)", gNo: 2, gName: "2. to부정사 (부사적 용법 - 목적)" }
      ]
    }
  };

  // ── 문법 렌즈 2.0: 실전 확장 예문 2개 & 내가 직접 만들어보기(어순 조립 영작 드릴) DB ──
  const GRAMMAR_EXTRAS_DB = {
    "1-1": {
      extraExamples: [
        { en: "The famous scientist was born in a small town.", ko: "그 유명한 과학자는 작은 마을에서 태어났다." },
        { en: "She was born on a rainy night in July.", ko: "그녀는 7월의 비 오는 밤에 태어났다." }
      ],
      drill: {
        ko: "그 음악가는 1800년대에 파리에서 태어났다.",
        pattern: "주어 + was born + in 장소 + in 연도",
        answer: "The musician was born in Paris in the 1800s.",
        blocks: ["The musician", "was born", "in Paris", "in the 1800s."]
      }
    },
    "1-2": {
      extraExamples: [
        { en: "The weather was very sunny and warm yesterday.", ko: "어제는 날씨가 매우 화창하고 따뜻했다." },
        { en: "They were excited about the upcoming school festival.", ko: "그들은 다가오는 학교 축제에 몹시 신이 났다." }
      ],
      drill: {
        ko: "어제 그 미술관은 매우 조용했다.",
        pattern: "주어 + was + very quiet + yesterday",
        answer: "The art museum was very quiet yesterday.",
        blocks: ["The art museum", "was", "very quiet", "yesterday."]
      }
    },
    "1-3": {
      extraExamples: [
        { en: "My sister enjoys listening to classical music at night.", ko: "내 여동생은 밤에 클래식 음악 듣는 것을 즐긴다." },
        { en: "We enjoyed riding our bicycles along the river.", ko: "우리는 강을 따라 자전거 타는 것을 즐겼다." }
      ],
      drill: {
        ko: "그는 공원에서 책 읽는 것을 즐겼다.",
        pattern: "주어 + enjoyed + -ing(동명사) + in 장소",
        answer: "He enjoyed reading books in the park.",
        blocks: ["He", "enjoyed", "reading books", "in the park."]
      }
    },
    "1-4": {
      extraExamples: [
        { en: "I love taking pictures of colorful sunset skies.", ko: "나는 다채로운 노을 하늘 사진 찍는 것을 정말 좋아한다." },
        { en: "The children loved playing soccer after school.", ko: "아이들은 방과 후에 축구하는 것을 무척 좋아했다." }
      ],
      drill: {
        ko: "그녀는 밤하늘의 밝은 별들을 바라보는 것을 사랑했다.",
        pattern: "주어 + loved + looking at + 목적어",
        answer: "She loved looking at bright stars in the night sky.",
        blocks: ["She", "loved", "looking at", "bright stars", "in the night sky."]
      }
    },
    "2-2": {
      extraExamples: [
        { en: "She decided to study hard for the final exam.", ko: "그녀는 기말고사를 위해 열심히 공부하기로 결심했다." },
        { en: "We decided to travel to Jeju Island this summer.", ko: "우리는 이번 여름에 제주도로 여행 가기로 결정했다." }
      ],
      drill: {
        ko: "민우는 훌륭한 작가가 되기로 결심했다.",
        pattern: "주어 + decided + to become + 보어",
        answer: "Minwoo decided to become a great writer.",
        blocks: ["Minwoo", "decided", "to become", "a great writer."]
      }
    },
    "2-3": {
      extraExamples: [
        { en: "I want to help my friends with their English homework.", ko: "나는 친구들의 영어 숙제를 도와주고 싶다." },
        { en: "He wants to learn how to play the violin.", ko: "그는 바이올린 연주하는 법을 배우고 싶어 한다." }
      ],
      drill: {
        ko: "그는 친구들의 새로운 꿈을 응원하고 싶었다.",
        pattern: "주어 + wanted + to support + 목적어",
        answer: "He wanted to support his friends' new dreams.",
        blocks: ["He", "wanted", "to support", "his friends' new dreams."]
      }
    },
    "2-4": {
      extraExamples: [
        { en: "The injured cat was rescued by kind firefighters.", ko: "다친 고양이는 친절한 소방관들에 의해 구조되었다." },
        { en: "This classroom was cleaned by the students yesterday.", ko: "이 교실은 어제 학생들에 의해 깨끗이 청소되었다." }
      ],
      drill: {
        ko: "그 어린 소년은 따뜻한 격려로 지지를 받았다.",
        pattern: "주어 + was supported + with 부사구",
        answer: "The young boy was supported with warm encouragement.",
        blocks: ["The young boy", "was supported", "with warm encouragement."]
      }
    },
    "3-2": {
      extraExamples: [
        { en: "He chose to stay at home and read a mystery novel.", ko: "그는 집에 머물며 추리 소설을 읽기로 선택했다." },
        { en: "They chose to plant colorful flowers in the garden.", ko: "그들은 정원에 다채로운 꽃을 심기로 선택했다." }
      ],
      drill: {
        ko: "그녀는 조용한 시골 마을에서 살기로 선택했다.",
        pattern: "주어 + chose + to live + in 장소",
        answer: "She chose to live in a quiet country town.",
        blocks: ["She", "chose", "to live", "in a quiet country town."]
      }
    },
    "3-3": {
      extraExamples: [
        { en: "Vincent loved painting landscapes under the warm sun.", ko: "빈센트는 따스한 햇살 아래 풍경을 그리는 것을 사랑했다." },
        { en: "The artist loves mixing bright yellow and deep blue colors.", ko: "그 화가는 밝은 노란색과 짙은 파란색 섞는 것을 무척 좋아한다." }
      ],
      drill: {
        ko: "그는 햇빛 아래에서 아름다운 꽃들을 그리는 것을 무척 좋아했다.",
        pattern: "주어 + loved + painting + 목적어 + under sunlight",
        answer: "He loved painting beautiful flowers under the sunlight.",
        blocks: ["He", "loved", "painting", "beautiful flowers", "under the sunlight."]
      }
    },
    "3-4": {
      extraExamples: [
        { en: "Many famous portraits were painted by Rembrandt.", ko: "많은 유명한 초상화들이 렘브란트에 의해 그려졌다." },
        { en: "These wonderful poems were written by Emily Dickinson.", ko: "이 멋진 시들은 에밀리 디킨슨에 의해 쓰였다." }
      ],
      drill: {
        ko: "아름다운 해바라기 그림들이 그 화가에 의해 그려졌다.",
        pattern: "복수 주어 + were painted + by 행위자",
        answer: "Beautiful sunflower pictures were painted by the artist.",
        blocks: ["Beautiful sunflower pictures", "were painted", "by the artist."]
      }
    },
    "4-2": {
      extraExamples: [
        { en: "The children started singing cheerful songs together.", ko: "아이들은 다 함께 신나는 노래를 부르기 시작했다." },
        { en: "She started writing an exciting fantasy story last night.", ko: "그녀는 어젯밤 흥미진진한 판타지 이야기를 쓰기 시작했다." }
      ],
      drill: {
        ko: "그는 회오리치는 별들과 빛나는 달을 그리기 시작했다.",
        pattern: "주어 + started + drawing(동명사) + spinning stars and a glowing moon",
        answer: "He started drawing spinning stars and a glowing moon.",
        blocks: ["He", "started", "drawing", "spinning stars", "and", "a glowing moon."]
      }
    },
    "4-3": {
      extraExamples: [
        { en: "The famous novel was written in just two months.", ko: "그 유명한 소설은 단 두 달 만에 쓰였다." },
        { en: "This special sculpture was made of recycled wood.", ko: "이 특별한 조각품은 재활용된 나무로 제작되었다." }
      ],
      drill: {
        ko: "그의 위대한 걸작은 이 특별한 장소에서 탄생했다.",
        pattern: "주어 + was created + at this special place",
        answer: "His great masterpiece was created at this special place.",
        blocks: ["His great masterpiece", "was created", "at this special place."]
      }
    },
    "5-2": {
      extraExamples: [
        { en: "Ancient golden treasures are exhibited in the national museum.", ko: "고대 황금 보물들이 국립박물관에 전시되어 있다." },
        { en: "His original sketches are displayed in the modern gallery.", ko: "그의 원본 스케치들이 현대 미술관에 전시되어 있다." }
      ],
      drill: {
        ko: "그의 예술 작품들은 전 세계의 유명한 미술관들에 전시되어 있다.",
        pattern: "복수 주어 + are exhibited + in famous museums worldwide",
        answer: "His artworks are exhibited in famous museums worldwide.",
        blocks: ["His artworks", "are exhibited", "in famous museums", "worldwide."]
      }
    },
    "5-3": {
      extraExamples: [
        { en: "His warm story has touched the hearts of many readers.", ko: "그의 따뜻한 이야기는 많은 독자들의 마음을 감동시켜 왔다." },
        { en: "The doctor has helped thousands of sick children so far.", ko: "그 의사는 지금까지 수천 명의 아픈 아이들을 치료해 왔다." }
      ],
      drill: {
        ko: "그의 열정적인 예술은 수백만 사람들의 마음을 감동시켰다.",
        pattern: "단수 주어 + has touched + the hearts of millions",
        answer: "His passionate art has touched the hearts of millions.",
        blocks: ["His passionate art", "has touched", "the hearts of millions."]
      }
    },
    "5-4": {
      extraExamples: [
        { en: "Her bold ideas have inspired young scientists around the world.", ko: "그녀의 대담한 아이디어는 전 세계 젊은 과학자들에게 영감을 주어왔다." },
        { en: "The teacher's warm words have encouraged many students.", ko: "선생님의 따뜻한 말씀은 많은 학생들에게 큰 격려가 되어왔다." }
      ],
      drill: {
        ko: "그의 찬란한 색채들은 여러 세대의 화가들에게 영감을 주어왔다.",
        pattern: "복수 주어 + have inspired + generations of artists",
        answer: "His brilliant colors have inspired generations of artists.",
        blocks: ["His brilliant colors", "have inspired", "generations of artists."]
      }
    },
    "5-5": {
      extraExamples: [
        { en: "She went to the library to borrow some science books.", ko: "그녀는 과학책을 몇 권 빌리기 위해 도서관에 갔다." },
        { en: "People travel to Paris to see famous art pieces.", ko: "사람들은 유명한 예술 작품들을 보기 위해 파리로 여행을 간다." }
      ],
      drill: {
        ko: "많은 여행자들이 그의 꺼지지 않는 열정을 느끼기 위해 방문한다.",
        pattern: "주어 + visit + 목적어 + to feel ~",
        answer: "Many travelers visit his museum to feel his undying passion.",
        blocks: ["Many travelers", "visit his museum", "to feel his undying passion."]
      }
    }
  };

  // ── 청크 끊어읽기 데이터 (문장 정복용) ──
  const CHUNKS_DB = {
    "1-1": ["Vincent van Gogh", "was born", "in the village of Zundert", "in 1853."],
    "1-3": ["As a boy,", "Vincent enjoyed walking", "through the green fields."],
    "2-2": ["At twenty-seven,", "he decided", "to become a painter."],
    "2-4": ["He was supported", "by Theo", "with warm words and money."],
    "3-2": ["He chose", "to live", "in a bright yellow house there."],
    "3-3": ["He loved", "painting sunflowers", "under the warm golden sunlight."],
    "3-4": ["Brilliant sunflower pictures", "were painted by Vincent", "during this time."],
    "4-3": ["His great masterpiece The Starry Night", "was created", "at this special place."],
    "5-3": ["His passionate art", "has touched", "the hearts of millions of people."],
    "5-5": ["Every year", "travelers visit his museum", "to feel his undying passion."]
  };

  // ── 메인 UI 구축 및 초기화 ──
  function initMasteryEngine() {
    VoiceEngine.init();
    buildBrandBar();
    buildDictDrawerAndSheet();
    buildMasteryModals();
    enhanceParagraphs();
    initClassroomNoiseSupport();
    injectUnitExamBanner();
    injectSummaryPrintButton();
    VoiceEngine.syncUI();
  }

  function injectSummaryPrintButton() {
    const summarySec = document.getElementById("stage-summary");
    if (!summarySec || document.getElementById("btn-summary-print-custom")) return;

    const cards = summarySec.querySelectorAll(".summary-card");
    if (cards.length > 0) {
      const lastCard = cards[cards.length - 1];
      const wrap = document.createElement("div");
      wrap.style.cssText = "margin-top:16px";
      wrap.innerHTML = `
        <button type="button" class="btn-primary" id="btn-summary-print-custom" style="width:100%;padding:11px 16px;font-size:13.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>오늘 학습 맞춤 시험지 인쇄 스튜디오 열기 (A4)</span>
        </button>
      `;
      lastCard.appendChild(wrap);

      document.getElementById("btn-summary-print-custom").onclick = openPrintStudioModal;
    }
  }

  // 1. 브랜드 헤더 상단 바 삽입 (미니멀 SVG 아이콘 버튼 & 옵션 드롭다운)
  function buildBrandBar() {
    const appEl = document.getElementById("app");
    if (!appEl) return;

    const brandBar = document.createElement("div");
    brandBar.className = "yeon-brand-bar";
    brandBar.innerHTML = `
      <div class="yeon-brand-logo">
        <div class="yeon-academy-logo-badge" title="연플래닝 아카데미">
          <img src="img/yeonplanning-academy.png" alt="연플래닝 아카데미" class="yeon-academy-logo-img" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\'yeon-academy-mark-txt\'>연</span>';">
        </div>
        <span class="yeon-brand-title-rec">추천 이야기 영어</span>
      </div>
      <div class="yeon-quick-tools">
        <!-- 0. 학생 계정 칩 (원터치 전환 & 기기 인증 배지) -->
        <button type="button" class="btn-student-profile" id="btn-open-student-auth" title="학생 계정 전환 및 기기 인증">
          <span class="student-avatar-icon">${Y_SVG.user(15)}</span>
          <span id="top-student-name">학생 로그인</span>
          <span class="device-cert-badge" title="연플래닝 기기 인증 완료">✓</span>
        </button>

        <!-- 1. 내 단어장 SVG 아이콘 (Lucide Minimal Line) -->
        <button type="button" class="btn-tool-icon" id="btn-open-wordbank" title="내 단어장 (별표 단어 & 3초 깜빡이 드릴)" aria-label="내 단어장">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span class="tool-badge" id="saved-vocab-count" style="display:none">0</span>
        </button>

        <!-- 2. 내 문장집 SVG 아이콘 (Lucide Minimal Line) -->
        <button type="button" class="btn-tool-icon" id="btn-open-scrapbook" title="내 문장집 (스크랩 문장 & 4단계 정복 챌린지)" aria-label="내 문장집">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="tool-badge" id="saved-sen-count" style="display:none">0</span>
        </button>

        <!-- 3. 단원 시험 SVG 아이콘 (Lucide Minimal Line) -->
        <button type="button" class="btn-tool-icon" id="btn-open-unittest" title="단원 총괄 평가 (10문항 CBT 실전 모의고사)" aria-label="단원 시험">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </button>

        <!-- 4. 옵션/더보기 드롭다운 (Lucide Minimal Line 슬라이더) -->
        <div class="yeon-options-wrap">
          <button type="button" class="btn-tool-icon" id="btn-open-options-menu" title="학습 도구 및 추가 옵션 (인쇄·소음·보이스)" aria-label="옵션 메뉴">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </button>
          <div class="yeon-options-dropdown" id="yeon-options-dropdown">
            <button type="button" class="opt-drop-item" id="opt-menu-student">
              <span class="opt-drop-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <div class="opt-drop-info">
                <div class="opt-drop-title">학생 계정 관리 <span style="font-size:11px;color:#10b981;font-weight:700">기기 인증됨 ✓</span></div>
                <div class="opt-drop-desc" id="opt-student-desc">학생 아이디로 로그인 / 전환</div>
              </div>
            </button>
            <button type="button" class="opt-drop-item" id="opt-menu-print">
              <span class="opt-drop-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
              </span>
              <div class="opt-drop-info">
                <div class="opt-drop-title">맞춤 학습지 인쇄 스튜디오</div>
                <div class="opt-drop-desc">단어·문장·오답클리닉 A4 시험지 출력</div>
              </div>
            </button>
            <button type="button" class="opt-drop-item" id="opt-menu-noise">
              <span class="opt-drop-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </span>
              <div class="opt-drop-info">
                <div class="opt-drop-title">강의실 소음 제어 & 마이크 설정</div>
                <div class="opt-drop-desc">3단계 감도 조절 및 0.5점 미세 채점</div>
              </div>
            </button>
            <button type="button" class="opt-drop-item" id="opt-menu-voice">
              <span class="opt-drop-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <div class="opt-drop-info">
                <div class="opt-drop-title">원어민 목소리 전환</div>
                <div class="opt-drop-desc" id="opt-voice-desc">현재: 여성 목소리 (클릭 시 변경)</div>
              </div>
            </button>
            <button type="button" class="opt-drop-item" id="opt-menu-listen-all">
              <span class="opt-drop-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                </svg>
              </span>
              <div class="opt-drop-info">
                <div class="opt-drop-title">전체 본문 연속 듣기</div>
                <div class="opt-drop-desc">1문단 ~ 5문단 완독 재생</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;
    appEl.insertBefore(brandBar, appEl.firstChild);

    updateCounters();
    document.getElementById("btn-open-student-auth").addEventListener("click", openStudentAuthModal);
    document.getElementById("btn-open-wordbank").addEventListener("click", openWordBankModal);
    document.getElementById("btn-open-scrapbook").addEventListener("click", openScrapbookModal);
    document.getElementById("btn-open-unittest").addEventListener("click", openUnitTestModal);
    document.getElementById("opt-menu-student").addEventListener("click", () => {
      optDrop.classList.remove("open");
      openStudentAuthModal();
    });

    // 옵션 드롭다운 토글 및 항목 연동
    const optBtn = document.getElementById("btn-open-options-menu");
    const optDrop = document.getElementById("yeon-options-dropdown");
    if (optBtn && optDrop) {
      optBtn.addEventListener("click", e => {
        e.stopPropagation();
        optDrop.classList.toggle("open");
        updateVoiceDesc();
      });
      document.addEventListener("click", e => {
        if (!optDrop.contains(e.target) && e.target !== optBtn) {
          optDrop.classList.remove("open");
        }
      });
    }

    function updateVoiceDesc() {
      const vDesc = document.getElementById("opt-voice-desc");
      if (vDesc) {
        vDesc.textContent = `현재: ${VoiceEngine.gender === 'female' ? '여성 목소리' : '남성 목소리'} (클릭 시 변경)`;
      }
    }

    document.getElementById("opt-menu-print").addEventListener("click", () => {
      optDrop.classList.remove("open");
      openPrintStudioModal();
    });
    document.getElementById("opt-menu-noise").addEventListener("click", () => {
      optDrop.classList.remove("open");
      openNoiseModal();
    });
    document.getElementById("opt-menu-voice").addEventListener("click", () => {
      const nextGender = VoiceEngine.gender === "female" ? "male" : "female";
      VoiceEngine.setGender(nextGender);
      updateVoiceDesc();
      speak(nextGender === "female" ? "Switched to female voice." : "Switched to male voice.", 0.9);
    });
    document.getElementById("opt-menu-listen-all").addEventListener("click", () => {
      optDrop.classList.remove("open");
      AudioPlaybackManager.playAll();
    });

    updateStudentUI();
    setTimeout(hookMenusetOpt, 600);
    setInterval(hookMenusetOpt, 2500);
  }

  function updateCounters() {
    const vCount = Storage.get("saved_vocab", []).length;
    const sCount = Storage.get("saved_sentences", []).length;
    const elV = document.getElementById("saved-vocab-count");
    const elS = document.getElementById("saved-sen-count");
    if (elV) {
      elV.textContent = vCount;
      elV.style.display = vCount > 0 ? "inline-flex" : "none";
    }
    if (elS) {
      elS.textContent = sCount;
      elS.style.display = sCount > 0 ? "inline-flex" : "none";
    }
  }

  // 2. 우측 슬라이드 영한 서랍 & 하단 영영 시트 생성
  function buildDictDrawerAndSheet() {
    // Drawer Overlay & Panel
    const overlay = document.createElement("div");
    overlay.className = "dict-drawer-overlay";
    overlay.id = "dict-drawer-overlay";

    const drawer = document.createElement("div");
    drawer.className = "dict-drawer";
    drawer.id = "dict-drawer";
    drawer.innerHTML = `
      <div class="dict-drawer-header">
        <h3>${Y_SVG.book(16)} 연라이프 영한 사전</h3>
        <button type="button" class="dict-drawer-close" id="btn-dict-drawer-close">&times;</button>
      </div>
      <div class="dict-drawer-body" id="dict-drawer-body"></div>
      <div class="dict-drawer-footer">
        <button type="button" class="btn-primary" id="btn-drawer-speak" style="flex:1">${Y_SVG.speaker(14)} 원어민 발음</button>
        <button type="button" class="btn-secondary" id="btn-drawer-close-bottom">닫기</button>
      </div>
    `;

    // Bottom Sheet (Easy English)
    const sheet = document.createElement("div");
    sheet.className = "dict-bottom-sheet";
    sheet.id = "dict-bottom-sheet";
    sheet.innerHTML = `
      <div class="dict-sheet-head">
        <span class="dict-sheet-word" id="dict-sheet-word">Word</span>
        <button type="button" class="dict-sheet-close" id="btn-dict-sheet-close">&times;</button>
      </div>
      <div class="dict-sheet-desc" id="dict-sheet-desc"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    document.body.appendChild(sheet);

    // Close handlers
    overlay.addEventListener("click", closeDictDrawer);
    document.getElementById("btn-dict-drawer-close").addEventListener("click", closeDictDrawer);
    document.getElementById("btn-drawer-close-bottom").addEventListener("click", closeDictDrawer);
    document.getElementById("btn-dict-sheet-close").addEventListener("click", () => {
      sheet.classList.remove("open");
    });
  }

  // 단어 클릭 시 사전 열기
  window.openYeonDict = function (rawWord) {
    const clean = rawWord.toLowerCase().replace(/[^a-z\s\-]/g, "").trim();
    let data = DICT_DB[clean];
    if (!data) {
      // Find by prefix or base form
      for (let k in DICT_DB) {
        if (clean.startsWith(k) || k.startsWith(clean)) {
          data = DICT_DB[k];
          break;
        }
      }
    }
    if (!data) {
      data = {
        en: rawWord,
        pron: "/-/",
        pos: "단어",
        meanings: ["본문 수록 단어"],
        easy_en: "A word from the story of Vincent van Gogh.",
        synonyms: "-",
        example_en: `This word appears in the story of Vincent van Gogh.`,
        example_ko: "이 단어는 빈센트 반 고흐 이야기 본문에 등장합니다."
      };
    }

    const drawerBody = document.getElementById("dict-drawer-body");
    const savedList = Storage.get("saved_vocab", []);
    const isSaved = savedList.includes(data.en);

    drawerBody.innerHTML = `
      <div class="dict-word-head">
        <div>
          <h2 class="dict-word-en">${data.en}</h2>
          <div class="dict-word-pron">${data.pron}</div>
        </div>
        <button type="button" class="dict-btn-star ${isSaved ? 'saved' : ''}" id="btn-toggle-save-word" data-word="${data.en}">
          ${isSaved ? Y_SVG.star(13, 'currentColor') + ' 저장됨' : Y_SVG.star(13) + ' 내 단어장'}
        </button>
      </div>

      <div class="dict-sec">
        <div class="dict-sec-title">우리말 핵심 뜻</div>
        <ol class="dict-meanings-list">
          ${data.meanings.map(m => `<li><span class="dict-pos-tag">${data.pos}</span>${m}</li>`).join("")}
        </ol>
      </div>

      <div class="dict-sec">
        <div class="dict-sec-title">Easy English Definition (영영 풀이)</div>
        <div class="dict-easy-en-box">${data.easy_en}</div>
      </div>

      <div class="dict-sec">
        <div class="dict-sec-title">대표 유의어 (Synonyms)</div>
        <div style="font-size:13px;color:#334155;">${data.synonyms || "-"}</div>
      </div>

      <div class="dict-sec">
        <div class="dict-sec-title">본문 예문 (Context)</div>
        <div class="dict-example-box">
          <div class="dict-example-en">${data.example_en}</div>
          <div class="dict-example-ko">${data.example_ko}</div>
        </div>
      </div>
    `;

    // Speak button
    document.getElementById("btn-drawer-speak").onclick = () => speak(data.en, 0.8);

    // Save toggle
    document.getElementById("btn-toggle-save-word").onclick = function () {
      let list = Storage.get("saved_vocab", []);
      if (list.includes(data.en)) {
        list = list.filter(w => w !== data.en);
        this.classList.remove("saved");
        this.innerHTML = Y_SVG.star(13) + " 내 단어장";
      } else {
        list.push(data.en);
        this.classList.add("saved");
        this.innerHTML = Y_SVG.star(13, 'currentColor') + " 저장됨";
      }
      Storage.set("saved_vocab", list);
      updateCounters();
    };

    // Open Drawer & Bottom Sheet
    document.getElementById("dict-drawer").classList.add("open");
    document.getElementById("dict-drawer-overlay").classList.add("open");

    // Also update bottom sheet
    const sheet = document.getElementById("dict-bottom-sheet");
    document.getElementById("dict-sheet-word").textContent = data.en + " " + data.pron;
    document.getElementById("dict-sheet-desc").innerHTML = `<em>Easy English:</em> ${data.easy_en}`;
    sheet.classList.add("open");

    // Pronounce word once on open
    speak(data.en, 0.85);
  };

  function closeDictDrawer() {
    document.getElementById("dict-drawer").classList.remove("open");
    document.getElementById("dict-drawer-overlay").classList.remove("open");
  }

  // 3. 본문 문단 개선 : 4단계 청취(전체·한문단·한문장·단어) & 하단 오디오 제어 독 & X-Ray 문법 렌즈 장착
  function enhanceParagraphs() {
    const root = document.getElementById("read-paragraphs-root");
    if (!root) return;

    // 1단계 읽기 툴바에 [🎧 전체 문단 연속 듣기] 버튼 주입
    const readToolbar = document.querySelector(".read-toolbar");
    if (readToolbar && !document.getElementById("btn-listen-all-paragraphs")) {
      const audioWrap = document.createElement("div");
      audioWrap.style.cssText = "margin-top:10px;width:100%;display:flex;gap:8px;align-items:center;flex-wrap:wrap";
      audioWrap.innerHTML = `
        <button type="button" class="btn-listen-all" id="btn-listen-all-paragraphs" style="flex:1;justify-content:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:6px"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          <span>전체 본문 연속 듣기 (1문단 ~ 5문단 완독)</span>
        </button>
        <button type="button" class="btn-toggle-voice" id="btn-toggle-voice-top" title="목소리 변경 (여성 / 남성)" style="background:#f7f4ee;border:1px solid #dcd5cb;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:700;color:#38322a;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span id="voice-top-label">${VoiceEngine.gender === 'female' ? '여성 목소리' : '남성 목소리'}</span>
        </button>
      `;
      readToolbar.appendChild(audioWrap);

      document.getElementById("btn-listen-all-paragraphs").onclick = function () {
        AudioPlaybackManager.playAll();
      };

      document.getElementById("btn-toggle-voice-top").onclick = function () {
        const nextGender = VoiceEngine.gender === "female" ? "male" : "female";
        VoiceEngine.setGender(nextGender);
        if (AudioPlaybackManager.isPlaying && !AudioPlaybackManager.isPaused) {
          AudioPlaybackManager.replay();
        } else {
          speak(nextGender === "female" ? "Switched to female voice." : "Switched to male voice.", 0.9);
        }
      };
    }

    // Delegate click on words, scrap buttons, sentence audio buttons, paragraph audio buttons
    root.addEventListener("click", e => {
      // 0. 문법 렌즈 활성화 상태에서 핵심 문법 형광펜(xr-hl) 클릭 -> 문법 해설 팝업 오픈!
      const card = e.target.closest(".paragraph-card");
      const hlChunk = e.target.closest(".xr-chunk.xr-hl");
      if (card && card.classList.contains("lens-active") && hlChunk) {
        e.stopPropagation();
        e.preventDefault();
        openGrammarSpotlightModal(hlChunk);
        return;
      }

      // 1. 단어 클릭 시 즉시 원어민 발음 듣기 & 2원화 사전 열기
      const wordEl = e.target.closest(".v-word");
      if (wordEl) {
        const raw = wordEl.getAttribute("data-w");
        speak(raw, 0.85); // 단어 클릭 시 발음 재생
        window.openYeonDict(raw);
        return;
      }

      // 2. 한 문장 듣기 (🔊 버튼 클릭) -> 하단 오디오 제어 독 팝업
      const senAudioBtn = e.target.closest(".btn-listen-sen");
      if (senAudioBtn) {
        const sid = senAudioBtn.getAttribute("data-sid");
        AudioPlaybackManager.playSentence(sid);
        return;
      }

      // 3. 문단 마다 한 문단 듣기 (🎧 문단 듣기 버튼 클릭) -> 하단 오디오 제어 독 팝업
      const pListenBtn = e.target.closest(".btn-p-listen");
      if (pListenBtn) {
        const pno = +pListenBtn.getAttribute("data-pno");
        AudioPlaybackManager.playParagraph(pno);
        return;
      }

      // 4. 문장 스크랩 버튼 클릭
      const scrapBtn = e.target.closest(".btn-scrap-sen");
      if (scrapBtn) {
        const sid = scrapBtn.getAttribute("data-sid");
        toggleScrapSentence(sid, scrapBtn);
        return;
      }

      // 5. X-Ray chunk tooltip click
      const chunkEl = e.target.closest(".xr-chunk");
      if (chunkEl && chunkEl.getAttribute("data-why") && !e.target.closest(".v-word")) {
        const why = chunkEl.getAttribute("data-why");
        alert("🔍 [문법 포인트 해설]\n\n" + why);
      }
    });

    // Observer to inject toolbars once paragraphs are rendered by app.js
    const timer = setInterval(() => {
      const cards = root.querySelectorAll(".paragraph-card");
      if (cards.length >= 5) {
        clearInterval(timer);
        cards.forEach((card, idx) => {
          injectParagraphControls(card, idx + 1);
        });
      }
    }, 150);
  }

  // ── [오디오 플레이백 매니저 & 하단 플로팅 플레이어 제어] ──
  const AudioPlaybackManager = {
    mode: "idle", // "all", "paragraph", "sentence"
    allSentences: [], // [{ sid, pno, en, ko }]
    currentIdx: 0,
    isPlaying: false,
    isPaused: false,
    speed: 0.85,
    repeatMax: 1,
    repeatCurrent: 0,
    targetPno: 1,

    init() {
      if (this.allSentences.length === 0 && B && B.paragraphs) {
        B.paragraphs.forEach(p => {
          p.sentences.forEach(s => {
            this.allSentences.push({ sid: s.id, pno: p.no, en: s.en, ko: s.ko });
          });
        });
      }
    },

    playSentence(sid) {
      this.init();
      const idx = this.allSentences.findIndex(s => s.sid === sid);
      if (idx === -1) return;
      if (this.isPlaying && this.mode === "sentence" && this.currentIdx === idx) {
        this.stop();
        return;
      }
      this.mode = "sentence";
      this.currentIdx = idx;
      this.repeatCurrent = 0;
      this.playCurrent();
    },

    playParagraph(pno) {
      this.init();
      if (this.isPlaying && this.mode === "paragraph" && this.targetPno === pno) {
        this.stop();
        return;
      }
      const idx = this.allSentences.findIndex(s => s.pno === pno);
      if (idx === -1) return;
      this.mode = "paragraph";
      this.targetPno = pno;
      this.currentIdx = idx;
      this.repeatCurrent = 0;
      this.playCurrent();
    },

    playAll() {
      this.init();
      if (this.isPlaying && this.mode === "all") {
        this.stop();
        return;
      }
      this.mode = "all";
      this.currentIdx = 0;
      this.repeatCurrent = 0;
      this.playCurrent();
    },

    currentAudio: null,

    stopAudioElement() {
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch(e) {}
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio = null;
      }
    },

    playCurrent() {
      if (this.currentIdx < 0 || this.currentIdx >= this.allSentences.length) {
        this.stop();
        return;
      }

      const cur = this.allSentences[this.currentIdx];
      this.isPlaying = true;
      this.isPaused = false;

      // 1. 하단 오디오 제어 팝업 바 즉시 오픈
      const dock = document.getElementById("floating-audio-dock");
      if (dock) dock.classList.add("open");

      const tagEl = document.getElementById("audio-dock-tag");
      const textEl = document.getElementById("audio-dock-text");
      const toggleBtn = document.getElementById("btn-dock-toggle");

      if (tagEl) {
        const modeLabel = this.mode === "all" ? "전체 낭독" : (this.mode === "paragraph" ? `문단 ${cur.pno}` : "한 문장");
        tagEl.innerHTML = `${Y_SVG.headphones(13)} [${modeLabel}] ${cur.sid}`;
      }
      if (textEl) textEl.textContent = cur.en;
      if (toggleBtn) toggleBtn.innerHTML = Y_SVG.pause(14);

      // 2. 화면 하이라이트 (문장 & 문단)
      document.querySelectorAll(".sentence-item.speaking").forEach(el => el.classList.remove("speaking"));
      document.querySelectorAll(".paragraph-card.speaking").forEach(el => el.classList.remove("speaking"));
      document.querySelectorAll(".btn-listen-sen.playing").forEach(el => {
        el.classList.remove("playing");
        el.innerHTML = Y_SVG.speaker(13);
      });

      const senEl = document.querySelector(`.sentence-item[data-sid="${cur.sid}"]`);
      if (senEl) {
        senEl.classList.add("speaking");
        senEl.scrollIntoView({ behavior: "smooth", block: "center" });
        const senBtn = senEl.querySelector(".btn-listen-sen");
        if (senBtn) {
          senBtn.classList.add("playing");
          senBtn.innerHTML = Y_SVG.speaker(13);
        }
      }

      const pCard = document.getElementById("read-p-" + cur.pno);
      if (pCard) pCard.classList.add("speaking");

      // 3. 상단 버튼 UI 동기화
      const allBtn = document.getElementById("btn-listen-all-paragraphs");
      if (allBtn) {
        if (this.mode === "all") {
          allBtn.classList.add("playing");
          allBtn.innerHTML = `${Y_SVG.stop(14)} <span>전체 낭독 정지</span>`;
        } else {
          allBtn.classList.remove("playing");
          allBtn.innerHTML = `${Y_SVG.headphones(15)} <span>전체 본문 연속 듣기 (1문단 ~ 5문단 완독)</span>`;
        }
      }

      // 4. 고품질 미국식 스튜디오 뉴럴 오디오 우선 재생 (실패 시 미국식 표준 TTS 자동 폴백)
      this.stopAudioElement();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();

      const gender = VoiceEngine.gender;
      const audioUrl = `audio/${gender}/s${cur.sid}.mp3`;
      let hasEnded = false;

      const handleEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        this.stopAudioElement();
        if (!this.isPlaying || this.isPaused) return;

        // 반복 청취 체크
        this.repeatCurrent++;
        if (this.repeatCurrent < this.repeatMax) {
          setTimeout(() => this.playCurrent(), 400);
          return;
        }
        this.repeatCurrent = 0;

        // 모드별 진행
        if (this.mode === "all") {
          this.currentIdx++;
          if (this.currentIdx < this.allSentences.length) {
            setTimeout(() => this.playCurrent(), 600);
          } else {
            this.stop();
            alert("1문단부터 5문단까지 본문 전체 듣기가 완료되었습니다.");
          }
        } else if (this.mode === "paragraph") {
          this.currentIdx++;
          if (this.currentIdx < this.allSentences.length && this.allSentences[this.currentIdx].pno === this.targetPno) {
            setTimeout(() => this.playCurrent(), 600);
          } else {
            this.stop();
          }
        } else {
          this.stop();
        }
      };

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.playbackRate = this.speed;
      audio.onended = handleEnd;

      audio.onerror = () => {
        // 오디오 파일 로드 실패 시 고품질 미국식 TTS로 자동 대체
        this.stopAudioElement();
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(cur.en);
          VoiceEngine.applyToUtterance(u);
          u.rate = this.speed;
          u.onend = handleEnd;
          u.onerror = () => { if (this.isPlaying) this.stop(); };
          window.speechSynthesis.speak(u);
        } else {
          this.stop();
        }
      };

      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          this.stopAudioElement();
          if ("speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(cur.en);
            VoiceEngine.applyToUtterance(u);
            u.rate = this.speed;
            u.onend = handleEnd;
            u.onerror = () => { if (this.isPlaying) this.stop(); };
            window.speechSynthesis.speak(u);
          }
        });
      }
    },

    togglePlayPause() {
      if (!this.isPlaying) {
        if (this.allSentences.length > 0) this.playCurrent();
        return;
      }

      const toggleBtn = document.getElementById("btn-dock-toggle");
      if (this.isPaused) {
        this.isPaused = false;
        if (this.currentAudio) this.currentAudio.play();
        if ("speechSynthesis" in window) window.speechSynthesis.resume();
        if (toggleBtn) toggleBtn.innerHTML = Y_SVG.pause(14);
      } else {
        this.isPaused = true;
        if (this.currentAudio) this.currentAudio.pause();
        if ("speechSynthesis" in window) window.speechSynthesis.pause();
        if (toggleBtn) toggleBtn.innerHTML = Y_SVG.play(14);
      }
    },

    stop() {
      this.isPlaying = false;
      this.isPaused = false;
      this.stopAudioElement();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();

      document.querySelectorAll(".sentence-item.speaking").forEach(el => el.classList.remove("speaking"));
      document.querySelectorAll(".paragraph-card.speaking").forEach(el => el.classList.remove("speaking"));
      document.querySelectorAll(".btn-listen-sen.playing").forEach(el => {
        el.classList.remove("playing");
        el.innerHTML = Y_SVG.speaker(13);
      });
      document.querySelectorAll(".btn-p-listen").forEach(el => {
        el.innerHTML = `${Y_SVG.headphones(13)} <span>문단 듣기</span>`;
      });
      const allBtn = document.getElementById("btn-listen-all-paragraphs");
      if (allBtn) {
        allBtn.classList.remove("playing");
        allBtn.innerHTML = `${Y_SVG.headphones(15)} <span>전체 본문 연속 듣기 (1문단 ~ 5문단 완독)</span>`;
      }

      // 하단 독 닫기
      const dock = document.getElementById("floating-audio-dock");
      if (dock) dock.classList.remove("open");
    },

    prev() {
      if (this.currentIdx > 0) {
        this.currentIdx--;
        this.repeatCurrent = 0;
        this.playCurrent();
      }
    },

    next() {
      if (this.currentIdx < this.allSentences.length - 1) {
        this.currentIdx++;
        this.repeatCurrent = 0;
        this.playCurrent();
      }
    },

    replay() {
      this.repeatCurrent = 0;
      this.playCurrent();
    }
  };

  function initAudioDockEvents() {
    const dock = document.getElementById("floating-audio-dock");
    if (!dock) return;

    document.getElementById("btn-dock-close").onclick = () => AudioPlaybackManager.stop();
    document.getElementById("btn-dock-toggle").onclick = () => AudioPlaybackManager.togglePlayPause();
    document.getElementById("btn-dock-stop").onclick = () => AudioPlaybackManager.stop();
    document.getElementById("btn-dock-prev").onclick = () => AudioPlaybackManager.prev();
    document.getElementById("btn-dock-next").onclick = () => AudioPlaybackManager.next();
    document.getElementById("btn-dock-replay").onclick = () => AudioPlaybackManager.replay();

    // 목소리 선택 (여성 vs 남성)
    const voicePills = document.getElementById("dock-voice-pills");
    if (voicePills) {
      voicePills.addEventListener("click", e => {
        const btn = e.target.closest(".dock-pill");
        if (!btn) return;
        const g = btn.getAttribute("data-voice") || "female";
        VoiceEngine.setGender(g);
        if (AudioPlaybackManager.isPlaying && !AudioPlaybackManager.isPaused) {
          AudioPlaybackManager.replay();
        } else {
          speak(g === "female" ? "Female voice selected." : "Male voice selected.", 0.9);
        }
      });
    }

    // 속도 선택 0.7x, 0.85x, 1.0x
    document.getElementById("dock-speed-pills").addEventListener("click", e => {
      const btn = e.target.closest(".dock-pill");
      if (!btn) return;
      document.querySelectorAll("#dock-speed-pills .dock-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const rate = parseFloat(btn.getAttribute("data-rate")) || 0.85;
      AudioPlaybackManager.speed = rate;
      Storage.set("listen_speed", rate);
      if (AudioPlaybackManager.isPlaying && !AudioPlaybackManager.isPaused) {
        AudioPlaybackManager.playCurrent();
      }
    });

    // 반복 선택 1회, 2회, 3회, 5회
    document.getElementById("dock-repeat-pills").addEventListener("click", e => {
      const btn = e.target.closest(".dock-pill");
      if (!btn) return;
      document.querySelectorAll("#dock-repeat-pills .dock-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const rep = parseInt(btn.getAttribute("data-repeat"), 10) || 1;
      AudioPlaybackManager.repeatMax = rep;
    });
  }

  function injectParagraphControls(card, pno) {
    if (card.querySelector(".grammar-lens-toolbar")) return;

    // 1. Inject Grammar Lens & Retell Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "grammar-lens-toolbar";
    toolbar.innerHTML = `
      <label class="grammar-lens-toggle">
        <input type="checkbox" class="chk-grammar-lens" data-pno="${pno}">
        ${Y_SVG.search(13)} <span>문법 렌즈 (X-Ray)</span>
      </label>
      <div class="grammar-legend">
        <span class="gl-tag gl-subj">주어(S)</span>
        <span class="gl-tag gl-verb">동사(V)</span>
        <span class="gl-tag gl-obj">목적어(O)</span>
        <span class="gl-tag gl-mod">수식어(M)</span>
        <span class="gl-tag gl-hl" title="to부정사·동명사·수동태 등 중2 핵심 출제 문법">★핵심문법</span>
      </div>
    `;

    const senList = card.querySelector(".sentences-list");
    if (senList) {
      card.insertBefore(toolbar, senList);

      // Transform sentences into tokenized clickable words + scrap & listen buttons
      const senItems = senList.querySelectorAll(".sentence-item");
      senItems.forEach(item => {
        const sid = item.getAttribute("data-sid");
        const enEl = item.querySelector(".sentence-en");
        if (!enEl) return;

        // 1. Sentence Audio Listen Button (한 문장 듣기 - 맨 앞에 배치)
        const listenBtn = document.createElement("button");
        listenBtn.type = "button";
        listenBtn.className = "btn-listen-sen";
        listenBtn.setAttribute("data-sid", sid);
        listenBtn.title = "이 문장 듣기";
        listenBtn.innerHTML = Y_SVG.speaker(13);

        // 2. Add scrap button to sentence
        const savedSen = Storage.get("saved_sentences", []);
        const isSaved = savedSen.includes(sid);
        const scrapBtn = document.createElement("button");
        scrapBtn.type = "button";
        scrapBtn.className = "btn-scrap-sen" + (isSaved ? " saved" : "");
        scrapBtn.setAttribute("data-sid", sid);
        scrapBtn.innerHTML = isSaved ? `${Y_SVG.bookmark(11, 'currentColor')} <span>스크랩됨</span>` : `${Y_SVG.bookmark(11)} <span>스크랩</span>`;

        // Enhance English words to be clickable and place [🔊] at the very beginning
        enhanceSentenceText(enEl, sid, listenBtn, scrapBtn);
      });

      // Grammar Lens Toggle Listener
      const chk = toolbar.querySelector(".chk-grammar-lens");
      chk.addEventListener("change", () => {
        card.classList.toggle("lens-active", chk.checked);
        if (chk.checked) {
          applySyntaxHighlights(card, pno);
        } else {
          removeSyntaxHighlights(card, pno);
        }
      });
    }
  }

  function enhanceSentenceText(enEl, sid, optListenBtn, optScrapBtn) {
    let listenBtn = optListenBtn || enEl.querySelector(".btn-listen-sen");
    let scrapBtn = optScrapBtn || enEl.querySelector(".btn-scrap-sen");

    if (!listenBtn) {
      listenBtn = document.createElement("button");
      listenBtn.type = "button";
      listenBtn.className = "btn-listen-sen";
      listenBtn.setAttribute("data-sid", sid);
      listenBtn.title = "이 문장 듣기";
      listenBtn.innerHTML = Y_SVG.speaker(13);
    }
    if (!scrapBtn) {
      const savedSen = Storage.get("saved_sentences", []);
      const isSaved = savedSen.includes(sid);
      scrapBtn = document.createElement("button");
      scrapBtn.type = "button";
      scrapBtn.className = "btn-scrap-sen" + (isSaved ? " saved" : "");
      scrapBtn.setAttribute("data-sid", sid);
      scrapBtn.innerHTML = isSaved ? `${Y_SVG.bookmark(11, 'currentColor')} <span>스크랩됨</span>` : `${Y_SVG.bookmark(11)} <span>스크랩</span>`;
    }

    // 버튼을 제외한 순수 영문 텍스트 추출
    const clone = enEl.cloneNode(true);
    clone.querySelectorAll(".btn-listen-sen, .btn-scrap-sen").forEach(b => b.remove());
    const rawText = clone.textContent.trim();

    const tokens = rawText.split(/(\s+)/);
    const frag = document.createDocumentFragment();

    tokens.forEach(tok => {
      if (/^\s+$/.test(tok)) {
        frag.appendChild(document.createTextNode(tok));
      } else {
        const clean = tok.replace(/[^a-zA-Z]/g, "").toLowerCase();
        const span = document.createElement("span");
        span.className = "v-word" + (DICT_DB[clean] ? " is-core" : "");
        span.setAttribute("data-w", clean || tok);
        span.textContent = tok;
        frag.appendChild(span);
      }
    });

    enEl.innerHTML = "";
    enEl.appendChild(listenBtn); // [🔊] 문장 제일 앞에 배치
    enEl.appendChild(frag);      // 본문 텍스트 (단어별 탭)
    enEl.appendChild(scrapBtn);  // [📌 스크랩] 문장 끝에 배치
  }

  function applySyntaxHighlights(card, pno) {
    const senItems = card.querySelectorAll(".sentence-item");
    senItems.forEach(item => {
      const sid = item.getAttribute("data-sid");
      const syntax = SYNTAX_DATA[sid];
      if (!syntax) return;

      const enEl = item.querySelector(".sentence-en");
      let scrapBtn = enEl.querySelector(".btn-scrap-sen");
      let listenBtn = enEl.querySelector(".btn-listen-sen");

      if (!listenBtn) {
        listenBtn = document.createElement("button");
        listenBtn.type = "button";
        listenBtn.className = "btn-listen-sen";
        listenBtn.setAttribute("data-sid", sid);
        listenBtn.title = "이 문장 듣기";
        listenBtn.innerHTML = Y_SVG.speaker(13);
      }
      if (!scrapBtn) {
        const savedSen = Storage.get("saved_sentences", []);
        const isSaved = savedSen.includes(sid);
        scrapBtn = document.createElement("button");
        scrapBtn.type = "button";
        scrapBtn.className = "btn-scrap-sen" + (isSaved ? " saved" : "");
        scrapBtn.setAttribute("data-sid", sid);
        scrapBtn.innerHTML = isSaved ? `${Y_SVG.bookmark(11, 'currentColor')} <span>스크랩됨</span>` : `${Y_SVG.bookmark(11)} <span>스크랩</span>`;
      }

      let html = "";
      syntax.chunks.forEach(ch => {
        const hlClass = ch.hl ? " xr-hl" : "";
        const whyAttr = ch.why ? ` data-why="${escapeHtml(ch.why)}"` : "";
        const gnoAttr = ch.gNo ? ` data-gno="${ch.gNo}"` : "";
        const gnameAttr = ch.gName ? ` data-gname="${escapeHtml(ch.gName)}"` : "";
        const labelAttr = ch.label ? ` data-label="${escapeHtml(ch.label)}"` : "";
        const textAttr = ` data-text="${escapeHtml(ch.text)}"`;
        const sidAttr = ` data-sid="${sid}"`;
        const chunkWords = ch.text.split(/(\s+)/).map(tok => {
          if (/^\s+$/.test(tok)) return tok;
          const clean = tok.replace(/[^a-zA-Z]/g, "").toLowerCase();
          return `<span class="v-word${DICT_DB[clean] ? ' is-core' : ''}" data-w="${clean || tok}">${escapeHtml(tok)}</span>`;
        }).join("");
        html += `<span class="xr-chunk xr-${ch.role}${hlClass}" title="${escapeHtml(ch.label)}"${sidAttr}${textAttr}${labelAttr}${whyAttr}${gnoAttr}${gnameAttr}>${chunkWords}</span> `;
      });

      enEl.innerHTML = html;
      enEl.insertBefore(listenBtn, enEl.firstChild); // 문장 맨 앞에 [🔊]
      enEl.appendChild(scrapBtn);                   // 문장 맨 뒤에 [📌 스크랩]
    });
  }

  function removeSyntaxHighlights(card, pno) {
    const senItems = card.querySelectorAll(".sentence-item");
    senItems.forEach(item => {
      const sid = item.getAttribute("data-sid");
      const p = B.paragraphs.find(x => x.no === pno);
      const senObj = p ? p.sentences.find(s => s.id === sid) : null;
      if (senObj) {
        const enEl = item.querySelector(".sentence-en");
        enEl.textContent = senObj.en;
        enhanceSentenceText(enEl, sid);
      }
    });
  }

  // 문장 스크랩 토글
  function toggleScrapSentence(sid, btn) {
    let list = Storage.get("saved_sentences", []);
    if (list.includes(sid)) {
      list = list.filter(x => x !== sid);
      btn.classList.remove("saved");
      btn.innerHTML = `${Y_SVG.bookmark(11)} <span>스크랩</span>`;
    } else {
      list.push(sid);
      btn.classList.add("saved");
      btn.innerHTML = `${Y_SVG.bookmark(11, 'currentColor')} <span>스크랩됨</span>`;
    }
    Storage.set("saved_sentences", list);
    updateCounters();
  }

  // 4. 모달 시스템 생성 (내 단어장, 문장집, 프린트 스튜디오, 소음 제어)
  function buildMasteryModals() {
    // Word Bank Modal
    const wbModal = document.createElement("div");
    wbModal.className = "mastery-modal-overlay";
    wbModal.id = "wb-modal-overlay";
    wbModal.innerHTML = `
      <div class="mastery-modal">
        <div class="mastery-modal-head">
          <h3>${Y_SVG.star(16)} 내 단어장 & 3초 깜빡이 드릴</h3>
          <button type="button" class="dict-drawer-close" id="btn-close-wb-modal">&times;</button>
        </div>
        <div class="mastery-modal-body" id="wb-modal-body"></div>
      </div>
    `;

    // Scrapbook Modal
    const sbModal = document.createElement("div");
    sbModal.className = "mastery-modal-overlay";
    sbModal.id = "sb-modal-overlay";
    sbModal.innerHTML = `
      <div class="mastery-modal">
        <div class="mastery-modal-head">
          <h3>${Y_SVG.book(16)} 내 문장집 & 통문장 정복 4단계 챌린지</h3>
          <button type="button" class="dict-drawer-close" id="btn-close-sb-modal">&times;</button>
        </div>
        <div class="mastery-modal-body" id="sb-modal-body"></div>
      </div>
    `;

    // Print Studio Modal
    const printModal = document.createElement("div");
    printModal.className = "mastery-modal-overlay";
    printModal.id = "print-modal-overlay";
    printModal.innerHTML = `
      <div class="mastery-modal" style="max-width:540px">
        <div class="mastery-modal-head">
          <h3>${Y_SVG.printer(16)} 나만의 맞춤 학습지 인쇄 스튜디오</h3>
          <button type="button" class="dict-drawer-close" id="btn-close-print-modal">&times;</button>
        </div>
        <div class="mastery-modal-body" id="print-modal-body"></div>
      </div>
    `;

    // Noise & Mic Sensitivity Modal
    const noiseModal = document.createElement("div");
    noiseModal.className = "mastery-modal-overlay";
    noiseModal.id = "noise-modal-overlay";
    noiseModal.innerHTML = `
      <div class="mastery-modal" style="max-width:500px">
        <div class="mastery-modal-head">
          <h3>${Y_SVG.mic(16)} 강의실 소음 제어 & 0.5점 채점 설정</h3>
          <button type="button" class="dict-drawer-close" id="btn-close-noise-modal">&times;</button>
        </div>
        <div class="mastery-modal-body" id="noise-modal-body"></div>
      </div>
    `;

    // Print Paper Container (Only shown during window.print())
    let printPaper = document.getElementById("yeon-print-paper");
    if (!printPaper) {
      printPaper = document.createElement("div");
      printPaper.id = "yeon-print-paper";
      document.body.appendChild(printPaper);
    }

    // Unit Final CBT Exam Modal
    const utModal = document.createElement("div");
    utModal.className = "mastery-modal-overlay";
    utModal.id = "ut-modal-overlay";
    utModal.innerHTML = `
      <div class="mastery-modal" style="max-width:580px">
        <div class="mastery-modal-head">
          <h3>${Y_SVG.gradCap(17)} 제1단원 빈센트 반 고흐 · 단원 총괄 평가 (CBT 모의고사)</h3>
          <button type="button" class="dict-drawer-close" id="btn-close-ut-modal">&times;</button>
        </div>
        <div class="mastery-modal-body" id="ut-modal-body"></div>
      </div>
    `;

    // Grammar Spotlight Modal (X-Ray 핵심 문법 팝업)
    const gmModal = document.createElement("div");
    gmModal.className = "mastery-modal-overlay";
    gmModal.id = "gm-modal-overlay";
    gmModal.innerHTML = `
      <div class="mastery-modal" style="max-width:540px">
        <div class="mastery-modal-head" style="background:#fffbeb;border-bottom:1px solid #fef08a;">
          <h3 style="color:#854d0e;">${Y_SVG.search(16)} <span id="gm-modal-title">핵심 문법 렌즈 해설</span></h3>
          <button type="button" class="dict-drawer-close" id="btn-close-gm-modal">&times;</button>
        </div>
        <div class="mastery-modal-body" id="gm-modal-body" style="padding:14px 18px;"></div>
      </div>
    `;
    document.body.appendChild(gmModal);

    const btnCloseGm = document.getElementById("btn-close-gm-modal");
    if (btnCloseGm) btnCloseGm.onclick = () => gmModal.classList.remove("open");
    gmModal.onclick = e => { if (e.target === gmModal) gmModal.classList.remove("open"); };

    // Floating Audio Dock (하단 오디오 제어 팝업 바)
    let audioDock = document.getElementById("floating-audio-dock");
    if (!audioDock) {
      audioDock = document.createElement("div");
      audioDock.className = "floating-audio-dock";
      audioDock.id = "floating-audio-dock";
      audioDock.innerHTML = `
        <div class="audio-dock-inner">
          <div class="audio-dock-track">
            <div class="audio-dock-tag" id="audio-dock-tag">${Y_SVG.headphones(13)} 낭독 중</div>
            <div class="audio-dock-text" id="audio-dock-text">...</div>
            <button type="button" class="audio-dock-close" id="btn-dock-close" title="닫기">&times;</button>
          </div>
          <div class="audio-dock-controls">
            <div class="audio-dock-playback">
              <button type="button" class="dock-btn" id="btn-dock-prev" title="이전 문장">${Y_SVG.prev(13)}</button>
              <button type="button" class="dock-btn dock-btn-main" id="btn-dock-toggle" title="일시정지/재생">${Y_SVG.pause(14)}</button>
              <button type="button" class="dock-btn" id="btn-dock-stop" title="완전 정지">${Y_SVG.stop(13)}</button>
              <button type="button" class="dock-btn" id="btn-dock-next" title="다음 문장">${Y_SVG.next(13)}</button>
              <button type="button" class="dock-btn" id="btn-dock-replay" title="문장 다시듣기">${Y_SVG.rotate(13)}</button>
            </div>
            <div class="audio-dock-options">
              <div class="dock-pill-group" id="dock-voice-pills">
                <button type="button" class="dock-pill ${VoiceEngine.gender === 'female' ? 'active' : ''}" data-voice="female" title="여성 원어민 목소리">${Y_SVG.user(12)} 여성</button>
                <button type="button" class="dock-pill ${VoiceEngine.gender === 'male' ? 'active' : ''}" data-voice="male" title="남성 원어민 목소리">${Y_SVG.user(12)} 남성</button>
              </div>
              <div class="dock-pill-group" id="dock-speed-pills">
                <button type="button" class="dock-pill" data-rate="0.7">0.7×</button>
                <button type="button" class="dock-pill active" data-rate="0.85">0.85×</button>
                <button type="button" class="dock-pill" data-rate="1.0">1.0×</button>
              </div>
              <div class="dock-pill-group" id="dock-repeat-pills">
                <button type="button" class="dock-pill active" data-repeat="1">1회</button>
                <button type="button" class="dock-pill" data-repeat="2">2회</button>
                <button type="button" class="dock-pill" data-repeat="3">3회</button>
                <button type="button" class="dock-pill" data-repeat="5">5회</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(audioDock);
      initAudioDockEvents();
    }

    document.body.appendChild(wbModal);
    document.body.appendChild(sbModal);
    document.body.appendChild(printModal);
    document.body.appendChild(noiseModal);
    document.body.appendChild(utModal);

    // 6. Student Authentication & Switch Modal (학원 공용 태블릿 기기 인증 및 학생 전환)
    const authModal = document.createElement("div");
    authModal.className = "auth-modal-overlay";
    authModal.id = "student-auth-modal";
    authModal.innerHTML = `
      <div class="auth-modal-box">
        <div class="auth-modal-head">
          <div class="auth-modal-title">
            <span style="color:#b8955a">${Y_SVG.user(20)}</span>
            <span>학생 로그인 및 계정 전환</span>
          </div>
          <button type="button" class="dict-drawer-close" id="btn-close-auth-modal">&times;</button>
        </div>
        <div class="auth-device-banner">
          <span style="font-size:16px">${Y_SVG.award(16)}</span>
          <div>
            <b>연플래닝 아카데미 학원 태블릿 기기 인증 완료 ✓</b>
            <div style="font-size:11.5px;color:#15803d;margin-top:2px">인증된 학습 기기이므로 추가 인증 없이 아이디만으로 즉시 입장합니다.</div>
          </div>
        </div>
        <div id="auth-modal-content-root"></div>
      </div>
    `;
    document.body.appendChild(authModal);

    document.getElementById("btn-close-wb-modal").onclick = () => wbModal.classList.remove("open");
    document.getElementById("btn-close-sb-modal").onclick = () => sbModal.classList.remove("open");
    document.getElementById("btn-close-print-modal").onclick = () => printModal.classList.remove("open");
    document.getElementById("btn-close-noise-modal").onclick = () => noiseModal.classList.remove("open");
    document.getElementById("btn-close-ut-modal").onclick = () => utModal.classList.remove("open");
    document.getElementById("btn-close-auth-modal").onclick = closeStudentAuthModal;

    wbModal.onclick = e => { if (e.target === wbModal) wbModal.classList.remove("open"); };
    sbModal.onclick = e => { if (e.target === sbModal) sbModal.classList.remove("open"); };
    printModal.onclick = e => { if (e.target === printModal) printModal.classList.remove("open"); };
    noiseModal.onclick = e => { if (e.target === noiseModal) noiseModal.classList.remove("open"); };
    utModal.onclick = e => { if (e.target === utModal) utModal.classList.remove("open"); };
    authModal.onclick = e => { if (e.target === authModal) closeStudentAuthModal(); };
  }

  // ── [학생 간편 로그인 & 계정 전환 모달 제어] ──
  function openStudentAuthModal() {
    renderStudentAuthModal();
    const modal = document.getElementById("student-auth-modal");
    if (modal) modal.classList.add("open");
  }

  function closeStudentAuthModal() {
    const modal = document.getElementById("student-auth-modal");
    if (modal) modal.classList.remove("open");
  }

  function updateStudentUI() {
    const cur = YeonStudentAuth.getCurrentStudent();
    const nameEl = document.getElementById("top-student-name");
    const descEl = document.getElementById("opt-student-desc");

    if (cur) {
      const label = `${cur.name} (${cur.grade})`;
      if (nameEl) nameEl.textContent = label;
      if (descEl) descEl.textContent = `현재: ${label} (클릭 시 다른 학생 전환)`;
    } else {
      if (nameEl) nameEl.textContent = "학생 로그인";
      if (descEl) descEl.textContent = "학생 아이디로 로그인 / 전환";
    }

    const msOptStudent = document.getElementById("ms-opt-student-info");
    if (msOptStudent) {
      msOptStudent.textContent = cur ? `${cur.name} (${cur.grade}) 학생 학습 중` : "로그인 없이 보는 중";
    }
  }

  function hookMenusetOpt() {
    const opt = document.getElementById("ms-opt");
    if (!opt || document.getElementById("ms-student-row")) return;

    const row = document.createElement("div");
    row.className = "ms-row";
    row.id = "ms-student-row";
    const cur = YeonStudentAuth.getCurrentStudent();
    row.innerHTML = `
      <span style="display:flex;align-items:center;gap:4px">
        ${Y_SVG.user(13)} 학생 계정 <span style="font-size:10px;color:#10b981;font-weight:700">기기 인증됨 ✓</span>
      </span>
      <div style="font-size:13px;font-weight:700;color:var(--ms-pri-dk);margin:4px 0 6px" id="ms-opt-student-info">
        ${cur ? `${cur.name} (${cur.grade}) 학생 학습 중` : "로그인 없이 보는 중"}
      </div>
      <div class="ms-seg">
        <button type="button" class="ms-o" id="btn-ms-student-switch">다른 학생으로 로그인 / 전환</button>
      </div>
    `;
    opt.insertBefore(row, opt.children[1] || opt.firstChild);

    const switchBtn = document.getElementById("btn-ms-student-switch");
    if (switchBtn) {
      switchBtn.onclick = () => {
        opt.classList.remove("on");
        openStudentAuthModal();
      };
    }
  }

  function renderStudentAuthModal() {
    const root = document.getElementById("auth-modal-content-root");
    if (!root) return;

    const cur = YeonStudentAuth.getCurrentStudent();
    const recents = YeonStudentAuth.getRecentStudents();

    let html = "";

    // 1. 현재 학습자 정보
    if (cur) {
      html += `
        <div class="auth-current-card">
          <div>
            <div style="font-size:12px;color:#78716c;font-weight:700">현재 학습 중인 학생</div>
            <div style="font-size:15px;font-weight:800;color:#1f2937;margin-top:2px">${escapeHtml(cur.name)} (${escapeHtml(cur.grade)}) <span style="font-size:12px;color:#9ca3af">#${escapeHtml(cur.id)}</span></div>
          </div>
          <button type="button" class="btn-secondary" id="btn-auth-logout" style="min-height:32px;padding:3px 10px;font-size:12px;color:#dc2626;border-color:#fca5a5;cursor:pointer">로그아웃</button>
        </div>
      `;
    }

    // 2. 최근 학습한 학생 원터치 빠른 입장
    if (recents.length > 0) {
      html += `
        <div class="auth-section-title">
          <span>⚡ 최근 학습한 학생 (원터치 빠른 입장)</span>
        </div>
        <div class="auth-recents-list">
          ${recents.map(s => `
            <button type="button" class="auth-student-chip" data-id="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}" data-grade="${escapeHtml(s.grade)}">
              ${Y_SVG.user(13)} <span>${escapeHtml(s.name)} (${escapeHtml(s.grade)})</span>
            </button>
          `).join("")}
        </div>
      `;
    }

    // 3. 학생 아이디(원생번호) 입력창 (ID == PW 원칙)
    html += `
      <div class="auth-section-title" style="margin-top:14px">
        <span>👦 ${cur ? '다른 학생으로 로그인' : '학생 아이디(원생번호) 입력'}</span>
      </div>
      <div class="auth-input-group">
        <label for="auth-input-id">학생 아이디 / 원생번호</label>
        <input type="text" class="auth-input" id="auth-input-id" placeholder="예: 1024, 홍길동, 초2-1" autocomplete="off">
      </div>
      <div class="auth-input-group">
        <label for="auth-select-grade">학년 선택</label>
        <select class="auth-input" id="auth-select-grade">
          <option value="초1">초등학교 1학년</option>
          <option value="초2" selected>초등학교 2학년</option>
          <option value="초3">초등학교 3학년</option>
          <option value="초4">초등학교 4학년</option>
          <option value="초5">초등학교 5학년</option>
          <option value="초6">초등학교 6학년</option>
          <option value="중1">중학교 1학년</option>
          <option value="중2">중학교 2학년</option>
          <option value="중3">중학교 3학년</option>
          <option value="고등">고등학교</option>
        </select>
      </div>
      <div class="auth-note">
        ${Y_SVG.lightbulb(13)} <b>초등 저학년 무결점 로그인</b>: 비밀번호는 아이디와 동일하게 내부에서 자동 처리되므로, 학생은 자신의 번호만 입력하고 [학습 시작]을 누르면 됩니다.
      </div>
      <button type="button" class="auth-btn-primary" id="btn-auth-submit" style="margin-top:14px">
        ${Y_SVG.gradCap(16)} <span>학습 시작하기</span>
      </button>
    `;

    root.innerHTML = html;

    const logoutBtn = document.getElementById("btn-auth-logout");
    if (logoutBtn) logoutBtn.onclick = () => YeonStudentAuth.logout();

    root.querySelectorAll(".auth-student-chip").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        const grade = btn.getAttribute("data-grade");
        YeonStudentAuth.login(id, name, grade);
      };
    });

    const submitBtn = document.getElementById("btn-auth-submit");
    const idInput = document.getElementById("auth-input-id");
    const gradeSelect = document.getElementById("auth-select-grade");

    const doSubmit = () => {
      const val = (idInput.value || "").trim();
      if (!val) {
        alert("학생 아이디(원생번호)를 입력해 주세요.");
        idInput.focus();
        return;
      }
      const grade = gradeSelect.value;
      YeonStudentAuth.login(val, val, grade);
    };

    if (submitBtn) submitBtn.onclick = doSubmit;
    if (idInput) {
      idInput.onkeydown = e => {
        if (e.key === "Enter") doSubmit();
      };
      setTimeout(() => idInput.focus(), 150);
    }
  }

  // ── [내 단어장 & 3초 깜빡이] 열기 ──
  function openWordBankModal() {
    const modal = document.getElementById("wb-modal-overlay");
    const body = document.getElementById("wb-modal-body");
    const saved = Storage.get("saved_vocab", []);

    if (saved.length === 0) {
      body.innerHTML = `
        <div style="text-align:center;padding:40px 10px;color:#64748b">
          <div style="margin-bottom:12px;color:var(--yl-gold)">${Y_SVG.star(36)}</div>
          <p style="font-size:15px;font-weight:700">아직 저장된 단어가 없어요!</p>
          <p style="font-size:13px">본문에서 모르는 단어를 탭하고 '내 단어장'을 눌러 담아보세요.</p>
        </div>
      `;
      modal.classList.add("open");
      return;
    }

    let currentIndex = 0;
    let timerRunning = false;
    let timerId = null;

    function renderFlashcard() {
      const w = saved[currentIndex];
      const data = DICT_DB[w] || { en: w, pron: "/-/", meanings: ["뜻"], easy_en: "" };

      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:13px;font-weight:700;color:var(--yl-pri-dk)">단어 ${currentIndex + 1} / ${saved.length}</span>
          <button type="button" class="btn-secondary" id="btn-toggle-flash-mode" style="font-size:11.5px;padding:3px 8px;display:inline-flex;align-items:center;gap:4px">${Y_SVG.timer(12)} <span>3초 타이머 모드</span></button>
        </div>

        <div class="flashcard-timer-bar"><div class="flashcard-timer-progress" id="fc-timer-bar" style="width:100%"></div></div>

        <div class="flashcard-box" id="flashcard-card">
          <div class="flashcard-word">${data.en}</div>
          <div class="flashcard-pron">${data.pron}</div>
          <div class="flashcard-meaning" id="fc-meaning" style="display:none">${data.meanings.join(", ")}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:14px" id="fc-hint">카드를 터치하면 뜻이 나타나요</div>
        </div>

        <div style="display:flex;gap:8px">
          <button type="button" class="btn-secondary" id="btn-fc-prev" ${currentIndex === 0 ? 'disabled' : ''} style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px">${Y_SVG.prev(12)} <span>이전</span></button>
          <button type="button" class="btn-primary" id="btn-fc-audio" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px">${Y_SVG.speaker(13)} <span>발음</span></button>
          <button type="button" class="btn-primary" id="btn-fc-next" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px">${currentIndex === saved.length - 1 ? '처음으로' : '<span>다음</span> ' + Y_SVG.next(12)}</button>
        </div>

        <div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
          <button type="button" class="btn-stage-sub-tool" id="btn-wb-print" style="margin-left:0;display:inline-flex;align-items:center;gap:4px">${Y_SVG.printer(13)} <span>단어 쓰기 노트 인쇄</span></button>
          <button type="button" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px" id="btn-fc-remove">${Y_SVG.trash(12)} <span>이 단어 삭제</span></button>
        </div>
      `;

      speak(data.en, 0.85);

      const card = document.getElementById("flashcard-card");
      const meaning = document.getElementById("fc-meaning");
      const hint = document.getElementById("fc-hint");
      card.onclick = () => {
        const isHidden = meaning.style.display === "none";
        meaning.style.display = isHidden ? "block" : "none";
        hint.style.display = isHidden ? "none" : "block";
      };

      document.getElementById("btn-wb-print").onclick = () => {
        modal.classList.remove("open");
        openPrintStudioModal();
      };

      document.getElementById("btn-fc-audio").onclick = () => speak(data.en, 0.85);

      document.getElementById("btn-fc-prev").onclick = () => {
        if (currentIndex > 0) { currentIndex--; renderFlashcard(); }
      };

      document.getElementById("btn-fc-next").onclick = () => {
        if (currentIndex < saved.length - 1) currentIndex++;
        else currentIndex = 0;
        renderFlashcard();
      };

      document.getElementById("btn-fc-remove").onclick = () => {
        let list = Storage.get("saved_vocab", []);
        list = list.filter(x => x !== data.en);
        Storage.set("saved_vocab", list);
        updateCounters();
        openWordBankModal();
      };

      // 3초 타이머 버튼
      document.getElementById("btn-toggle-flash-mode").onclick = () => {
        const bar = document.getElementById("fc-timer-bar");
        bar.style.width = "0%";
        setTimeout(() => {
          meaning.style.display = "block";
          hint.style.display = "none";
        }, 3000);
      };
    }

    renderFlashcard();
    modal.classList.add("open");
  }

  // ── [내 복습 코너 : 문장집 & 핵심 문법 노트] ──
  let sbActiveTab = "sen"; // "sen" | "grammar"

  function openScrapbookModal() {
    const modal = document.getElementById("sb-modal-overlay");
    const body = document.getElementById("sb-modal-body");
    const savedSen = Storage.get("saved_sentences", []);
    const savedGrammars = Storage.get("saved_grammars", []);

    let html = `
      <div style="display:flex;gap:8px;margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:10px;">
        <button type="button" id="tab-sb-sen" style="flex:1;padding:8px 12px;font-size:13px;font-weight:700;border-radius:6px;cursor:pointer;border:1px solid ${sbActiveTab === 'sen' ? 'var(--yl-pri)' : '#cbd5e1'};background:${sbActiveTab === 'sen' ? 'var(--yl-pri)' : '#fff'};color:${sbActiveTab === 'sen' ? '#fff' : '#475569'};display:inline-flex;align-items:center;justify-content:center;gap:5px;">
          ${Y_SVG.book(13)} <span>스크랩 문장 (${savedSen.length})</span>
        </button>
        <button type="button" id="tab-sb-grammar" style="flex:1;padding:8px 12px;font-size:13px;font-weight:700;border-radius:6px;cursor:pointer;border:1px solid ${sbActiveTab === 'grammar' ? '#eab308' : '#cbd5e1'};background:${sbActiveTab === 'grammar' ? '#fef08a' : '#fff'};color:${sbActiveTab === 'grammar' ? '#854d0e' : '#475569'};display:inline-flex;align-items:center;justify-content:center;gap:5px;">
          ★ <span>핵심 문법 노트 (${savedGrammars.length})</span>
        </button>
      </div>
    `;

    if (sbActiveTab === "sen") {
      if (savedSen.length === 0) {
        html += `
          <div style="text-align:center;padding:40px 10px;color:#64748b">
            <div style="margin-bottom:12px;color:var(--yl-pri-dk)">${Y_SVG.book(36)}</div>
            <p style="font-size:15px;font-weight:700">아직 스크랩한 문장이 없어요!</p>
            <p style="font-size:13px">본문 각 문장 옆의 '스크랩' 버튼을 눌러 나만의 문장집을 채워보세요.</p>
          </div>
        `;
      } else {
        html += `<div style="display:flex;flex-direction:column;gap:10px">`;
        savedSen.forEach(sid => {
          let senObj = null;
          B.paragraphs.forEach(p => {
            const s = p.sentences.find(x => x.id === sid);
            if (s) senObj = s;
          });
          if (!senObj) return;

          const isMastered = Storage.get("mastered_" + sid, false);

          html += `
            <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:11px;font-weight:800;color:#0284c7">문장 ${sid}</span>
                ${isMastered ? '<span class="mastery-stamp">' + Y_SVG.check(11) + ' 정복 완료</span>' : '<span style="font-size:11px;color:#d97706">미완료</span>'}
              </div>
              <div style="font-family:'Crimson Pro',serif;font-size:15px;font-weight:600;color:#1e293b;margin-bottom:2px">${senObj.en}</div>
              <div style="font-size:12px;color:#64748b;margin-bottom:8px">${senObj.ko}</div>
              <div style="display:flex;gap:6px">
                <button type="button" class="btn-primary btn-start-challenge" data-sid="${sid}" style="flex:1;min-height:36px;font-size:12.5px;display:inline-flex;align-items:center;justify-content:center;gap:5px">${Y_SVG.award(14)} <span>완전정복 4단계 도전</span></button>
                <button type="button" class="btn-secondary btn-del-scrap" data-sid="${sid}" style="min-height:36px;font-size:12px">삭제</button>
              </div>
            </div>
          `;
        });
        html += `
          </div>
          <div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:#64748b">총 ${savedSen.length}개 스크랩 문장</span>
            <button type="button" class="btn-stage-sub-tool" id="btn-sb-print" style="margin-left:0;display:inline-flex;align-items:center;gap:4px">${Y_SVG.printer(13)} <span>스크랩 문장 학습지 인쇄</span></button>
          </div>
        `;
      }
    } else {
      // Grammar Tab
      if (savedGrammars.length === 0) {
        html += `
          <div style="text-align:center;padding:40px 10px;color:#64748b">
            <div style="margin-bottom:12px;color:#eab308;font-size:36px;">★</div>
            <p style="font-size:15px;font-weight:700;color:#854d0e;">아직 저장된 핵심 문법이 없어요!</p>
            <p style="font-size:13px;line-height:1.5;">본문에서 <b>[Q 문법 렌즈 (X-Ray)]</b>를 체크한 뒤,<br>노란색 형광펜 구역을 터치하고 <b>[내 복습 코너에 저장하기]</b>를 눌러보세요.</p>
          </div>
        `;
      } else {
        html += `<div style="display:flex;flex-direction:column;gap:10px">`;
        savedGrammars.forEach(g => {
          html += `
            <div style="background:#fefce8;border:1.5px solid #facc15;border-radius:10px;padding:12px 14px;box-shadow:0 1px 4px rgba(234,179,8,0.1);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:11px;font-weight:800;color:#854d0e;background:#fef08a;padding:2px 7px;border-radius:4px;">★ ${escapeHtml(g.label)} (문장 ${g.sid})</span>
                <span style="font-size:11px;color:#0f4c81;font-weight:700;">${escapeHtml(g.gName)}</span>
              </div>
              <div style="font-family:'Crimson Pro',Georgia,serif;font-size:17px;font-weight:800;color:#713f12;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;">
                <span>${escapeHtml(g.text)}</span>
                <button type="button" class="btn-listen-g-item" data-text="${escapeHtml(g.text)}" style="background:#fff;border:1px solid #facc15;border-radius:5px;padding:2px 7px;font-size:11px;color:#854d0e;cursor:pointer;">${Y_SVG.speaker(12)}</button>
              </div>
              <div style="font-size:12.5px;color:#334155;line-height:1.5;margin-bottom:8px;background:rgba(255,255,255,0.7);padding:8px 10px;border-radius:6px;border:1px solid #fef08a;">
                💡 <b>출제 포인트</b> : ${escapeHtml(g.why)}
              </div>
              ${g.mySentence ? `
                <div style="margin-bottom:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 10px;font-size:12px;color:#166534;">
                  <div style="font-weight:700;display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                    <span>🧩 내가 직접 조립한 실전 문장:</span>
                    <button type="button" class="btn-listen-g-item" data-text="${escapeHtml(g.mySentence)}" style="background:#fff;border:1px solid #86efac;border-radius:4px;padding:1px 6px;font-size:11px;color:#15803d;cursor:pointer;">${Y_SVG.speaker(11)} <span>듣기</span></button>
                  </div>
                  <div style="font-family:'Crimson Pro',Georgia,serif;font-size:14.5px;font-weight:700;color:#14532d;">"${escapeHtml(g.mySentence)}"</div>
                  ${g.myKo ? `<div style="font-size:11.5px;color:#166534;margin-top:2px;">우리말: ${escapeHtml(g.myKo)}</div>` : ''}
                </div>
              ` : ''}
              <div style="display:flex;gap:6px;">
                <button type="button" class="btn-drill-from-scrap" data-sid="${g.sid}" data-gno="${g.gNo}" style="flex:1;min-height:34px;font-size:12px;font-weight:700;background:#fef3c7;color:#854d0e;border:1px solid #facc15;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                  🧩 <span>직접 만들기 영작</span>
                </button>
                <button type="button" class="btn-jump-from-scrap" data-gno="${g.gNo}" style="flex:1;min-height:34px;font-size:12px;font-weight:700;background:#0284c7;color:#fff;border:none;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                  📖 <span>해당 문법 위치</span>
                </button>
                <button type="button" class="btn-del-g-scrap" data-gid="${g.id}" style="min-height:34px;font-size:12px;background:#fff;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:0 10px;cursor:pointer;">삭제</button>
              </div>
            </div>
          `;
        });
        html += `
          </div>
          <div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:#64748b">총 ${savedGrammars.length}개 핵심 문법 저장됨</span>
            <button type="button" class="btn-stage-sub-tool" id="btn-g-print" style="margin-left:0;display:inline-flex;align-items:center;gap:4px">${Y_SVG.printer(13)} <span>문법 오답·핵심 학습지 인쇄</span></button>
          </div>
        `;
      }
    }

    body.innerHTML = html;

    // Tab buttons
    document.getElementById("tab-sb-sen").onclick = () => {
      sbActiveTab = "sen";
      openScrapbookModal();
    };
    document.getElementById("tab-sb-grammar").onclick = () => {
      sbActiveTab = "grammar";
      openScrapbookModal();
    };

    // Print buttons
    const btnSbPrint = document.getElementById("btn-sb-print");
    if (btnSbPrint) {
      btnSbPrint.onclick = () => {
        modal.classList.remove("open");
        openPrintStudioModal();
      };
    }
    const btnGPrint = document.getElementById("btn-g-print");
    if (btnGPrint) {
      btnGPrint.onclick = () => {
        modal.classList.remove("open");
        openPrintStudioModal();
      };
    }

    // Sentence tab event listeners
    body.querySelectorAll(".btn-del-scrap").forEach(btn => {
      btn.onclick = () => {
        const sid = btn.getAttribute("data-sid");
        let list = Storage.get("saved_sentences", []);
        list = list.filter(x => x !== sid);
        Storage.set("saved_sentences", list);
        updateCounters();
        openScrapbookModal();
      };
    });

    body.querySelectorAll(".btn-start-challenge").forEach(btn => {
      btn.onclick = () => {
        const sid = btn.getAttribute("data-sid");
        startSentenceChallenge(sid);
      };
    });

    // Grammar tab event listeners
    body.querySelectorAll(".btn-listen-g-item").forEach(btn => {
      btn.onclick = () => {
        const txt = btn.getAttribute("data-text");
        speak(txt, 0.85);
      };
    });

    body.querySelectorAll(".btn-del-g-scrap").forEach(btn => {
      btn.onclick = () => {
        const gid = btn.getAttribute("data-gid");
        let list = Storage.get("saved_grammars", []);
        list = list.filter(x => x.id !== gid);
        Storage.set("saved_grammars", list);
        showToast("핵심 문법 노트를 삭제했습니다.");
        openScrapbookModal();
      };
    });

    body.querySelectorAll(".btn-jump-from-scrap").forEach(btn => {
      btn.onclick = () => {
        const gNo = btn.getAttribute("data-gno");
        modal.classList.remove("open");
        jumpToGrammarCard(gNo);
      };
    });

    body.querySelectorAll(".btn-drill-from-scrap").forEach(btn => {
      btn.onclick = () => {
        const sid = btn.getAttribute("data-sid");
        const gNo = btn.getAttribute("data-gno");
        modal.classList.remove("open");
        const syntax = SYNTAX_DATA[sid];
        if (syntax) {
          const ch = syntax.chunks.find(c => c.hl);
          if (ch) {
            const dummyChunk = document.createElement("span");
            dummyChunk.setAttribute("data-sid", sid);
            dummyChunk.setAttribute("data-text", ch.text);
            dummyChunk.setAttribute("data-label", ch.label || "중2 핵심 문법");
            dummyChunk.setAttribute("data-why", ch.why || "");
            dummyChunk.setAttribute("data-gno", ch.gNo || gNo);
            dummyChunk.setAttribute("data-gname", ch.gName || "");
            openGrammarSpotlightModal(dummyChunk, "drill");
          }
        }
      };
    });

    modal.classList.add("open");
  }

  // ── [핵심 문법 해설 팝업 2.0: 실전 확장 예문 2개 & 내가 직접 만들어보기 드릴] ──
  let currentGmChunk = null;
  let gmDrillState = {
    sid: null,
    assembled: [],
    pool: [],
    isEvaluated: false,
    isCorrect: false
  };

  function openGrammarSpotlightModal(hlChunk, initialTab = "explain") {
    currentGmChunk = hlChunk;
    const modal = document.getElementById("gm-modal-overlay");
    const body = document.getElementById("gm-modal-body");
    const titleEl = document.getElementById("gm-modal-title");
    if (!modal || !body) return;

    const sid = hlChunk.getAttribute("data-sid") || "";
    const text = hlChunk.getAttribute("data-text") || hlChunk.textContent.trim();
    const label = hlChunk.getAttribute("data-label") || "중2 핵심 문법";
    const why = hlChunk.getAttribute("data-why") || "";
    const gNo = hlChunk.getAttribute("data-gno") || "2";
    const gName = hlChunk.getAttribute("data-gname") || "2. to부정사";

    if (titleEl) titleEl.textContent = `${label} (문법 X-Ray)`;

    const savedGrammars = Storage.get("saved_grammars", []);
    const gid = `${sid}_${gNo}`;
    const isSaved = savedGrammars.some(g => g.id === gid);

    const extraData = GRAMMAR_EXTRAS_DB[sid] || {
      extraExamples: [
        { en: "Practice makes perfect when you learn English step by step.", ko: "영어를 차근차근 배우다 보면 연습을 통해 완벽해진다." },
        { en: "We can express our thoughts freely in English.", ko: "우리는 영어로 우리의 생각을 자유롭게 표현할 수 있다." }
      ],
      drill: {
        ko: "우리는 매일 새로운 문장을 직접 만들며 배운다.",
        pattern: "주어 + learn + by making + new sentences",
        answer: "We learn by making new sentences.",
        blocks: ["We", "learn", "by making", "new sentences."]
      }
    };

    // Initialize drill state if changing to a new sentence chunk
    if (!gmDrillState.sid || gmDrillState.sid !== sid) {
      gmDrillState = {
        sid: sid,
        assembled: [],
        pool: [...extraData.drill.blocks].sort(() => Math.random() - 0.5),
        isEvaluated: false,
        isCorrect: false
      };
    }

    renderGrammarModalView(initialTab);

    function renderGrammarModalView(activeTab) {
      let contentHtml = "";

      // ── Tab Navigation ──
      const tabBarHtml = `
        <div class="gm-tab-nav">
          <button type="button" class="gm-tab-btn ${activeTab === 'explain' ? 'active' : ''}" id="gm-tab-btn-explain">
            💡 <span>핵심 해설 & 확장 예문</span>
          </button>
          <button type="button" class="gm-tab-btn ${activeTab === 'drill' ? 'active' : ''}" id="gm-tab-btn-drill">
            🧩 <span>내가 직접 만들어보기</span>
          </button>
        </div>
      `;

      if (activeTab === "explain") {
        // ── [Tab 1] 핵심 구문 해설 & 실전 확장 예문 2개 ──
        contentHtml = `
          ${tabBarHtml}

          <!-- 1. 본문 핵심 구문 카드 -->
          <div style="background:#fefce8;border:1.5px solid #facc15;border-radius:10px;padding:12px 14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(234,179,8,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;color:#a16207;font-weight:800;background:#fef08a;padding:2px 8px;border-radius:4px;">★ 본문 ${sid}번 문장 핵심 구문</span>
              <button type="button" id="btn-gm-listen-chunk" style="background:#fff;border:1px solid #facc15;border-radius:6px;padding:2px 8px;font-size:11.5px;font-weight:700;color:#854d0e;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                ${Y_SVG.speaker(12)} <span>미국 원어민 듣기</span>
              </button>
            </div>
            <div style="font-size:18px;font-weight:800;color:#713f12;font-family:'Crimson Pro',Georgia,serif;line-height:1.4;">
              ${escapeHtml(text)}
            </div>
          </div>

          <!-- 2. 문법 핵심 해설 카드 -->
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:12px 14px;margin-bottom:12px;">
            <div style="font-size:12px;font-weight:800;color:#0369a1;margin-bottom:5px;display:flex;align-items:center;gap:5px;">
              ${Y_SVG.lightbulb(14)} <span>출제 포인트 & 왜 쓰였을까?</span>
            </div>
            <div style="font-size:13.5px;color:#1e293b;line-height:1.55;font-weight:600;">
              ${escapeHtml(why)}
            </div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #cbd5e1;font-size:11.5px;color:#64748b;display:flex;align-items:center;justify-content:space-between;">
              <span>연계 문법 단원: <strong style="color:#0f4c81;">${escapeHtml(gName)}</strong></span>
              <span style="font-size:11px;color:#94a3b8;">중2 정규 영어 교과서</span>
            </div>
          </div>

          <!-- 3. 실전 확장 예문 2개 카드 (Extra Examples) -->
          <div class="gm-extra-section">
            <div class="gm-extra-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
              <span>실전 확장 예문 (동일 문법 패턴 실생활 활용 2제)</span>
            </div>
            ${extraData.extraExamples.map((ex, idx) => `
              <div class="gm-example-item">
                <div class="gm-ex-top">
                  <div style="flex:1">
                    <div class="gm-ex-en">${escapeHtml(ex.en)}</div>
                    <div class="gm-ex-ko">${escapeHtml(ex.ko)}</div>
                  </div>
                  <button type="button" class="btn-gm-ex-listen" data-idx="${idx}" title="예문 원어민 발음 듣기">
                    ${Y_SVG.speaker(11)} <span>듣기</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- 4. Tab 2로 연결되는 영작 챌린지 바로가기 배너 -->
          <div style="margin-bottom:12px;">
            <button type="button" id="btn-gm-goto-drill" style="width:100%;background:#eff6ff;border:1.5px dashed #3b82f6;border-radius:8px;padding:9px 12px;font-size:13px;font-weight:700;color:#1d4ed8;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.15s ease;">
              <span>🧩 배운 문법으로 내가 직접 문장 만들어보기 ➔</span>
            </button>
          </div>

          <!-- 5. 액션 버튼 2개 -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button type="button" id="btn-gm-toggle-save" style="width:100%;min-height:40px;font-size:13.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:6px;background:${isSaved ? '#059669' : '#f59e0b'};border:none;border-radius:8px;color:#fff;cursor:pointer;transition:all 0.15s ease;">
              ${Y_SVG.bookmark(15, 'currentColor')} <span>${isSaved ? '✓ 내 복습 코너에 저장됨 (클릭 시 취소)' : '📌 내 복습 코너(문법 노트)에 저장하기'}</span>
            </button>

            <button type="button" id="btn-gm-jump-target" style="width:100%;min-height:38px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#fff;border:1.5px solid #0284c7;border-radius:8px;color:#0284c7;cursor:pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              <span>📖 [${escapeHtml(gName)}] 설명 코너로 바로가기</span>
            </button>
          </div>
        `;
      } else {
        // ── [Tab 2] 내가 직접 만들어보기 (실전 어순 조립 영작 드릴) ──
        const d = extraData.drill;
        const hasChips = gmDrillState.assembled.length > 0;
        const currentSentence = gmDrillState.assembled.join(" ");

        contentHtml = `
          ${tabBarHtml}

          <div class="gm-drill-container">
            <!-- 목표 문장 및 공식 힌트 -->
            <div class="gm-drill-banner">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                <span style="font-size:11px;color:#a16207;font-weight:800;background:#fef08a;padding:2px 8px;border-radius:4px;">🎯 실전 어순 조립 영작 챌린지</span>
                <span class="gm-drill-pattern-hint">힌트: ${escapeHtml(d.pattern)}</span>
              </div>
              <div class="gm-drill-ko-box">
                "${escapeHtml(d.ko)}"
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">
                아래 단어 카드를 클릭하여 올바른 어순으로 문장을 완성하세요.
              </div>
            </div>

            <!-- 조립 영역 (Assembly Slot) -->
            <div style="margin-bottom:4px;font-size:12px;font-weight:700;color:#475569;display:flex;justify-content:space-between;align-items:center;">
              <span>내가 조립한 문장:</span>
              ${hasChips ? `<span style="font-size:11px;color:#0284c7;font-weight:600;">(카드를 누르면 아래로 돌아갑니다)</span>` : ''}
            </div>
            <div class="gm-slot-box ${hasChips ? 'has-chips' : ''}" id="gm-slot-area">
              ${hasChips ? gmDrillState.assembled.map((tok, idx) => `
                <button type="button" class="gm-chip in-slot" data-idx="${idx}" title="클릭 시 단어 보관함으로 복귀">${escapeHtml(tok)}</button>
              `).join('') : `
                <div class="gm-slot-placeholder">단어 카드를 순서대로 탭하여 문장을 조립하세요.</div>
              `}
            </div>

            <!-- 단어 보관함 (Word Bank Pool) -->
            <div style="margin-bottom:4px;font-size:12px;font-weight:700;color:#475569;display:flex;justify-content:space-between;align-items:center;">
              <span>단어 보관함:</span>
              <span style="font-size:11px;color:#94a3b8;">${gmDrillState.pool.length}개 남음</span>
            </div>
            <div class="gm-pool-box" id="gm-pool-area">
              ${gmDrillState.pool.length > 0 ? gmDrillState.pool.map((tok, idx) => `
                <button type="button" class="gm-chip" data-idx="${idx}" title="클릭 시 문장에 추가">${escapeHtml(tok)}</button>
              `).join('') : `
                <div style="color:#94a3b8;font-size:12px;text-align:center;width:100%;font-weight:600;">모든 단어를 문장에 배치했습니다. 아래 [채점하기]를 누르세요.</div>
              `}
            </div>

            <!-- 버튼 영역: 초기화 및 채점 -->
            <div class="gm-drill-actions">
              <button type="button" id="btn-gm-drill-reset" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:700;color:#475569;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                ${Y_SVG.rotate(13)} <span>초기화</span>
              </button>
              <button type="button" id="btn-gm-drill-check" style="flex:1;background:#2563eb;border:none;border-radius:8px;padding:9px 16px;font-size:13.5px;font-weight:800;color:#ffffff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 6px rgba(37,99,235,0.25);">
                <span>✓ 내가 만든 문장 채점하기</span>
              </button>
            </div>

            <!-- 채점 피드백 영역 -->
            <div id="gm-drill-feedback-container">
              ${gmDrillState.isEvaluated ? (
                gmDrillState.isCorrect ? `
                  <div class="gm-feedback-success">
                    <div style="font-weight:800;font-size:14px;color:#15803d;display:flex;align-items:center;gap:6px;">
                      <span>🎉 정답입니다! [${escapeHtml(label)}] 문법을 완벽히 마스터했습니다!</span>
                    </div>
                    <div style="font-size:16px;font-weight:800;color:#14532d;margin:8px 0;font-family:'Crimson Pro',Georgia,serif;">
                      "${escapeHtml(currentSentence)}"
                    </div>
                    <div style="font-size:12px;color:#166534;line-height:1.45;margin-bottom:10px;">
                      💡 <b>성공:</b> 정답 문장과 일치합니다. 원어민 발음으로 들어보고 내 복습 노트에 보관해보세요!
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                      <button type="button" id="btn-gm-drill-listen" style="background:#ffffff;border:1px solid #16a34a;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:700;color:#15803d;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                        ${Y_SVG.speaker(13)} <span>원어민 음성 듣기</span>
                      </button>
                      <button type="button" id="btn-gm-drill-save-mine" style="background:#16a34a;color:#ffffff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                        ${Y_SVG.bookmark(13, 'currentColor')} <span>내가 만든 문장도 복습 노트에 저장</span>
                      </button>
                    </div>
                  </div>
                ` : `
                  <div class="gm-feedback-error">
                    <div style="font-weight:800;font-size:13.5px;color:#b45309;display:flex;align-items:center;gap:6px;">
                      <span>단어 순서를 다시 확인해 보세요!</span>
                    </div>
                    <div style="font-size:12.5px;color:#78350f;margin-top:6px;line-height:1.45;">
                      💡 <b>문법 힌트:</b> ${escapeHtml(d.pattern)}<br>
                      위쪽 카드를 다시 눌러 단어 보관함으로 내린 뒤 올바른 순서로 재배열해 보세요.
                    </div>
                  </div>
                `
              ) : ''}
            </div>
          </div>
        `;
      }

      body.innerHTML = contentHtml;

      // ── Event Handlers ──
      // 1. Tab Navigation
      const btnTabExplain = document.getElementById("gm-tab-btn-explain");
      if (btnTabExplain) {
        btnTabExplain.onclick = () => renderGrammarModalView("explain");
      }
      const btnTabDrill = document.getElementById("gm-tab-btn-drill");
      if (btnTabDrill) {
        btnTabDrill.onclick = () => renderGrammarModalView("drill");
      }
      const btnGotoDrill = document.getElementById("btn-gm-goto-drill");
      if (btnGotoDrill) {
        btnGotoDrill.onclick = () => renderGrammarModalView("drill");
      }

      if (activeTab === "explain") {
        // Tab 1: Listen to chunk
        const btnListenChunk = document.getElementById("btn-gm-listen-chunk");
        if (btnListenChunk) {
          btnListenChunk.onclick = () => speak(text, 0.85);
        }

        // Tab 1: Extra examples listen
        body.querySelectorAll(".btn-gm-ex-listen").forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            const ex = extraData.extraExamples[idx];
            if (ex) speak(ex.en, 0.85);
          };
        });

        // Tab 1: Save toggle
        const btnSave = document.getElementById("btn-gm-toggle-save");
        if (btnSave) {
          btnSave.onclick = () => {
            let list = Storage.get("saved_grammars", []);
            const exists = list.some(g => g.id === gid);
            if (exists) {
              list = list.filter(g => g.id !== gid);
              Storage.set("saved_grammars", list);
              showToast("내 복습 코너에서 문법을 삭제했습니다.");
            } else {
              list.push({
                id: gid,
                sid: sid,
                text: text,
                label: label,
                why: why,
                gNo: gNo,
                gName: gName,
                extraExamples: extraData.extraExamples,
                date: new Date().toISOString()
              });
              Storage.set("saved_grammars", list);
              showToast("⭐ 내 복습 코너(문법 노트)에 저장되었습니다!");
            }
            renderGrammarModalView("explain");
          };
        }

        // Tab 1: Jump to textbook grammar
        const btnJump = document.getElementById("btn-gm-jump-target");
        if (btnJump) {
          btnJump.onclick = () => {
            modal.classList.remove("open");
            jumpToGrammarCard(gNo);
          };
        }
      } else {
        // Tab 2: Drill Event Handlers
        // Slot chip click -> return to pool
        const slotArea = document.getElementById("gm-slot-area");
        if (slotArea) {
          slotArea.querySelectorAll(".gm-chip.in-slot").forEach(btn => {
            btn.onclick = () => {
              const idx = parseInt(btn.getAttribute("data-idx"), 10);
              const tok = gmDrillState.assembled.splice(idx, 1)[0];
              gmDrillState.pool.push(tok);
              gmDrillState.isEvaluated = false;
              renderGrammarModalView("drill");
            };
          });
        }

        // Pool chip click -> move to slot
        const poolArea = document.getElementById("gm-pool-area");
        if (poolArea) {
          poolArea.querySelectorAll(".gm-chip").forEach(btn => {
            btn.onclick = () => {
              const idx = parseInt(btn.getAttribute("data-idx"), 10);
              const tok = gmDrillState.pool.splice(idx, 1)[0];
              gmDrillState.assembled.push(tok);
              gmDrillState.isEvaluated = false;
              renderGrammarModalView("drill");
            };
          });
        }

        // Reset button
        const btnReset = document.getElementById("btn-gm-drill-reset");
        if (btnReset) {
          btnReset.onclick = () => {
            gmDrillState.assembled = [];
            gmDrillState.pool = [...extraData.drill.blocks].sort(() => Math.random() - 0.5);
            gmDrillState.isEvaluated = false;
            gmDrillState.isCorrect = false;
            renderGrammarModalView("drill");
          };
        }

        // Check button
        const btnCheck = document.getElementById("btn-gm-drill-check");
        if (btnCheck) {
          btnCheck.onclick = () => {
            if (gmDrillState.assembled.length === 0) {
              showToast("먼저 단어 카드를 클릭하여 문장을 만들어보세요.");
              return;
            }
            const userStr = gmDrillState.assembled.join(" ").replace(/\s+/g, " ").trim();
            const targetStr = extraData.drill.answer.replace(/\s+/g, " ").trim();
            // Normalization for robust checking
            const normUser = userStr.toLowerCase().replace(/[^a-z0-9]/g, "");
            const normTarget = targetStr.toLowerCase().replace(/[^a-z0-9]/g, "");
            const isRight = normUser === normTarget;

            gmDrillState.isEvaluated = true;
            gmDrillState.isCorrect = isRight;

            if (isRight) {
              speak(extraData.drill.answer, 0.85);
            }
            renderGrammarModalView("drill");
          };
        }

        // Listen to drill answer
        const btnListenDrill = document.getElementById("btn-gm-drill-listen");
        if (btnListenDrill) {
          btnListenDrill.onclick = () => {
            speak(extraData.drill.answer, 0.85);
          };
        }

        // Save drill sentence into saved_grammars
        const btnSaveMine = document.getElementById("btn-gm-drill-save-mine");
        if (btnSaveMine) {
          btnSaveMine.onclick = () => {
            let list = Storage.get("saved_grammars", []);
            let existing = list.find(g => g.id === gid);
            if (existing) {
              existing.mySentence = extraData.drill.answer;
              existing.myKo = extraData.drill.ko;
            } else {
              list.push({
                id: gid,
                sid: sid,
                text: text,
                label: label,
                why: why,
                gNo: gNo,
                gName: gName,
                extraExamples: extraData.extraExamples,
                mySentence: extraData.drill.answer,
                myKo: extraData.drill.ko,
                date: new Date().toISOString()
              });
            }
            Storage.set("saved_grammars", list);
            showToast("🎉 내가 만든 문장이 [내 복습 코너(문법 노트)]에 저장되었습니다!");
          };
        }
      }
    }

    modal.classList.add("open");
  }

  function jumpToGrammarCard(gNo) {
    const target = document.getElementById("grammar-g-" + gNo) || document.getElementById("stage-grammar");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("grammar-target-pulse");
      setTimeout(() => {
        target.classList.remove("grammar-target-pulse");
      }, 3000);
      const titleText = target.querySelector("h3") ? target.querySelector("h3").textContent : `${gNo}번 문법`;
      showToast(`📖 [${titleText}] 설명 위치로 이동했습니다.`);
    }
  }

  // 4단계 문장 정복 챌린지 실행 엔진
  function startSentenceChallenge(sid) {
    const body = document.getElementById("sb-modal-body");
    let senObj = null;
    B.paragraphs.forEach(p => {
      const s = p.sentences.find(x => x.id === sid);
      if (s) senObj = s;
    });
    if (!senObj) return;

    let step = 1;

    function renderStep() {
      if (step === 1) {
        // 1단계: 청크 끊어읽기
        const chunks = CHUNKS_DB[sid] || senObj.en.split(/,\s*/);
        body.innerHTML = `
          <div class="challenge-step-badge">1단계 / 4단계 : 청크(의미 단위) 끊어 읽기</div>
          <div class="challenge-target-ko">${senObj.ko}</div>

          <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:14px;margin-bottom:14px;font-family:'Crimson Pro',serif;font-size:17px;font-weight:700;color:#0f766e;line-height:1.6">
            ${chunks.map(c => `<span>${c}</span>`).join(" <span style='color:#f59e0b;font-weight:800'>/</span> ")}
          </div>
          <p style="font-size:12px;color:#64748b;margin-bottom:14px">의미 단위로 끊어진 호흡을 느끼며 소리 내어 2번 따라 읽어보세요.</p>

          <div style="display:flex;gap:8px">
            <button type="button" class="btn-primary" id="btn-step1-audio" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px">${Y_SVG.speaker(13)} <span>청크 음성 듣기</span></button>
            <button type="button" class="btn-accent" id="btn-step1-next" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px"><span>2단계로 이동</span> ${Y_SVG.next(12)}</button>
          </div>
        `;
        document.getElementById("btn-step1-audio").onclick = () => speak(senObj.en, 0.8);
        document.getElementById("btn-step1-next").onclick = () => { step = 2; renderStep(); };
      } else if (step === 2) {
        // 2단계: 핵심 빈칸 단어 퍼즐
        const words = senObj.en.split(/\s+/);
        const blankIdx = Math.floor(words.length / 2);
        const targetWord = words[blankIdx].replace(/[^a-zA-Z]/g, "");
        const masked = words.map((w, i) => i === blankIdx ? "_______" : w).join(" ");

        body.innerHTML = `
          <div class="challenge-step-badge">2단계 / 4단계 : 핵심 빈칸 낱말 채우기</div>
          <div class="challenge-target-ko">${senObj.ko}</div>

          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:14px;margin-bottom:14px;font-family:'Crimson Pro',serif;font-size:16px;font-weight:600;color:#1e293b">
            ${masked}
          </div>

          <div style="margin-bottom:14px">
            <label style="display:block;font-size:12px;font-weight:700;color:#0f766e;margin-bottom:4px">빈칸에 들어갈 단어를 입력하세요:</label>
            <input type="text" id="input-step2-blank" placeholder="${targetWord.slice(0, 1)}..." style="width:100%;min-height:40px;border:1.5px solid #cbd5e1;border-radius:6px;padding:6px 10px;font:inherit;font-size:15px">
            <div id="step2-feedback" style="margin-top:6px;font-size:12px"></div>
          </div>

          <div style="display:flex;gap:8px">
            <button type="button" class="btn-primary" id="btn-step2-check" style="flex:1">정답 확인</button>
          </div>
        `;

        document.getElementById("btn-step2-check").onclick = () => {
          const val = document.getElementById("input-step2-blank").value.trim().toLowerCase();
          const fb = document.getElementById("step2-feedback");
          if (val === targetWord.toLowerCase()) {
            fb.innerHTML = "<b style='color:#16a34a'>🎉 정답입니다! 완벽해요.</b>";
            setTimeout(() => { step = 3; renderStep(); }, 800);
          } else {
            fb.innerHTML = `<span style='color:#dc2626'>아쉬워요! 힌트: 첫 글자는 '${targetWord[0]}'입니다.</span>`;
          }
        };
      } else if (step === 3) {
        // 3단계: 어순 배열 (Scramble Chips)
        const chunks = CHUNKS_DB[sid] ? [...CHUNKS_DB[sid]] : senObj.en.split(/\s+/);
        const shuffled = [...chunks].sort(() => Math.random() - 0.5);
        let placed = [];

        body.innerHTML = `
          <div class="challenge-step-badge">3단계 / 4단계 : 어순 배열 퍼즐</div>
          <div class="challenge-target-ko">${senObj.ko}</div>

          <div class="scramble-slots" id="scramble-slots">
            <span style="color:#94a3b8;font-size:12px" id="scramble-hint">아래 단어 조각을 올바른 순서대로 터치하세요.</span>
          </div>

          <div class="scramble-pool" id="scramble-pool">
            ${shuffled.map((c, i) => `<button type="button" class="word-chip" data-idx="${i}" data-val="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}
          </div>

          <div id="step3-feedback" style="margin-bottom:12px;font-size:12.5px"></div>

          <div style="display:flex;gap:8px">
            <button type="button" class="btn-secondary" id="btn-step3-reset" style="flex:1">다시 풀기</button>
            <button type="button" class="btn-primary" id="btn-step3-next" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px" disabled><span>4단계로 이동</span> ${Y_SVG.next(12)}</button>
          </div>
        `;

        const slots = document.getElementById("scramble-slots");
        const pool = document.getElementById("scramble-pool");
        const hint = document.getElementById("scramble-hint");
        const fb = document.getElementById("step3-feedback");
        const btnNext = document.getElementById("btn-step3-next");

        pool.addEventListener("click", e => {
          const btn = e.target.closest(".word-chip");
          if (!btn || btn.classList.contains("placed")) return;

          btn.classList.add("placed");
          if (hint) hint.remove();

          const val = btn.getAttribute("data-val");
          placed.push(val);

          const chip = document.createElement("span");
          chip.className = "word-chip placed";
          chip.textContent = val;
          slots.appendChild(chip);

          if (placed.length === chunks.length) {
            const correctStr = chunks.join(" ").replace(/\s+/g, " ");
            const placedStr = placed.join(" ").replace(/\s+/g, " ");
            if (correctStr === placedStr) {
              fb.innerHTML = "<b style='color:#16a34a'>어순 배열 완벽 성공!</b>";
              btnNext.disabled = false;
            } else {
              fb.innerHTML = "<span style='color:#dc2626'>순서가 틀렸어요. [다시 풀기]를 눌러보세요.</span>";
            }
          }
        });

        document.getElementById("btn-step3-reset").onclick = () => renderStep();
        btnNext.onclick = () => { step = 4; renderStep(); };
      } else if (step === 4) {
        // 4단계: 블라인드 통문장 낭독 & 정복 도장
        body.innerHTML = `
          <div class="challenge-step-badge">4단계 / 4단계 : 블라인드 통문장 낭독</div>
          <div class="challenge-target-ko" style="font-size:15px;margin-bottom:16px">${senObj.ko}</div>

          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px;margin-bottom:14px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:6px">영문이 가려져 있어요!</div>
            <div style="font-size:12px;color:#78350f">우리말만 보고 기억을 되살려 큰 소리로 말해보세요.</div>
            <button type="button" class="btn-primary" id="btn-peek-sen" style="margin-top:10px;font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;gap:4px">${Y_SVG.eye(13)} <span>슬쩍 정답 엿보기</span></button>
            <div id="peek-box" style="display:none;margin-top:8px;font-family:'Crimson Pro',serif;font-weight:700;color:#0f766e">${senObj.en}</div>
          </div>

          <div style="text-align:center;padding:12px;margin-bottom:14px">
            <button type="button" class="btn-accent" id="btn-complete-mastery" style="font-size:15px;padding:10px 24px;border-radius:30px;display:inline-flex;align-items:center;gap:6px">
              ${Y_SVG.award(16)} <span>외웠어요! 정복 도장 받기</span>
            </button>
          </div>
        `;

        document.getElementById("btn-peek-sen").onclick = () => {
          const pb = document.getElementById("peek-box");
          pb.style.display = pb.style.display === "none" ? "block" : "none";
        };

        document.getElementById("btn-complete-mastery").onclick = () => {
          Storage.set("mastered_" + sid, true);
          body.innerHTML = `
            <div style="text-align:center;padding:30px 10px">
              <div style="margin-bottom:12px;color:#16a34a">${Y_SVG.award(40)}</div>
              <h2 style="font-size:22px;color:#16a34a;margin:0 0 8px">통문장 완전정복 달성!</h2>
              <div class="mastery-stamp" style="font-size:15px;padding:6px 16px;margin-bottom:16px">${Y_SVG.check(13)} MASTERED STAMP</div>
              <p style="font-family:'Crimson Pro',serif;font-size:17px;font-weight:700;color:#1e293b;margin:0 0 4px">${senObj.en}</p>
              <p style="font-size:13px;color:#64748b">${senObj.ko}</p>
              <button type="button" class="btn-primary" id="btn-finish-challenge" style="margin-top:20px;padding:8px 24px">내 문장집 목록으로</button>
            </div>
          `;
          document.getElementById("btn-finish-challenge").onclick = openScrapbookModal;
        };
      }
    }

    renderStep();
  }

  // ── 5. 맞춤 학습지 인쇄 스튜디오 (Print Studio) ──
  function openPrintStudioModal() {
    const modal = document.getElementById("print-modal-overlay");
    const body = document.getElementById("print-modal-body");
    const savedVocab = Storage.get("saved_vocab", []);
    const savedSen = Storage.get("saved_sentences", []);
    const clinicList = Storage.get("spk_clinic", getDefaultClinicList());

    body.innerHTML = `
      <div style="margin-bottom:14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font-size:13px;color:#1e293b">
        ${Y_SVG.lightbulb(14)} <b>학생 1:1 맞춤 A4 인쇄 워크북</b><br>
        내가 학습한 단어, 문장, 오답 및 0.5점 클리닉을 선택하여 나만의 맞춤형 시험지/워크시트로 바로 인쇄합니다.
      </div>

      <div class="print-studio-card">
        <h4>${Y_SVG.book(14)} 인쇄 항목 선택</h4>
        <label class="print-check-label">
          <input type="checkbox" id="chk-print-vocab" checked>
          <span><b>[단어 쓰기 노트]</b> 저장한 단어 (${savedVocab.length > 0 ? savedVocab.length + '개' : '미저장 시 핵심 10단어'}) 3회 손글씨 연습</span>
        </label>
        <label class="print-check-label">
          <input type="checkbox" id="chk-print-sen" checked>
          <span><b>[외울 문장 드릴]</b> 스크랩 문장 (${savedSen.length > 0 ? savedSen.length + '개' : '핵심 5문장'}) 청크 끊어읽기 & 줄노트</span>
        </label>
        <label class="print-check-label">
          <input type="checkbox" id="chk-print-clinic" checked>
          <span><b>[오답 & 0.5점 클리닉]</b> 헷갈린 문법·소음 뭉개짐 방지 처방전 (${clinicList.length}제)</span>
        </label>
        <label class="print-check-label">
          <input type="checkbox" id="chk-print-grammar" checked>
          <span><b>[중2 필수 5대 문법]</b> 수동태·현재완료·to부정사·동명사·5형식 공식 요약표</span>
        </label>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12.5px;color:#64748b">
        ${Y_SVG.printer(13)} <b>인쇄 팁:</b> 크롬 인쇄 창에서 대상 «PDF로 저장» 또는 «프린터 출력», 용지 «A4», 여백 «기본»으로 설정하면 여백 잘림 없이 완벽하게 조판됩니다.
      </div>

      <div style="display:flex;gap:8px">
        <button type="button" class="btn-primary" id="btn-trigger-custom-print" style="flex:2;padding:10px;font-size:15px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px">${Y_SVG.printer(15)} <span>A4 용지로 바로 인쇄하기</span></button>
        <button type="button" class="btn-secondary" id="btn-cancel-print" style="flex:1">닫기</button>
      </div>
    `;

    document.getElementById("btn-cancel-print").onclick = () => modal.classList.remove("open");
    document.getElementById("btn-trigger-custom-print").onclick = () => {
      const opts = {
        vocab: document.getElementById("chk-print-vocab").checked,
        sen: document.getElementById("chk-print-sen").checked,
        clinic: document.getElementById("chk-print-clinic").checked,
        grammar: document.getElementById("chk-print-grammar").checked
      };
      if (!opts.vocab && !opts.sen && !opts.clinic && !opts.grammar) {
        alert("최소 한 개 이상의 인쇄 항목을 선택해 주세요.");
        return;
      }
      generateAndPrintCustomWorksheet(opts);
      modal.classList.remove("open");
    };

    modal.classList.add("open");
  }

  function getDefaultClinicList() {
    return [
      {
        type: "문법 (to부정사)",
        qid: "G-02",
        question: "빈센트는 화가가 되기로 결심했다. (빈칸 채우기)",
        mistake: "He decided become a painter. (❌ -0.5점: to 누락)",
        correct: "He decided to become a painter. (⭕ 1.0점)",
        rx: "decide, hope, want, plan 뒤에는 반드시 'to + 동사원형'을 씁니다! 'become' 단독으로 오면 안 됩니다.",
        practice: "He decided ___________________________ (화가가 되기로 결심했다)"
      },
      {
        type: "문법 (수동태)",
        qid: "G-04",
        question: "그는 따뜻한 격려와 돈으로 지원을 받았다.",
        mistake: "He supported by Theo with warm words. (❌ -0.5점: was 누락)",
        correct: "He was supported by Theo with warm words and money. (⭕ 1.0점)",
        rx: "주어가 지원을 '받은' 수동태이므로 과거 be동사 'was' + 과거분사 'supported'가 필수입니다.",
        practice: "He ___________________________ (지원받았다) by Theo."
      },
      {
        type: "말하기 (소음 간섭 뭉개짐)",
        qid: "S-01",
        question: "Where was Vincent van Gogh born?",
        mistake: "In the village of Zundert... [말끝 뭉개짐 -0.5점]",
        correct: "He was born in the village of Zundert. (⭕ 1.0점)",
        rx: "강의실 소음 환경에서는 마이크를 입 가까이에 대고 전치사구뿐 아니라 주어+동사(He was born)를 끝까지 또박또박 낭독하세요.",
        practice: "He was born in _______________________________________."
      }
    ];
  }

  function generateAndPrintCustomWorksheet(opts) {
    const paper = document.getElementById("yeon-print-paper");
    if (!paper) return;

    const savedVocab = Storage.get("saved_vocab", []);
    const vocabList = savedVocab.length > 0 ? savedVocab : ["village", "quiet", "field", "nature", "peace", "inspire", "painter", "brother", "support", "friendship"];
    
    const savedSen = Storage.get("saved_sentences", []);
    const senIds = savedSen.length > 0 ? savedSen : ["1-1", "1-3", "2-2", "2-4", "3-4"];
    
    const clinicList = Storage.get("spk_clinic", getDefaultClinicList());

    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    let html = `
      <div class="print-header-box">
        <div>
          <h1 class="print-title">연라이프 중2 영어 완전학습 맞춤형 워크북</h1>
          <div style="font-size:11pt;color:#334155;font-weight:700">빈센트 반 고흐 (Vincent van Gogh: The Painter of Light) · 1:1 맞춤 복습지</div>
        </div>
        <div class="print-meta-grid" style="text-align:right">
          <div><b>성명:</b> ____________________</div>
          <div><b>일시:</b> ${dateStr}</div>
          <div><b>확인:</b> [ 도장 / 서명 ]</div>
        </div>
      </div>
    `;

    // 1. 단어 쓰기 노트
    if (opts.vocab) {
      html += `
        <div class="print-sec-block">
          <div class="print-sec-head">
            <span>[1] 내 저장 단어 집중 손글씨 쓰기 노트 (${vocabList.length}단어)</span>
            <span style="font-size:9.5pt;font-weight:normal;color:#64748b">발음과 뜻을 익히며 바른 글씨로 3회씩 쓰세요.</span>
          </div>
          <table class="print-vocab-tbl">
            <thead>
              <tr>
                <th style="width:35px">No</th>
                <th style="width:110px">표제어 (Word)</th>
                <th style="width:90px">발음 (IPA)</th>
                <th style="width:130px">품사 및 우리말 뜻</th>
                <th style="width:120px">1회 따라쓰기</th>
                <th style="width:120px">2회 따라쓰기</th>
                <th>3회 암기 쓰기</th>
              </tr>
            </thead>
            <tbody>
              ${vocabList.map((w, idx) => {
                const data = DICT_DB[w] || { en: w, pron: "/-/", pos: "명사", meanings: ["단어 뜻"] };
                return `
                  <tr>
                    <td style="text-align:center;font-weight:700;color:#64748b">${idx + 1}</td>
                    <td style="font-family:'Crimson Pro',serif;font-weight:800;font-size:12pt;color:#0f766e">${escapeHtml(data.en)}</td>
                    <td style="color:#64748b;font-size:9pt">${escapeHtml(data.pron)}</td>
                    <td style="font-size:9.5pt"><b>[${escapeHtml(data.pos)}]</b> ${escapeHtml(data.meanings[0])}</td>
                    <td class="print-handwrite-cell" style="border-bottom:1px dashed #cbd5e1"></td>
                    <td class="print-handwrite-cell" style="border-bottom:1px dashed #cbd5e1"></td>
                    <td class="print-handwrite-cell" style="border-bottom:1px dashed #cbd5e1"></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    // 2. 외울 문장 & 청크 끊어읽기 드릴
    if (opts.sen) {
      html += `
        <div class="print-sec-block">
          <div class="print-sec-head">
            <span>[2] 통문장 암기 & 청크 끊어읽기(Slash) 손필기 드릴 (${senIds.length}문장)</span>
            <span style="font-size:9.5pt;font-weight:normal;color:#64748b">청크 단위로 의미를 파악하며 아래 빈칸에 직접 영작해 보세요.</span>
          </div>
      `;

      senIds.forEach((sid, idx) => {
        let senObj = null;
        for (let p of B.paragraphs) {
          const found = p.sentences.find(s => s.id === sid);
          if (found) { senObj = found; break; }
        }
        if (!senObj) return;

        const chunks = CHUNKS_DB[sid] ? CHUNKS_DB[sid].join(" / ") : senObj.en;

        html += `
          <div class="print-sen-item">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span class="print-sen-ko">Q${idx + 1}. ${escapeHtml(senObj.ko)}</span>
              <span style="font-size:8.5pt;color:#94a3b8;font-weight:700">[문장 ${sid}]</span>
            </div>
            <div class="print-sen-chunk">✂️ <b>청크 끊어읽기:</b> ${escapeHtml(chunks)}</div>
            <div class="print-handwrite-line">✍ 내 손으로 쓰기: </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    // 3. 오답 및 0.5점 실수 분석 클리닉
    if (opts.clinic) {
      html += `
        <div class="print-sec-block">
          <div class="print-sec-head">
            <span>[3] 취약점 오답 노트 & 0.5점 실수 분석 클리닉 (${clinicList.length}제)</span>
            <span style="font-size:9.5pt;font-weight:normal;color:#dc2626">사소한 0.5점 감점 실수를 완벽 방지하는 처방전</span>
          </div>
      `;

      clinicList.forEach((c, idx) => {
        html += `
          <div class="print-error-item">
            <div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:4px">
              <span style="color:#991b1b">⚠️ [${escapeHtml(c.type)}] ${escapeHtml(c.question)}</span>
              <span class="score-badge-half">-0.5점 방지 처방</span>
            </div>
            <div style="font-size:9.5pt;margin-bottom:3px;color:#475569">
              <span style="color:#dc2626;font-weight:700">학생 오답 / 실수:</span> ${escapeHtml(c.mistake)} &nbsp; | &nbsp;
              <span style="color:#16a34a;font-weight:700">올바른 정답:</span> ${escapeHtml(c.correct)}
            </div>
            <div style="background:#ffffff;border:1px solid #fecaca;border-radius:4px;padding:6px 8px;font-size:9.5pt;color:#7f1d1d;margin-bottom:6px">
              <b>💡 족집게 처방:</b> ${escapeHtml(c.rx)}
            </div>
            <div class="print-handwrite-line" style="border-bottom:1px dashed #ef4444;color:#991b1b">
              ✍ 바르게 고쳐 쓰기 연습: ${escapeHtml(c.practice || "")}
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    // 4. 중2 필수 5대 핵심 문법 요약표
    if (opts.grammar) {
      html += `
        <div class="print-sec-block">
          <div class="print-sec-head">
            <span>[4] 중2 1학기 내신 만점 핵심 문법 5대 공식 요약표</span>
            <span style="font-size:9.5pt;font-weight:normal;color:#0f766e">시험 전 3분 총정리 족보</span>
          </div>
          <table class="print-vocab-tbl">
            <thead>
              <tr>
                <th style="width:90px">문법 영역</th>
                <th style="width:160px">핵심 기본 공식</th>
                <th>본문 핵심 대표 예문 & 족집게 출제 포인트</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight:700;color:#0f766e">1. 수동태</td>
                <td><b>주어 + be동사 + p.p. + (by ~)</b></td>
                <td>
                  <em>Brilliant pictures <b>were painted</b> by Vincent.</em><br>
                  <span style="font-size:8.5pt;color:#64748b">※ 주어의 단/복수(was/were)와 과거 시제 일치에 유의할 것.</span>
                </td>
              </tr>
              <tr>
                <td style="font-weight:700;color:#0f766e">2. 현재완료</td>
                <td><b>have / has + 과거분사(p.p.)</b></td>
                <td>
                  <em>His art <b>has touched</b> the hearts of millions of people.</em><br>
                  <span style="font-size:8.5pt;color:#64748b">※ 과거부터 현재까지 영향을 미치는 '계속/완료' 용법 구별.</span>
                </td>
              </tr>
              <tr>
                <td style="font-weight:700;color:#0f766e">3. to부정사</td>
                <td><b>to + 동사원형</b></td>
                <td>
                  <em>At twenty-seven, he decided <b>to become</b> a painter. (명사적: 목적어)</em><br>
                  <em>Travelers visit the museum <b>to feel</b> his passion. (부사적: 목적 ~하기 위해)</em>
                </td>
              </tr>
              <tr>
                <td style="font-weight:700;color:#0f766e">4. 동명사</td>
                <td><b>동사원형 + -ing</b></td>
                <td>
                  <em>He enjoyed <b>walking</b> through the green fields.</em><br>
                  <span style="font-size:8.5pt;color:#64748b">※ enjoy, finish, keep, mind, give up 뒤에는 항상 동명사 목적어!</span>
                </td>
              </tr>
              <tr>
                <td style="font-weight:700;color:#0f766e">5. 5형식 문장</td>
                <td><b>주어 + 동사 + 목적어 + 목적격보어</b></td>
                <td>
                  <em>Nature inspired his young heart <b>to become</b> an artist. (동사 + O + to-v)</em><br>
                  <span style="font-size:8.5pt;color:#64748b">※ inspire, want, ask, tell류 동사는 목적격 보어로 to부정사를 취함.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
      <div class="print-footer-box">
        <span>도서출판 연라이프 · 중2 영어 예술가 교재 1권 빈센트 반 고흐 · 에듀테크 마스터리 시스템</span>
        <span>A4 맞춤 인쇄 최적화 조판본 (YeonLife Print Studio)</span>
      </div>
    `;

    paper.innerHTML = html;

    // Trigger Print
    document.body.classList.add("printing-custom");
    window.print();

    const cleanup = () => {
      document.body.classList.remove("printing-custom");
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 2500);
  }

  // ── 6. 강의실 소음 제어 & 0.5점 채점 설정 ──
  function openNoiseModal() {
    const modal = document.getElementById("noise-modal-overlay");
    const body = document.getElementById("noise-modal-body");
    const curSens = Storage.get("mic_sensitivity", "0.5");
    const autoAlert = Storage.get("mic_auto_alert", true);

    body.innerHTML = `
      <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:13px;color:#0f766e">
        🎙️ <b>학원 강의실 전용 마이크 최적화 기술</b><br>
        옆자리 학생의 웅성거림과 교실 소음을 필터링하고, 사소한 발음 뭉개짐에 0.5점 부분 점수를 부여하여 학생의 의욕을 지켜줍니다.
      </div>

      <div class="print-studio-card">
        <h4>🎚️ 마이크 감도 설정 (소음 차단)</h4>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="radio" name="mic-sens" value="1.0" ${curSens === '1.0' ? 'checked' : ''}>
            <span><b>1.0× 표준 감도</b> (조용한 독서실 / 가정 학습용)</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="radio" name="mic-sens" value="0.5" ${curSens === '0.5' ? 'checked' : ''}>
            <span style="color:#0f766e;font-weight:700">0.5× 강의실 소음 차단 모드 [추천] (옆자리 웅성거림 컷오프)</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="radio" name="mic-sens" value="0.3" ${curSens === '0.3' ? 'checked' : ''}>
            <span><b>0.3× 초밀착 귓속말 모드</b> (시끄러운 교실, 입술 2cm 밀착)</span>
          </label>
        </div>
      </div>

      <div class="print-studio-card">
        <h4>스마트 주변 소음 감지 및 추천</h4>
        <label class="print-check-label" style="margin-top:6px">
          <input type="checkbox" id="chk-auto-noise-alert" ${autoAlert ? 'checked' : ''}>
          <span>주변 소음이 65dB 이상 지속 감지 시 자동 감도 조절 팝업 추천</span>
        </label>
        <div style="margin-top:8px;font-size:12px;color:#64748b">
          현재 주변 소음 상태: <b style="color:#16a34a" id="realtime-noise-label">쾌적함 (38 dB)</b>
          <div class="noise-meter-bar"><div class="noise-meter-fill" id="realtime-noise-meter" style="width:35%"></div></div>
        </div>
      </div>

      <div class="print-studio-card">
        <h4>0.5점 미세 채점 제도</h4>
        <div style="font-size:12.5px;color:#334155;line-height:1.55;margin-bottom:8px">
          무조건 0점(오답)으로 처리하면 학생의 말하기 의욕이 꺾입니다. 관사(a/the) 누락이나 소음으로 인한 말끝 뭉개짐 발생 시 <b>0.5점 부분 점수</b>를 부여하고, 사유를 오답 클리닉에 자동 저장하여 워크북으로 출력합니다.
        </div>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn-secondary" id="btn-test-half-score" style="flex:1;font-size:12px;padding:5px">0.5점 판정 모의 체험</button>
        </div>
        <div id="test-half-score-box" style="display:none;margin-top:8px;padding:8px;background:#fef9c3;border:1px solid #fde047;border-radius:6px;font-size:12px;color:#854d0e"></div>
      </div>

      <div style="display:flex;gap:8px;margin-top:14px">
        <button type="button" class="btn-primary" id="btn-save-noise-settings" style="flex:1;padding:8px">설정 저장</button>
        <button type="button" class="btn-secondary" id="btn-close-noise" style="flex:1">닫기</button>
      </div>
    `;

    document.getElementById("btn-close-noise").onclick = () => modal.classList.remove("open");
    document.getElementById("btn-save-noise-settings").onclick = () => {
      const selectedSens = document.querySelector('input[name="mic-sens"]:checked').value;
      const checkedAuto = document.getElementById("chk-auto-noise-alert").checked;
      Storage.set("mic_sensitivity", selectedSens);
      Storage.set("mic_auto_alert", checkedAuto);
      alert("강의실 마이크 감도가 [" + selectedSens + "×]로 설정되었습니다.");
      modal.classList.remove("open");
    };

    document.getElementById("btn-test-half-score").onclick = () => {
      const box = document.getElementById("test-half-score-box");
      box.style.display = "block";
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <b>테스트 발언: "Vincent moved yellow house"</b>
          <span class="score-badge-half">0.5점 획득</span>
        </div>
        <div>${Y_SVG.lightbulb(13)} <b>원인 분석:</b> 'to the' 관사 및 전치사 누락 [소음 뭉개짐 감지]<br>
        실수 방지 포인트가 [맞춤 학습지 인쇄 > 오답 클리닉]에 자동 저장되었습니다!</div>
      `;
    };

    modal.classList.add("open");
  }

  // ── 7. 강의실 소음 자동 감지 팝업 & 말하기 연계 ──
  function initClassroomNoiseSupport() {
    // 5단계 말하기 헤더에 필요한 순간 나타나는 [🎙️ 마이크/소음 설정] 버튼 주입
    const speechSection = document.getElementById("stage-speech");
    if (speechSection) {
      const header = speechSection.querySelector(".stage-header");
      if (header && !document.getElementById("btn-stage-speech-noise")) {
        const noiseBtn = document.createElement("button");
        noiseBtn.type = "button";
        noiseBtn.id = "btn-stage-speech-noise";
        noiseBtn.className = "btn-stage-sub-tool";
        noiseBtn.title = "강의실 소음 제어 & 마이크 감도 설정";
        noiseBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <span>마이크/소음 설정</span>
        `;
        noiseBtn.onclick = openNoiseModal;
        header.appendChild(noiseBtn);
      }
    }

    const qRoot = document.getElementById("speech-questions-root");
    if (!qRoot) return;

    // 마이크 클릭 시 소음 간섭 감지 시뮬레이션 및 추천 팝업 플로팅
    qRoot.addEventListener("click", e => {
      const btn = e.target.closest(".btn-mic");
      if (!btn) return;

      const autoAlert = Storage.get("mic_auto_alert", true);
      const curSens = Storage.get("mic_sensitivity", "0.5");
      if (!autoAlert || curSens !== "1.0") return;

      // 표준(1.0) 상태에서 마이크를 켰을 때 주변 웅성거림 감지 팝업 시뮬레이션
      setTimeout(() => {
        if (!document.getElementById("active-noise-alert")) {
          const banner = document.createElement("div");
          banner.className = "noise-alert-banner";
          banner.id = "active-noise-alert";
          banner.innerHTML = `
            <div><b>[강의실 소음 감지]</b> 주변 웅성거림이 감지되었습니다. 마이크 감도를 [0.5× 강의실 모드]로 낮출까요?</div>
            <div style="display:flex;gap:4px">
              <button type="button" class="btn-primary" id="btn-quick-lower-sens" style="font-size:11px;padding:3px 7px">감도 낮추기</button>
              <button type="button" class="btn-secondary" id="btn-dismiss-noise" style="font-size:11px;padding:3px 7px">&times;</button>
            </div>
          `;
          btn.closest(".speech-q-box").insertBefore(banner, btn.closest(".speech-input-area"));

          document.getElementById("btn-quick-lower-sens").onclick = () => {
            Storage.set("mic_sensitivity", "0.5");
            banner.remove();
            alert("마이크 감도가 [0.5× 강의실 소음 차단 모드]로 최적화되었습니다.");
          };
          document.getElementById("btn-dismiss-noise").onclick = () => banner.remove();
        }
      }, 1000);
    });
  }

  // ── 8. 단원 마무리 실전 총괄 평가 (CBT Unit Final Exam) ──
  function openUnitTestModal() {
    const modal = document.getElementById("ut-modal-overlay");
    const body = document.getElementById("ut-modal-body");
    const testList = B.test || [];
    let userAnswers = {};
    let timeLeft = 15 * 60; // 15분
    let timerId = null;

    function renderExam() {
      body.innerHTML = `
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:13px;color:#1e293b">
          ${Y_SVG.gradCap(15)} <b>제1단원 [빈센트 반 고흐] 실전 CBT 총괄 평가</b><br>
          어휘·독해·문법·대화 10문항으로 단원 성취도를 종합 진단합니다. (80점 이상 시 <b>단원 수료 공식 인증서</b> 발급)
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="cbt-exam-timer" id="cbt-timer-display">${Y_SVG.timer(13)} 남은 시간 15:00</div>
          <span style="font-size:12.5px;color:#64748b">진행률: <b id="cbt-progress-text">0 / 10문항 마킹</b></span>
        </div>

        <!-- OMR 답안 마킹 스트립 -->
        <div class="cbt-omr-strip" id="cbt-omr-strip">
          ${testList.map(item => `
            <div class="cbt-omr-dot" id="omr-dot-${item.no}" data-qno="${item.no}">
              ${item.no}
            </div>
          `).join("")}
        </div>

        <!-- 10문항 문제 리스트 -->
        <div id="cbt-questions-container" style="max-height:48vh;overflow-y:auto;padding-right:6px">
          ${testList.map(item => {
            const badgeClass = item.type === "vocab" ? "vocab" : (item.type === "reading" ? "reading" : "dialogue");
            const badgeName = item.type === "vocab" ? "어휘" : (item.type === "reading" ? "본문 독해" : "대화/문법");
            return `
              <div class="test-q-card" style="margin-bottom:16px;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px" id="cbt-card-${item.no}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <b style="color:var(--yl-pri-dk);font-size:15px">${item.no}번 문항</b>
                  <span class="test-badge ${badgeClass}" style="font-size:11px;padding:2px 8px;border-radius:12px">${badgeName}</span>
                </div>
                <div style="font-size:14.5px;font-weight:600;margin-bottom:10px;white-space:pre-line;color:#1e293b">${escapeHtml(item.q)}</div>
                <div class="choices-list" style="display:flex;flex-direction:column;gap:6px">
                  ${item.choices.map((ch, chIdx) => `
                    <button type="button" class="btn-secondary cbt-choice-btn" data-qno="${item.no}" data-ch="${chIdx}" style="text-align:left;padding:8px 12px;font-size:13.5px;border-radius:6px;transition:all 0.15s">
                      ${chIdx + 1}. ${escapeHtml(ch)}
                    </button>
                  `).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <div style="display:flex;gap:8px;margin-top:16px">
          <button type="button" class="btn-primary" id="btn-cbt-submit" style="flex:2;padding:10px;font-size:15px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px">${Y_SVG.check(14)} <span>답안 제출 및 성적표 산출</span></button>
          <button type="button" class="btn-secondary" id="btn-cbt-cancel" style="flex:1">닫기</button>
        </div>
      `;

      // Timer
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        if (timeLeft <= 0) {
          clearInterval(timerId);
          submitExam();
          return;
        }
        timeLeft--;
        const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
        const s = String(timeLeft % 60).padStart(2, "0");
        const tEl = document.getElementById("cbt-timer-display");
        if (tEl) tEl.innerHTML = `${Y_SVG.timer(13)} 남은 시간 ${m}:${s}`;
      }, 1000);

      // OMR dot click to scroll
      body.querySelectorAll(".cbt-omr-dot").forEach(dot => {
        dot.onclick = () => {
          const qno = dot.getAttribute("data-qno");
          const card = document.getElementById("cbt-card-" + qno);
          if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
        };
      });

      // Choice selection
      body.querySelectorAll(".cbt-choice-btn").forEach(btn => {
        btn.onclick = () => {
          const qno = +btn.getAttribute("data-qno");
          const ch = +btn.getAttribute("data-ch");
          userAnswers[qno] = ch;

          // Highlight button
          const card = document.getElementById("cbt-card-" + qno);
          card.querySelectorAll(".cbt-choice-btn").forEach(b => {
            b.style.borderColor = "";
            b.style.background = "";
            b.style.color = "";
          });
          btn.style.borderColor = "#0f766e";
          btn.style.background = "#f0fdfa";
          btn.style.color = "#0f766e";
          btn.style.fontWeight = "700";

          // OMR dot fill
          const dot = document.getElementById("omr-dot-" + qno);
          if (dot) dot.classList.add("filled");

          // Update progress
          const count = Object.keys(userAnswers).length;
          document.getElementById("cbt-progress-text").textContent = `${count} / 10문항 마킹`;
        };
      });

      document.getElementById("btn-cbt-cancel").onclick = () => {
        if (timerId) clearInterval(timerId);
        modal.classList.remove("open");
      };

      document.getElementById("btn-cbt-submit").onclick = () => {
        const answeredCount = Object.keys(userAnswers).length;
        if (answeredCount < testList.length) {
          if (!confirm(`아직 마킹하지 않은 문항이 ${testList.length - answeredCount}개 있습니다. 이대로 채점할까요?`)) {
            return;
          }
        }
        if (timerId) clearInterval(timerId);
        submitExam();
      };
    }

    function submitExam() {
      let score = 0;
      let wrongItems = [];
      let typeScores = { vocab: 0, reading: 0, dialogue: 0 };
      let typeTotals = { vocab: 0, reading: 0, dialogue: 0 };

      testList.forEach(item => {
        typeTotals[item.type]++;
        const uAns = userAnswers[item.no];
        if (uAns === item.answer) {
          score += 10;
          typeScores[item.type]++;
        } else {
          wrongItems.push(item);
        }
      });

      // Grade determination
      let grade = "C등급 (재도전 권장)";
      let gradeColor = "#64748b";
      if (score >= 90) { grade = "S등급 (마스터 · 완전정복)"; gradeColor = "#f59e0b"; }
      else if (score >= 80) { grade = "A등급 (우수 · 단원 합격)"; gradeColor = "#10b981"; }
      else if (score >= 70) { grade = "B등급 (보통 · 보충 필요)"; gradeColor = "#3b82f6"; }

      const vPct = Math.round((typeScores.vocab / typeTotals.vocab) * 100);
      const rPct = Math.round((typeScores.reading / typeTotals.reading) * 100);
      const dPct = Math.round((typeScores.dialogue / typeTotals.dialogue) * 100);

      // Save to best score and error clinic
      const prevBest = Storage.get("unit_exam_best_score", 0);
      if (score > prevBest) Storage.set("unit_exam_best_score", score);
      Storage.set("unit_exam_last_score", score);

      // Append wrong items to error clinic
      if (wrongItems.length > 0) {
        let clinic = Storage.get("spk_clinic", getDefaultClinicList());
        wrongItems.forEach(w => {
          if (!clinic.find(c => c.qid === "T-" + w.no)) {
            clinic.push({
              type: "단원총괄 (" + (w.type === 'vocab' ? '어휘' : (w.type === 'reading' ? '독해' : '대화문법')) + ")",
              qid: "T-" + w.no,
              question: w.q.split("\n")[0],
              mistake: (userAnswers[w.no] !== undefined ? (w.choices[userAnswers[w.no]] || "오답") : "미응답") + " (❌ -10점)",
              correct: w.choices[w.answer] + " (⭕ 정답)",
              rx: w.why,
              practice: w.q
            });
          }
        });
        Storage.set("spk_clinic", clinic);
      }

      // Render Result Report Card
      body.innerHTML = `
        <div class="cbt-report-card">
          <div style="font-size:13px;color:#ccfbf1;font-weight:700;margin-bottom:4px">제1단원 빈센트 반 고흐 · 단원 총괄 평가 성적표</div>
          <div class="cbt-score-display">${score}<span style="font-size:22px"> / 100점</span></div>
          <div class="cbt-grade-badge" style="background:${gradeColor};color:#ffffff">${grade}</div>
        </div>

        <div class="print-studio-card">
          <h4>4영역 학업 성취도 진단</h4>
          <div class="cbt-radar-bar">
            <span style="width:75px">어휘 영역</span>
            <div class="cbt-bar-bg"><div class="cbt-bar-fill" style="width:${vPct}%;background:#0284c7"></div></div>
            <span style="width:50px;text-align:right;font-weight:700">${vPct}%</span>
          </div>
          <div class="cbt-radar-bar">
            <span style="width:75px">독해 영역</span>
            <div class="cbt-bar-bg"><div class="cbt-bar-fill" style="width:${rPct}%;background:#16a34a"></div></div>
            <span style="width:50px;text-align:right;font-weight:700">${rPct}%</span>
          </div>
          <div class="cbt-radar-bar">
            <span style="width:75px">대화/문법</span>
            <div class="cbt-bar-bg"><div class="cbt-bar-fill" style="width:${dPct}%;background:#d97706"></div></div>
            <span style="width:50px;text-align:right;font-weight:700">${dPct}%</span>
          </div>
        </div>

        ${score >= 80 ? `
          <div class="unit-certificate">
            <div style="margin-bottom:8px;color:#d97706">${Y_SVG.award(36)}</div>
            <div class="unit-cert-title">단원 수료 공식 인증서 (Certificate of Mastery)</div>
            <div style="font-size:13px;color:#78350f;margin-top:6px;line-height:1.6">
              위 학생은 도서출판 연라이프 중2 영어 예술가 교재 제1권 [빈센트 반 고흐] 단원 전 과정을 성실히 이수하고 총괄 평가에서 우수한 성적(${score}점)으로 통과하였음을 인증합니다.
            </div>
            <div style="margin-top:10px;font-size:12px;color:#92400e;font-weight:700">
              도서출판 연라이프 · 발행인 연소사 [공식 날인]
            </div>
          </div>
        ` : `
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;margin-bottom:14px;font-size:13px;color:#991b1b;text-align:center">
            ${Y_SVG.lightbulb(13)} <b>80점 이상 획득 시 [단원 수료 인증서]가 발급됩니다.</b><br>
            틀린 문제(${wrongItems.length}개)는 오답 클리닉에 자동 저장되었습니다. 맞춤 학습지로 복습 후 다시 도전해 보세요!
          </div>
        `}

        <div style="display:flex;flex-direction:column;gap:8px">
          <button type="button" class="btn-primary" id="btn-cbt-print-clinic" style="padding:10px;font-size:14.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px">${Y_SVG.printer(14)} <span>성적표 & 오답 클리닉 맞춤 학습지 인쇄</span></button>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn-secondary" id="btn-cbt-retry" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px">${Y_SVG.rotate(13)} <span>100점 재도전 (시험 다시 치르기)</span></button>
            <button type="button" class="btn-secondary" id="btn-cbt-close-final" style="flex:1">닫기</button>
          </div>
        </div>
      `;

      document.getElementById("btn-cbt-close-final").onclick = () => modal.classList.remove("open");
      document.getElementById("btn-cbt-retry").onclick = () => {
        userAnswers = {};
        timeLeft = 15 * 60;
        renderExam();
      };
      document.getElementById("btn-cbt-print-clinic").onclick = () => {
        modal.classList.remove("open");
        openPrintStudioModal();
      };
    }

    renderExam();
    modal.classList.add("open");
  }

  // ── 9. 단원 완료 후 시험 치르기 안내 배너 주입 ──
  function injectUnitExamBanner() {
    const stageSpeech = document.getElementById("stage-speech");
    if (!stageSpeech || document.getElementById("unit-exam-callout")) return;

    const banner = document.createElement("div");
    banner.id = "unit-exam-callout";
    banner.style.cssText = "margin-top:24px;background:linear-gradient(135deg,#1f2530 0%,#2e3642 100%);color:#ffffff;border-radius:12px;padding:18px;text-align:center;box-shadow:0 6px 18px rgba(46,54,66,0.2)";
    banner.innerHTML = `
      <div style="margin-bottom:6px;color:#fef08a">${Y_SVG.gradCap(32)}</div>
      <h3 style="margin:0 0 6px 0;font-size:17px;color:#fef08a">빈센트 반 고흐 단원 학습을 마치셨나요?</h3>
      <p style="margin:0 0 14px 0;font-size:13px;color:#cbd5e1">
        어휘·문법·독해·대화 전 영역을 종합 점검하는 <b>실전 CBT 단원 총괄 평가</b>를 치르고<br>
        80점 이상 획득 시 <b>[단원 수료 공식 인증서]</b>를 발급받으세요!
      </p>
      <button type="button" class="btn-accent" id="btn-start-unit-exam-banner" style="font-size:14.5px;font-weight:800;padding:10px 22px;border-radius:30px;display:inline-flex;align-items:center;gap:6px">
        ${Y_SVG.gradCap(16)} <span>제1단원 총괄 평가 시험 치르기 (CBT)</span>
      </button>
    `;

    stageSpeech.appendChild(banner);
    document.getElementById("btn-start-unit-exam-banner").onclick = openUnitTestModal;
  }

  // 손필기 워크북 인쇄 바로가기 (글로벌 호환)
  window.printHandwritingWorksheet = openPrintStudioModal;

  // Helper
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // DOM 로드 후 가동
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMasteryEngine);
  } else {
    initMasteryEngine();
  }
})();
