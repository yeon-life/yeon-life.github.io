/* 영어 예술가 교재 1권 · 빈센트 반 고흐 학생 폰 앱 스크립트 */
(function () {
  "use strict";

  const B = window.BOOK;
  if (!B) {
    console.error("BOOK 데이터를 불러오지 못했습니다.");
    return;
  }

  // 오늘 날짜 키 (YYYY-MM-DD)
  const todayKey = () => new Date().toISOString().slice(0, 10);

  // 로컬 저장소 래퍼 (eng-gogh/ prefix)
  const StorageUtil = {
    get(key, def) {
      try {
        if (window.YeonStorage && typeof window.YeonStorage.get === "function") {
          return window.YeonStorage.get(key, def);
        }
        const v = localStorage.getItem("eng-gogh/" + key);
        return v === null ? def : JSON.parse(v);
      } catch (e) {
        return def;
      }
    },
    set(key, val) {
      try {
        if (window.YeonStorage && typeof window.YeonStorage.set === "function") {
          window.YeonStorage.set(key, val);
        }
        localStorage.setItem("eng-gogh/" + key, JSON.stringify(val));
      } catch (e) {}
    }
  };

  // 토스트 메시지
  function showToast(msg) {
    let t = document.getElementById("toast-msg");
    if (!t) return;
    t.textContent = msg;
    t.style.display = "block";
    t.style.opacity = "1";
    if (t._timer) clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => { t.style.display = "none"; }, 300);
    }, 2200);
  }
  window.showToast = showToast;

  /* ── 0. 미국식 음성 합성 (speechSynthesis) 유틸 ── */
  function speakEnglish(text, rate = 0.85, pitch = 1.0, onEndCallback = null) {
    if (!("speechSynthesis" in window)) {
      const fb = document.getElementById("listen-fallback-msg");
      if (fb) fb.style.display = "block";
      if (onEndCallback) onEndCallback();
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.rate = rate;
    utt.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices() || [];
    const usVoices = voices.filter(v => {
      const l = (v.lang || "").toLowerCase();
      const n = (v.name || "").toLowerCase();
      if (l.includes("gb") || l.includes("uk") || l.includes("au") || l.includes("in")) return false;
      if (n.includes("united kingdom") || n.includes("british") || n.includes("george") || n.includes("hazel")) return false;
      return l.includes("us") || l === "en";
    });
    if (usVoices.length > 0) {
      const natural = usVoices.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("jenny") || v.name.toLowerCase().includes("guy") || v.name.toLowerCase().includes("google"));
      utt.voice = natural || usVoices[0];
    }

    if (onEndCallback) {
      utt.onend = onEndCallback;
      utt.onerror = onEndCallback;
    }
    window.speechSynthesis.speak(utt);
  }

  /* ── 내 단어장 관리 (saved_vocab 단일 저장소 연동) ── */
  const Wordbook = {
    getAll() {
      // yeon-english-mastery와 완전히 동일한 saved_vocab 키 사용
      let list = StorageUtil.get("saved_vocab", null);
      if (!list) {
        list = StorageUtil.get("my_vocab", []);
      }
      return Array.isArray(list) ? list : [];
    },
    has(word) {
      if (!word) return false;
      const list = this.getAll();
      const lower = word.trim().toLowerCase();
      return list.some(w => typeof w === 'string' && w.toLowerCase() === lower);
    },
    toggle(word) {
      if (!word) return false;
      const clean = word.trim();
      let list = this.getAll();
      const lower = clean.toLowerCase();
      const idx = list.findIndex(w => typeof w === 'string' && w.toLowerCase() === lower);
      let inBook = false;
      if (idx >= 0) {
        list.splice(idx, 1);
        inBook = false;
      } else {
        list.push(clean);
        inBook = true;
      }
      StorageUtil.set("saved_vocab", list);
      if (window.YeonStorage && typeof window.YeonStorage.set === "function") {
        try { window.YeonStorage.set("saved_vocab", list); } catch (e) {}
      }
      if (window.updateYeonCounters && typeof window.updateYeonCounters === "function") {
        try { window.updateYeonCounters(); } catch (e) {}
      }
      return inBook;
    },
    addWords(words) {
      if (!Array.isArray(words) || words.length === 0) return 0;
      let list = this.getAll();
      let added = 0;
      words.forEach(w => {
        if (!w) return;
        const clean = String(w).trim();
        const lower = clean.toLowerCase();
        if (!list.some(existing => typeof existing === 'string' && existing.toLowerCase() === lower)) {
          list.push(clean);
          added++;
        }
      });
      if (added > 0) {
        StorageUtil.set("saved_vocab", list);
        if (window.YeonStorage && typeof window.YeonStorage.set === "function") {
          try { window.YeonStorage.set("saved_vocab", list); } catch (e) {}
        }
        if (window.updateYeonCounters && typeof window.updateYeonCounters === "function") {
          try { window.updateYeonCounters(); } catch (e) {}
        }
      }
      return added;
    },
    removeWords(words) {
      if (!Array.isArray(words) || words.length === 0) return 0;
      let list = this.getAll();
      const lowerTargets = new Set(words.map(w => String(w).trim().toLowerCase()));
      const initialLen = list.length;
      list = list.filter(w => !lowerTargets.has(String(w).toLowerCase()));
      const removed = initialLen - list.length;
      if (removed > 0) {
        StorageUtil.set("saved_vocab", list);
        if (window.YeonStorage && typeof window.YeonStorage.set === "function") {
          try { window.YeonStorage.set("saved_vocab", list); } catch (e) {}
        }
        if (window.updateYeonCounters && typeof window.updateYeonCounters === "function") {
          try { window.updateYeonCounters(); } catch (e) {}
        }
      }
      return removed;
    },
    count() {
      return this.getAll().length;
    }
  };
  window.Wordbook = Wordbook;

  /* ── 1. 읽기 단계 ── */
  let readTimerActive = false;
  let readTimerStart = 0;
  let readTimerInterval = null;

  function initStageRead() {
    const root = document.getElementById("read-paragraphs-root");
    const statsEl = document.getElementById("read-stats-display");
    const toggleBtn = document.getElementById("btn-toggle-timer");
    const toggleAllKoBtn = document.getElementById("btn-toggle-all-ko");
    const vocabBody = document.getElementById("vocab-table-body");

    // 오늘 통계 업데이트
    function updateReadStats() {
      const date = todayKey();
      const count = StorageUtil.get("read_count_" + date, 0);
      const sec = StorageUtil.get("read_sec_" + date, 0);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      statsEl.textContent = `오늘 읽은 횟수: ${count}회 (${m > 0 ? m + "분 " : ""}${s}초)`;
    }
    updateReadStats();

    // 읽기 시작/끝 토글 버튼
    toggleBtn.addEventListener("click", () => {
      const date = todayKey();
      if (!readTimerActive) {
        readTimerActive = true;
        readTimerStart = Date.now();
        toggleBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-2px;margin-right:6px"><rect x="4" y="4" width="16" height="16" rx="2"/></svg><span>읽기 멈춤</span>';
        toggleBtn.classList.remove("btn-primary");
        toggleBtn.classList.add("btn-accent");
        readTimerInterval = setInterval(() => {
          const curElapsed = Math.floor((Date.now() - readTimerStart) / 1000);
          const savedSec = StorageUtil.get("read_sec_" + date, 0);
          const total = savedSec + curElapsed;
          const m = Math.floor(total / 60);
          const s = total % 60;
          statsEl.textContent = `읽는 중… (${m > 0 ? m + "분 " : ""}${s}초)`;
        }, 1000);
      } else {
        readTimerActive = false;
        clearInterval(readTimerInterval);
        const elapsed = Math.floor((Date.now() - readTimerStart) / 1000);
        const prevSec = StorageUtil.get("read_sec_" + date, 0);
        const prevCount = StorageUtil.get("read_count_" + date, 0);
        StorageUtil.set("read_sec_" + date, prevSec + elapsed);
        StorageUtil.set("read_count_" + date, prevCount + 1);
        toggleBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:6px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span>읽기 시작</span>';
        toggleBtn.classList.remove("btn-accent");
        toggleBtn.classList.add("btn-primary");
        updateReadStats();
        updateSummaryStage();
        showToast("읽기 활동이 기록되었어요!");
      }
    });

    // 전체 해석 토글
    let allKoHidden = false;
    toggleAllKoBtn.addEventListener("click", () => {
      allKoHidden = !allKoHidden;
      document.querySelectorAll(".sentence-ko").forEach(el => {
        el.classList.toggle("hidden", allKoHidden);
      });
      toggleAllKoBtn.textContent = allKoHidden ? "전체 해석 보기" : "전체 해석 가리기";
    });

    // 문단 렌더링
    const imgMap = {
      1: "img/S01_어린시절_네덜란드_들판.webp",
      2: "img/S02_편지쓰는_책상.webp",
      3: "img/S03_아를_노란집과_해바라기.webp",
      4: "img/S04_창가_별밤_스케치.webp",
      5: "img/S05_오늘의_미술관.webp"
    };

    root.innerHTML = "";
    B.paragraphs.forEach(p => {
      const card = document.createElement("div");
      card.className = "paragraph-card";
      card.id = "read-p-" + p.no;

      let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3>문단 ${p.no}</h3>
        <button type="button" class="btn-secondary btn-p-listen" data-pno="${p.no}" style="min-height:36px;padding:4px 10px;font-size:13px;display:inline-flex;align-items:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg><span>문단 듣기</span></button>
      </div>`;

      if (imgMap[p.no]) {
        html += `<div class="stage-img-wrap">
          <img src="${imgMap[p.no]}" alt="문단 ${p.no} 삽화" class="stage-img" loading="lazy">
        </div>`;
      }

      html += `<div class="sentences-list">`;
      p.sentences.forEach(s => {
        html += `<div class="sentence-item" data-sid="${s.id}">
          <div class="sentence-en">${tokenizeSentence(s.en)}</div>
          <div class="sentence-ko">${escapeHtml(s.ko)}</div>
        </div>`;
      });
      html += `</div>`;

      card.innerHTML = html;
      root.appendChild(card);
    });

    // 문단 듣기 단추 이벤트
    root.addEventListener("click", e => {
      const btn = e.target.closest(".btn-p-listen");
      if (btn) {
        const pno = +btn.getAttribute("data-pno");
        const targetP = B.paragraphs.find(x => x.no === pno);
        if (targetP) {
          speakEnglish(targetP.tts_text, 0.85);
          showToast(`문단 ${pno} 낭독을 시작합니다.`);
        }
      }
    });

    // 단어 클릭 시 모달
    root.addEventListener("click", e => {
      const span = e.target.closest(".vocab-clickable");
      if (span) {
        const rawWord = span.getAttribute("data-word");
        openWordModal(rawWord);
      }
    });

    // 내 단어장 탭 및 어휘 표 렌더링
    const tabAllBtn = document.getElementById("tab-vocab-all");
    const tabMyBtn = document.getElementById("tab-vocab-my");
    const myCountEl = document.getElementById("my-vocab-count");
    const myEmptyEl = document.getElementById("my-vocab-empty");
    const vocabTable = document.getElementById("vocab-table");

    // 어휘 일괄 제어 바 (체크리스트 & 단어장에 담기 & 복습 연동)
    const chkBatchMaster = document.getElementById("chk-vocab-batch-all");
    const chkColAll = document.getElementById("chk-vocab-col-all");
    const batchCountBadge = document.getElementById("vocab-batch-count-badge");
    const btnBatchAdd = document.getElementById("btn-batch-add-wordbank");
    const batchAddLabel = document.getElementById("batch-add-label");
    const btnBatchFlashcard = document.getElementById("btn-batch-flashcard");
    const btnBatchPrint = document.getElementById("btn-batch-print-vocab");
    const btnBatchClear = document.getElementById("btn-batch-clear");

    let currentVocabTab = "all";

    function getCheckedVocabWords() {
      if (!vocabBody) return [];
      const checkboxes = vocabBody.querySelectorAll(".chk-vocab-row:checked");
      return Array.from(checkboxes).map(cb => cb.getAttribute("data-word")).filter(Boolean);
    }

    function updateBatchBarState() {
      if (!vocabBody) return;
      const allCheckboxes = vocabBody.querySelectorAll(".chk-vocab-row");
      const checkedWords = getCheckedVocabWords();
      const count = checkedWords.length;
      const total = allCheckboxes.length;

      if (batchCountBadge) {
        batchCountBadge.textContent = `${count}개 선택됨`;
      }

      const isAllChecked = total > 0 && count === total;
      const isPartiallyChecked = count > 0 && count < total;

      if (chkBatchMaster) {
        chkBatchMaster.checked = isAllChecked;
        chkBatchMaster.indeterminate = isPartiallyChecked;
      }
      if (chkColAll) {
        chkColAll.checked = isAllChecked;
        chkColAll.indeterminate = isPartiallyChecked;
      }

      if (btnBatchAdd) {
        btnBatchAdd.disabled = count === 0;
        if (currentVocabTab === "my") {
          if (batchAddLabel) batchAddLabel.textContent = count > 0 ? `선택 단어 내 단어장에서 제외 (${count}개)` : "체크한 단어 내 단어장에서 제외";
        } else {
          if (batchAddLabel) batchAddLabel.textContent = count > 0 ? `체크한 단어 내 단어장에 담기 (${count}개)` : "체크한 단어 내 단어장에 담기";
        }
      }

      if (btnBatchClear) {
        btnBatchClear.style.display = count > 0 ? "inline-flex" : "none";
      }
    }

    function setAllRowCheckboxes(checked) {
      if (!vocabBody) return;
      vocabBody.querySelectorAll(".chk-vocab-row").forEach(cb => {
        cb.checked = checked;
        const tr = cb.closest("tr");
        if (tr) tr.classList.toggle("is-checked", checked);
      });
      updateBatchBarState();
    }

    function updateSentenceHighlights() {
      root.querySelectorAll(".vocab-clickable").forEach(el => {
        const w = el.getAttribute("data-word");
        if (Wordbook.has(w)) {
          el.classList.add("in-wordbook");
          el.title = "⭐ 내 단어장에 저장된 어휘 (탭하여 확인)";
        } else {
          el.classList.remove("in-wordbook");
          el.title = "어휘 탭하여 뜻 보기";
        }
      });
    }

    function renderVocabTable() {
      const allWords = B.vocab;
      const savedCount = allWords.filter(v => Wordbook.has(v.en)).length;
      if (myCountEl) myCountEl.textContent = savedCount;

      let list = allWords;
      if (currentVocabTab === "my") {
        list = allWords.filter(v => Wordbook.has(v.en));
      }

      if (currentVocabTab === "my" && list.length === 0) {
        if (vocabTable) vocabTable.style.display = "none";
        if (myEmptyEl) myEmptyEl.style.display = "block";
      } else {
        if (vocabTable) vocabTable.style.display = "table";
        if (myEmptyEl) myEmptyEl.style.display = "none";
      }

      vocabBody.innerHTML = "";
      list.forEach((v, idx) => {
        const isSaved = Wordbook.has(v.en);
        const tr = document.createElement("tr");
        tr.className = "vocab-row" + (isSaved ? " is-in-wordbook" : "");
        tr.setAttribute("data-word", v.en);
        tr.innerHTML = `
          <td class="vocab-word-cell" data-word="${escapeHtml(v.en)}" title="클릭하여 원어민 발음 듣기 & 단어 사전 보기">
            <div class="vocab-word-inner">
              <b class="vocab-table-word">${escapeHtml(v.en)}</b>
              <span class="vocab-word-sound-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></span>
            </div>
          </td>
          <td><span class="vocab-pos-badge">${escapeHtml(v.pos)}</span></td>
          <td>${escapeHtml(v.ko)}</td>
          <td style="text-align:center" class="td-vocab-check">
            <input type="checkbox" class="chk-vocab-row" data-word="${escapeHtml(v.en)}" id="chk-word-${idx}" title="${escapeHtml(v.en)} 단어장에 담기 선택" aria-label="${escapeHtml(v.en)} 선택">
          </td>
          <td style="text-align:center"><button type="button" class="btn-vocab-star ${isSaved ? 'saved' : ''}" data-word="${escapeHtml(v.en)}" title="${isSaved ? '내 단어장에서 빼기' : '내 단어장에 넣기'}">${isSaved ? '⭐' : '☆'}</button></td>
        `;
        vocabBody.appendChild(tr);
      });

      updateSentenceHighlights();
      updateBatchBarState();
    }
    window.renderVocabTableGlobal = renderVocabTable;

    if (tabAllBtn && tabMyBtn) {
      tabAllBtn.addEventListener("click", () => {
        currentVocabTab = "all";
        tabAllBtn.classList.add("active");
        tabMyBtn.classList.remove("active");
        renderVocabTable();
      });
      tabMyBtn.addEventListener("click", () => {
        currentVocabTab = "my";
        tabMyBtn.classList.add("active");
        tabAllBtn.classList.remove("active");
        renderVocabTable();
      });
    }

    // 마스터 체크박스 핸들러
    if (chkBatchMaster) {
      chkBatchMaster.addEventListener("change", () => {
        setAllRowCheckboxes(chkBatchMaster.checked);
      });
    }
    if (chkColAll) {
      chkColAll.addEventListener("change", () => {
        setAllRowCheckboxes(chkColAll.checked);
      });
    }

    // 일괄 단어장에 담기 / 제외 버튼
    if (btnBatchAdd) {
      btnBatchAdd.addEventListener("click", () => {
        const words = getCheckedVocabWords();
        if (words.length === 0) {
          showToast("단어장에 담을 단어의 체크박스를 먼저 선택해 주세요.");
          return;
        }

        if (currentVocabTab === "my") {
          const removed = Wordbook.removeWords(words);
          showToast(`'${words.length}개' 단어를 내 단어장에서 제외했습니다.`);
        } else {
          const added = Wordbook.addWords(words);
          showToast(`⭐ 선택하신 ${words.length}개 단어가 내 단어장에 쏙 담겼습니다! [3초 깜빡이] 단추로 지금 바로 복습해 보세요.`);
        }

        renderVocabTable();
        updateSummaryStage();
      });
    }

    // 3초 깜빡이 플래시카드 복습 버튼
    if (btnBatchFlashcard) {
      btnBatchFlashcard.addEventListener("click", () => {
        const allSaved = Wordbook.getAll();
        if (allSaved.length === 0) {
          showToast("내 단어장에 담긴 단어가 아직 없습니다. 단어를 먼저 체크하여 담아보세요!");
          return;
        }
        if (window.openWordBankModal) {
          window.openWordBankModal();
        } else {
          showToast("3초 깜빡이 플래시카드를 불러오는 중입니다...");
        }
      });
    }

    // 나만의 단어 복습장 인쇄 버튼
    if (btnBatchPrint) {
      btnBatchPrint.addEventListener("click", () => {
        if (window.openPrintStudioModal) {
          window.openPrintStudioModal();
        } else if (window.printHandwritingWorksheet) {
          window.printHandwritingWorksheet();
        }
      });
    }

    // 빈 단어장 안내문 전체 목록 버튼 연동
    const btnGoAll = document.getElementById("btn-go-all-vocab");
    if (btnGoAll && tabAllBtn) {
      btnGoAll.addEventListener("click", () => {
        tabAllBtn.click();
      });
    }

    // 선택 해제 버튼
    if (btnBatchClear) {
      btnBatchClear.addEventListener("click", () => {
        setAllRowCheckboxes(false);
      });
    }

    // 어휘 표 이벤트 위임 (단어 클릭 발음·사전, 별표 토글, 개별 듣기, 체크박스 토글)
    vocabBody.addEventListener("click", e => {
      // 1. 단어 텍스트 또는 단어 셀 클릭 -> 발음 재생 & 사전 열기
      const wordCell = e.target.closest(".vocab-word-cell, .vocab-table-word, .vocab-word-inner");
      if (wordCell) {
        const tr = wordCell.closest("tr");
        const en = wordCell.getAttribute("data-word") || (tr ? tr.getAttribute("data-word") : "") || wordCell.textContent.trim();
        if (en) {
          if (window.speak) window.speak(en, 0.85);
          else speakEnglish(en, 0.85);

          if (window.openYeonDict) {
            window.openYeonDict(en);
          } else {
            openWordModal(en);
          }

          if (tr) {
            tr.classList.add("is-playing");
            setTimeout(() => tr.classList.remove("is-playing"), 700);
          }
        }
        return;
      }

      // 2. 별표 버튼 (단어장 개별 토글)
      const starBtn = e.target.closest(".btn-vocab-star");
      if (starBtn) {
        const word = starBtn.getAttribute("data-word");
        const inBook = Wordbook.toggle(word);
        if (inBook) {
          showToast(`⭐ '${word}' 단어가 내 단어장에 저장되었어요!`);
        } else {
          showToast(`'${word}' 단어를 내 단어장에서 제외했어요.`);
        }
        renderVocabTable();
        updateSummaryStage();
        return;
      }

      // 3. 개별 듣기 스피커 버튼
      const listenBtn = e.target.closest(".btn-vocab-listen");
      if (listenBtn) {
        const en = listenBtn.getAttribute("data-en");
        if (window.speak) window.speak(en, 0.85);
        else speakEnglish(en, 0.85);
        const tr = listenBtn.closest("tr");
        if (tr) {
          tr.classList.add("is-playing");
          setTimeout(() => tr.classList.remove("is-playing"), 700);
        }
        return;
      }
    });

    // 체크박스 체인지 이벤트 위임
    vocabBody.addEventListener("change", e => {
      if (e.target.classList.contains("chk-vocab-row")) {
        const tr = e.target.closest("tr");
        if (tr) tr.classList.toggle("is-checked", e.target.checked);
        updateBatchBarState();
      }
    });

    renderVocabTable();
  }

  // 문장 내 단어 분할 및 vocab 태깅
  function tokenizeSentence(text) {
    const tokens = text.split(/(\s+)/);
    return tokens.map(tok => {
      if (/^\s+$/.test(tok)) return tok;
      const clean = tok.replace(/[^a-zA-Z]/g, "").toLowerCase();
      const match = findVocabMatch(clean);
      if (match) {
        return `<span class="vocab-clickable" data-word="${escapeHtml(match.en)}">${escapeHtml(tok)}</span>`;
      }
      return escapeHtml(tok);
    }).join("");
  }

  function findVocabMatch(word) {
    if (!word) return null;
    let found = B.vocab.find(v => v.en.toLowerCase() === word);
    if (found) return found;
    // 4글자 이상 어간 일치 검색 (예: painted -> paint)
    if (word.length >= 4) {
      found = B.vocab.find(v => {
        const stem = v.en.toLowerCase().slice(0, 4);
        return word.startsWith(stem);
      });
    }
    return found || null;
  }

  // 단어 모달 열기
  function openWordModal(wordEn) {
    const item = B.vocab.find(v => v.en.toLowerCase() === wordEn.toLowerCase()) || { en: wordEn, pos: "단어", ko: "본문 어휘" };
    const modal = document.getElementById("word-modal");
    document.getElementById("modal-word-en").textContent = item.en;
    document.getElementById("modal-word-pos").textContent = `[${item.pos}]`;
    document.getElementById("modal-word-ko").textContent = item.ko;

    const listenBtn = document.getElementById("btn-modal-listen");
    listenBtn.onclick = () => speakEnglish(item.en, 0.85);

    const bookBtn = document.getElementById("btn-modal-toggle-wordbook");
    const bookIcon = document.getElementById("modal-wordbook-icon");
    const bookLabel = document.getElementById("modal-wordbook-label");

    function refreshModalBookBtn() {
      const isSaved = Wordbook.has(item.en);
      if (isSaved) {
        if (bookIcon) bookIcon.textContent = "⭐";
        if (bookLabel) bookLabel.textContent = "단어장에서 빼기";
        if (bookBtn) {
          bookBtn.classList.remove("btn-accent");
          bookBtn.classList.add("btn-secondary");
        }
      } else {
        if (bookIcon) bookIcon.textContent = "☆";
        if (bookLabel) bookLabel.textContent = "내 단어장에 넣기";
        if (bookBtn) {
          bookBtn.classList.remove("btn-secondary");
          bookBtn.classList.add("btn-accent");
        }
      }
    }
    refreshModalBookBtn();

    if (bookBtn) {
      bookBtn.onclick = () => {
        const inBook = Wordbook.toggle(item.en);
        refreshModalBookBtn();
        if (inBook) {
          showToast(`⭐ '${item.en}' 단어가 내 단어장에 저장되었어요!`);
        } else {
          showToast(`'${item.en}' 단어를 내 단어장에서 제외했어요.`);
        }
        if (window.renderVocabTableGlobal) window.renderVocabTableGlobal();
        updateSummaryStage();
      };
    }

    modal.style.display = "flex";
  }

  document.getElementById("btn-modal-close").addEventListener("click", () => {
    document.getElementById("word-modal").style.display = "none";
  });

  /* ── 2. 문법 단계 ── */
  function renderInteractiveGrammarSentence(sentenceEn, gno) {
    const hlPatterns = {
      1: /\b(was born|worked|moved|stayed|watched|started|passed away|sold|loved)\b/i,
      2: /\b(decided to become|wanted to support|started drawing|hope to see)\b/i,
      3: /\b(enjoyed walking|loved looking at|loved painting|drawing spinning)\b/i,
      4: /\b(was supported|were painted|was created)\b/i,
      5: /\b(have visited|have loved|has touched)\b/i
    };

    const pattern = hlPatterns[gno];
    let targetWords = [];
    if (pattern) {
      const match = sentenceEn.match(pattern);
      if (match) {
        targetWords = match[0].toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, "")).filter(Boolean);
      }
    }

    return sentenceEn.replace(/([a-zA-Z]+(?:'[a-zA-Z]+)?)|([^a-zA-Z]+)/g, (match, word, nonWord) => {
      if (word) {
        const clean = word.toLowerCase().replace(/[^a-z]/g, "");
        const isTarget = targetWords.length > 0 && targetWords.includes(clean);
        const targetCls = isTarget ? " is-grammar-target" : "";
        return `<span class="grammar-example-word v-word${targetCls}" data-w="${escapeHtml(clean)}" title="탭하여 단어 뜻·발음 보기">${escapeHtml(word)}</span>`;
      }
      return nonWord || "";
    });
  }

  function initStageGrammar() {
    const root = document.getElementById("grammar-cards-root");
    root.innerHTML = "";

    B.grammar.forEach(g => {
      const card = document.createElement("div");
      card.className = "grammar-card";
      card.id = "grammar-g-" + g.no;

      let html = `<h3>${g.no}. ${escapeHtml(g.name_ko)}</h3>
      <div class="grammar-rule">${escapeHtml(g.rule_ko)}</div>`;

      // 본문 속 예문 (발음 스피커 & 단어 사전 탭)
      html += `
      <div class="grammar-examples">
        <div class="grammar-examples-head">
          <div class="grammar-examples-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#b8955a"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <b>본문 속 예문:</b>
          </div>
          <span class="grammar-example-hint">💡 단어 탭: 뜻·발음 사전 / 스피커: 문장 낭독</span>
        </div>
        <div class="grammar-examples-list">`;
      g.examples.forEach(sid => {
        const sentence = findSentenceById(sid);
        if (sentence) {
          html += `
          <div class="grammar-example-item" data-sid="${sentence.id}">
            <div class="grammar-example-row">
              <button type="button" class="btn-grammar-example-listen" data-sid="${sentence.id}" data-en="${escapeHtml(sentence.en)}" title="[본문 ${sentence.id}] 문장 발음 듣기 (미국 표준 원어민)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              </button>
              <span class="grammar-example-badge">[본문 ${sentence.id}]</span>
              <div class="grammar-example-en">"${renderInteractiveGrammarSentence(sentence.en, g.no)}"</div>
            </div>
            <div class="grammar-example-ko">${escapeHtml(sentence.ko)}</div>
          </div>`;
        }
      });
      html += `</div></div>`;

      // 확인 문제 2개
      html += `<div class="grammar-checks-list">`;
      g.checks.forEach((chk, cIdx) => {
        html += `<div class="grammar-check-item" data-gno="${g.no}" data-cidx="${cIdx}">
          <div class="grammar-q-text">${escapeHtml(chk.q)}</div>
          <div class="choices-list">`;
        chk.choices.forEach((ch, chIdx) => {
          html += `<button type="button" class="choice-btn" data-ch="${chIdx}">${chIdx + 1}. ${escapeHtml(ch)}</button>`;
        });
        html += `</div>
          <div class="choice-why" style="display:none"><b>해설:</b> ${escapeHtml(chk.why)}</div>
        </div>`;
      });
      html += `</div>`;

      card.innerHTML = html;
      root.appendChild(card);
    });

    // 문법 카드 통합 클릭 이벤트 위임
    root.addEventListener("click", e => {
      // 1. 예문 스피커 버튼 클릭 -> 문장 낭독 재생!
      const listenBtn = e.target.closest(".btn-grammar-example-listen");
      if (listenBtn) {
        e.stopPropagation();
        const sid = listenBtn.getAttribute("data-sid");
        const en = listenBtn.getAttribute("data-en");

        root.querySelectorAll(".grammar-example-item").forEach(el => el.classList.remove("speaking"));
        const itemEl = listenBtn.closest(".grammar-example-item");
        if (itemEl) itemEl.classList.add("speaking");

        if (window.AudioPlaybackManager && typeof window.AudioPlaybackManager.playSentence === "function") {
          window.AudioPlaybackManager.playSentence(sid);
        } else if (window.speak) {
          window.speak(en, 0.85, () => {
            if (itemEl) itemEl.classList.remove("speaking");
          });
        } else {
          speakEnglish(en, 0.85, 1.0, () => {
            if (itemEl) itemEl.classList.remove("speaking");
          });
        }
        showToast(`🔊 [본문 ${sid}] 문장 낭독을 시작합니다.`);
        return;
      }

      // 2. 예문 내 단어 텍스트 클릭 -> 발음 재생 & 사전 열기!
      const wordEl = e.target.closest(".grammar-example-word, .v-word");
      if (wordEl) {
        e.stopPropagation();
        const rawWord = wordEl.getAttribute("data-w") || wordEl.textContent.trim();
        if (rawWord) {
          if (window.speak) window.speak(rawWord, 0.85);
          else speakEnglish(rawWord, 0.85);

          if (window.openYeonDict) {
            window.openYeonDict(rawWord);
          } else {
            openWordModal(rawWord);
          }

          wordEl.classList.add("clicked");
          setTimeout(() => wordEl.classList.remove("clicked"), 400);
        }
        return;
      }

      // 3. 문제 선택지 클릭 이벤트
      const btn = e.target.closest(".choice-btn");
      if (!btn) return;
      const itemEl = btn.closest(".grammar-check-item");
      const gno = +itemEl.getAttribute("data-gno");
      const cidx = +itemEl.getAttribute("data-cidx");
      const chosen = +btn.getAttribute("data-ch");
      const checkObj = B.grammar.find(x => x.no === gno).checks[cidx];

      const allBtns = itemEl.querySelectorAll(".choice-btn");
      allBtns.forEach(b => {
        b.disabled = true;
        const bIdx = +b.getAttribute("data-ch");
        if (bIdx === checkObj.answer) b.classList.add("correct");
        else if (bIdx === chosen) b.classList.add("wrong");
      });

      const whyEl = itemEl.querySelector(".choice-why");
      if (whyEl) whyEl.style.display = "block";
    });
  }

  function findSentenceById(sid) {
    for (const p of B.paragraphs) {
      for (const s of p.sentences) {
        if (s.id === sid) return s;
      }
    }
    return null;
  }

  /* ── 3. 듣기 단계 ── */
  let listenSpeed = 0.85;
  let listenRepeat = 1; // 1, 2, 3, 5, 999
  let listenPlaying = false;
  let listenPaused = false;
  let listenSentences = [];
  let listenCurIdx = 0;
  let listenCurRepeatCount = 0;

  function initStageListen() {
    const speedGroup = document.getElementById("listen-speed-group");
    const repeatGroup = document.getElementById("listen-repeat-group");
    const scopeSelect = document.getElementById("listen-scope-select");
    const displayBox = document.getElementById("listen-sentences-display");
    const playBtn = document.getElementById("btn-listen-play");
    const pauseBtn = document.getElementById("btn-listen-pause");
    const stopBtn = document.getElementById("btn-listen-stop");

    // 속도 버튼
    speedGroup.addEventListener("click", e => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      speedGroup.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      listenSpeed = parseFloat(btn.getAttribute("data-rate")) || 0.85;
      StorageUtil.set("listen_speed", listenSpeed);
    });

    // 반복 버튼 (repeat / 반복 1, 2, 3, 5)
    repeatGroup.addEventListener("click", e => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      repeatGroup.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      listenRepeat = parseInt(btn.getAttribute("data-repeat"), 10) || 1;
    });

    // 범위 변경 시 화면 갱신
    function refreshDisplay() {
      displayBox.innerHTML = "";
      listenSentences = [];
      const scope = scopeSelect.value;
      let pList = B.paragraphs;
      if (scope !== "all") {
        pList = B.paragraphs.filter(p => p.no === +scope);
      }
      pList.forEach(p => {
        p.sentences.forEach(s => {
          listenSentences.push({ sid: s.id, en: s.en, ko: s.ko, pno: p.no });
        });
      });

      listenSentences.forEach((s, idx) => {
        const div = document.createElement("div");
        div.className = "listen-line";
        div.id = "listen-line-" + idx;
        div.innerHTML = `<span style="font-size:12px;color:#94a3b8;margin-right:6px">[${s.sid}]</span>${escapeHtml(s.en)}`;
        displayBox.appendChild(div);
      });
    }

    scopeSelect.addEventListener("change", () => {
      stopListening();
      refreshDisplay();
    });
    refreshDisplay();

    // 재생 루프
    function playNextSentence() {
      if (!listenPlaying || listenPaused) return;

      if (listenCurIdx >= listenSentences.length) {
        listenCurRepeatCount++;
        if (listenCurRepeatCount < listenRepeat) {
          listenCurIdx = 0; // 반복
        } else {
          stopListening();
          showToast("듣기 재생이 완료되었습니다.");
          return;
        }
      }

      displayBox.querySelectorAll(".listen-line").forEach(el => el.classList.remove("active"));
      const lineEl = document.getElementById("listen-line-" + listenCurIdx);
      if (lineEl) {
        lineEl.classList.add("active");
        lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const item = listenSentences[listenCurIdx];
      speakEnglish(item.en, listenSpeed, 1.0, () => {
        if (!listenPlaying || listenPaused) return;
        listenCurIdx++;
        // 문장 사이 0.6초 쉼
        setTimeout(playNextSentence, 600);
      });
    }

    playBtn.addEventListener("click", () => {
      if (listenPaused) {
        listenPaused = false;
        listenPlaying = true;
        playNextSentence();
        return;
      }
      listenPlaying = true;
      listenPaused = false;
      listenCurIdx = 0;
      listenCurRepeatCount = 0;
      playNextSentence();

      // 활동 기록
      const date = todayKey();
      const prevP = StorageUtil.get("listened_p_" + date, 0);
      const scopeCount = scopeSelect.value === "all" ? 5 : 1;
      StorageUtil.set("listened_p_" + date, Math.max(prevP, scopeCount));
      StorageUtil.set("max_speed_" + date, Math.max(StorageUtil.get("max_speed_" + date, 0.7), listenSpeed));
      updateSummaryStage();
    });

    pauseBtn.addEventListener("click", () => {
      if (listenPlaying) {
        listenPaused = true;
        window.speechSynthesis.pause();
      }
    });

    function stopListening() {
      listenPlaying = false;
      listenPaused = false;
      listenCurIdx = 0;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      displayBox.querySelectorAll(".listen-line").forEach(el => el.classList.remove("active"));
    }
    stopBtn.addEventListener("click", stopListening);
  }

  /* ── 4. 대화문 단계 ── */
  let curDialogueId = "D1";
  let curRoleMode = "all"; // all, seoa, minjun

  function initStageDialogue() {
    const tab1 = document.getElementById("tab-dialogue-1");
    const tab2 = document.getElementById("tab-dialogue-2");
    const roleAllBtn = document.getElementById("btn-role-all");
    const roleSeoaBtn = document.getElementById("btn-role-seoa");
    const roleMinjunBtn = document.getElementById("btn-role-minjun");
    const contentRoot = document.getElementById("dialogue-content-root");

    tab1.addEventListener("click", () => {
      curDialogueId = "D1";
      tab1.className = "btn-primary";
      tab2.className = "btn-secondary";
      renderDialogue();
    });

    tab2.addEventListener("click", () => {
      curDialogueId = "D2";
      tab2.className = "btn-primary";
      tab1.className = "btn-secondary";
      renderDialogue();
    });

    [roleAllBtn, roleSeoaBtn, roleMinjunBtn].forEach(b => {
      b.addEventListener("click", () => {
        [roleAllBtn, roleSeoaBtn, roleMinjunBtn].forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        if (b === roleAllBtn) curRoleMode = "all";
        else if (b === roleSeoaBtn) curRoleMode = "seoa";
        else if (b === roleMinjunBtn) curRoleMode = "minjun";
        renderDialogue();
      });
    });

    function renderDialogue() {
      const d = B.dialogues.find(x => x.id === curDialogueId);
      if (!d) return;

      const imgPath = d.id === "D1" ? "img/D01_미술관_입구_대화.webp" : "img/D02_기념품_가게_대화.webp";

      let html = `
        <div class="stage-img-wrap">
          <img src="${imgPath}" alt="${escapeHtml(d.title_ko)}" class="stage-img" loading="lazy">
        </div>
        <div style="background:#f1f5f9;padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:14px;font-size:14px;color:#475569">
          <b>상황:</b> ${escapeHtml(d.situation_ko)}
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <button type="button" class="btn-primary" id="btn-play-dialogue" style="display:inline-flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>전체 대화 듣기</span></button>
        </div>
        <div class="dialogue-turns-list">
      `;

      d.turns.forEach((turn, idx) => {
        const isSeoa = turn.speaker.toLowerCase() === "seoa";
        const isMasked = (curRoleMode === "seoa" && isSeoa) || (curRoleMode === "minjun" && !isSeoa);

        html += `<div class="dialogue-turn ${isSeoa ? 'speaker-seoa' : 'speaker-minjun'}" id="turn-${turn.id}" data-idx="${idx}">
          <div class="turn-speaker">${escapeHtml(turn.speaker)}</div>
          ${isMasked ? `
            <div class="roleplay-masked" data-turn-id="${turn.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>내 차례예요! 직접 말해본 뒤 여기를 눌러 정답을 확인하세요</span>
            </div>
            <div class="turn-revealed" style="display:none">
              <div class="turn-en">${escapeHtml(turn.en)}</div>
              <div class="turn-ko">${escapeHtml(turn.ko)}</div>
            </div>
          ` : `
            <div class="turn-en">${escapeHtml(turn.en)}</div>
            <div class="turn-ko">${escapeHtml(turn.ko)}</div>
          `}
        </div>`;
      });

      // 단원 단어/문법 배지
      html += `</div>
        <div style="margin-top:16px;padding:12px;border:1px dashed var(--color-border);border-radius:var(--radius-sm)">
          <div style="font-size:13px;font-weight:700;color:var(--color-primary-dark);margin-bottom:4px">활용 단어:</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:8px">${d.uses_vocab.join(", ")}</div>
          <div style="font-size:13px;font-weight:700;color:var(--color-primary-dark);margin-bottom:4px">활용 문법:</div>
          <div style="font-size:13px;color:#64748b">${d.uses_grammar.join(", ")}</div>
        </div>
      `;

      contentRoot.innerHTML = html;

      // 역할 놀이 가리기 해제 클릭
      contentRoot.querySelectorAll(".roleplay-masked").forEach(el => {
        el.addEventListener("click", () => {
          el.style.display = "none";
          el.nextElementSibling.style.display = "block";
        });
      });

      // 대화 순차 재생
      const playBtn = document.getElementById("btn-play-dialogue");
      if (playBtn) {
        playBtn.onclick = () => {
          let lineIdx = 0;
          function playNextLine() {
            if (lineIdx >= d.turns.length) {
              showToast("대화 듣기가 완료되었어요.");
              return;
            }
            const t = d.turns[lineIdx];
            const isSeoa = t.speaker.toLowerCase() === "seoa";
            const pitch = isSeoa ? 1.25 : 0.85;

            // 역할 놀이 중 내 차례면 건너뛰거나 안내
            const isMyTurn = (curRoleMode === "seoa" && isSeoa) || (curRoleMode === "minjun" && !isSeoa);
            if (isMyTurn) {
              showToast(`${t.speaker} 차례예요! 큰 소리로 말해보세요.`);
              lineIdx++;
              setTimeout(playNextLine, 2500);
              return;
            }

            speakEnglish(t.en, listenSpeed, pitch, () => {
              lineIdx++;
              setTimeout(playNextLine, 600);
            });
          }
          playNextLine();
        };
      }
    }

    renderDialogue();
  }

  /* ── 5. AI 말하기 단계 (무료 시험판) ── */
  let speechRecognition = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let dbPromise = null;

  // IndexedDB 열기 (녹음 파일 로컬 전용 저장)
  function getDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open("eng_gogh_db", 1);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("recordings")) {
            db.createObjectStore("recordings", { keyPath: "id" });
          }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e);
      });
    }
    return dbPromise;
  }

  function saveRecording(qid, blob) {
    getDB().then(db => {
      const tx = db.transaction("recordings", "readwrite");
      tx.objectStore("recordings").put({ id: qid, blob: blob, date: todayKey() });
    }).catch(() => {});
  }

  function getRecording(qid, callback) {
    getDB().then(db => {
      const tx = db.transaction("recordings", "readonly");
      const req = tx.objectStore("recordings").get(qid);
      req.onsuccess = () => callback(req.result ? req.result.blob : null);
    }).catch(() => callback(null));
  }

  function initStageSpeech() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSpeechRecSupported = !!SpeechRec;

    const qRoot = document.getElementById("speech-questions-root");
    qRoot.innerHTML = "";

    B.ai_talk.questions.forEach((q, idx) => {
      const qBox = document.createElement("div");
      qBox.className = "speech-q-box";
      qBox.id = "speech-q-" + q.id;

      let html = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <b style="color:var(--color-primary-dark);font-size:16px">${q.id}. ${escapeHtml(q.question_en)}</b>
            <div style="font-size:13.5px;color:#64748b;margin-top:2px">${escapeHtml(q.question_ko)}</div>
          </div>
          <button type="button" class="btn-q-speak" data-en="${escapeHtml(q.question_en)}" title="질문 듣기"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>
        </div>
        <div class="speech-input-area">
          <input type="text" class="speech-text-input" placeholder="영어로 말하거나 여기에 직접 써보세요" id="input-${q.id}">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${isSpeechRecSupported ? `<button type="button" class="btn-secondary btn-mic" data-qid="${q.id}" style="display:inline-flex;align-items:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>말하기</span></button>` : `<span style="font-size:12px;color:#94a3b8">브라우저 음성 인식이 지원되지 않아 글 입력으로 진행해요.</span>`}
            <button type="button" class="btn-primary btn-submit-speech" data-qid="${q.id}">답변 확인</button>
            <button type="button" class="btn-secondary btn-play-myvoice" data-qid="${q.id}" style="display:none;align-items:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg><span>내 목소리 다시 듣기</span></button>
          </div>
        </div>
        <div class="speech-feedback-box" id="feedback-${q.id}" style="display:none"></div>
      `;

      qBox.innerHTML = html;
      qRoot.appendChild(qBox);

      // 저장된 내 목소리 녹음 복원
      getRecording(q.id, blob => {
        if (blob) {
          const playVoiceBtn = qBox.querySelector(`.btn-play-myvoice[data-qid="${q.id}"]`);
          if (playVoiceBtn) playVoiceBtn.style.display = "inline-flex";
        }
      });
    });

    // 질문 오디오 듣기
    qRoot.addEventListener("click", e => {
      const btn = e.target.closest(".btn-q-speak");
      if (btn) {
        speakEnglish(btn.getAttribute("data-en"), 0.85);
      }
    });

    // 마이크 음성 인식 및 MediaRecorder 녹음
    if (isSpeechRecSupported) {
      let activeRecordingQid = null;
      let activeStream = null;
      let activeMediaRecorder = null;
      let activeRecognition = null;
      let autoStopTimer = null;

      function stopActiveRecording(showToastMsg = true) {
        if (!activeRecordingQid) return;
        const qid = activeRecordingQid;
        activeRecordingQid = null;

        if (autoStopTimer) {
          clearTimeout(autoStopTimer);
          autoStopTimer = null;
        }

        const btn = qRoot.querySelector(`.btn-mic[data-qid="${qid}"]`);
        if (btn) {
          btn.classList.remove("recording");
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>말하기</span>';
        }

        const inputEl = document.getElementById("input-" + qid);
        if (inputEl && !inputEl.value.trim()) {
          inputEl.placeholder = "영어로 말하거나 여기에 직접 써보세요";
        }

        if (activeRecognition) {
          try {
            activeRecognition.onend = null;
            activeRecognition.onerror = null;
            activeRecognition.stop();
          } catch(e) {}
          activeRecognition = null;
        }

        if (activeMediaRecorder && activeMediaRecorder.state !== "inactive") {
          try {
            activeMediaRecorder.stop();
          } catch(e) {}
        }

        if (showToastMsg) {
          if (inputEl && inputEl.value.trim()) {
            showToast("🎙️ 음성 인식이 완료되었습니다. [답변 확인] 단추를 눌러 채점해 보세요!");
          } else {
            showToast("음성이 감지되지 않았습니다. 큰 소리로 다시 말씀하시거나 직접 글을 써보세요.");
          }
        }
      }

      qRoot.addEventListener("click", async e => {
        const btn = e.target.closest(".btn-mic");
        if (!btn) return;
        const qid = btn.getAttribute("data-qid");
        const inputEl = document.getElementById("input-" + qid);

        // 이미 녹음 중인 상태에서 버튼 클릭 -> 수동 중지 및 완료!
        if (activeRecordingQid === qid) {
          stopActiveRecording(true);
          return;
        }

        // 다른 문항이 녹음 중이었으면 먼저 안전하게 중지
        if (activeRecordingQid) {
          stopActiveRecording(false);
        }

        activeRecordingQid = qid;

        // UI 즉각 반응 (스톱 버튼으로 고정 전환)
        btn.classList.add("recording");
        btn.innerHTML = '<span class="rec-pulsing-dot"></span><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-1px;margin-right:4px"><rect x="4" y="4" width="16" height="16" rx="2"/></svg><span>녹음 중지 (말씀하세요…)</span>';
        if (inputEl) {
          inputEl.placeholder = "말씀을 듣고 있어요… (영어 문장을 말씀하신 뒤 '녹음 중지'를 누르세요)";
        }

        // 1. MediaRecorder 내 목소리 녹음 시작
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          activeStream = stream;
          audioChunks = [];
          const mr = new MediaRecorder(stream);
          activeMediaRecorder = mr;

          mr.ondataavailable = ev => {
            if (ev.data.size > 0) audioChunks.push(ev.data);
          };

          mr.onstop = () => {
            if (audioChunks.length > 0) {
              const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
              saveRecording(qid, audioBlob);
              const playVoiceBtn = document.querySelector(`.btn-play-myvoice[data-qid="${qid}"]`);
              if (playVoiceBtn) playVoiceBtn.style.display = "inline-flex";
            }
            if (activeStream) {
              activeStream.getTracks().forEach(t => t.stop());
              activeStream = null;
            }
          };

          mr.start();
        } catch(err) {
          console.warn("MediaRecorder mic access warning:", err);
          showToast("마이크 접근이 차단되어 있을 수 있습니다. 주소창에서 권한을 확인해 보세요.");
        }

        // 2. SpeechRecognition 음성 인식 시작 (continuous: true 로 조기 종료 원천 방지)
        try {
          const rec = new SpeechRec();
          activeRecognition = rec;
          rec.lang = "en-US";
          rec.continuous = true;       // 짧은 쉼 때문에 저절로 꺼지지 않도록 연속 모드 활성화!
          rec.interimResults = true;    // 말하는 즉시 입력창에 글자가 실시간으로 타이핑되도록 지원!
          rec.maxAlternatives = 1;

          rec.onresult = ev => {
            let fullTranscript = "";
            for (let i = 0; i < ev.results.length; ++i) {
              fullTranscript += ev.results[i][0].transcript + " ";
            }
            fullTranscript = fullTranscript.trim();
            if (fullTranscript && inputEl) {
              inputEl.value = fullTranscript;
            }
          };

          rec.onerror = ev => {
            console.log("SpeechRec error:", ev.error);
            // no-speech는 잠깐 숨을 고르는 침묵이므로 녹음을 강제 종료하지 않음!
            if (ev.error === "no-speech") {
              return;
            }
            if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
              showToast("⚠️ 마이크 사용 권한이 거부되었습니다. 브라우저 주소창에서 마이크를 허용해 주세요.");
              stopActiveRecording(false);
            }
          };

          rec.onend = () => {
            // 사용자가 아직 '녹음 중지'를 누르지 않았는데 브라우저가 잠시 종료한 경우, 자동으로 재가동하여 스톱 버튼 유지!
            if (activeRecordingQid === qid) {
              try {
                rec.start();
              } catch(e) {
                // 재가동 불가 시에도 MediaRecorder는 녹음 중이므로 사용자가 중지 누를 때까지 유지
              }
            }
          };

          rec.start();
        } catch(e) {
          console.warn("SpeechRec start error:", e);
        }

        // 3. 25초 안전 자동 종료 타이머
        autoStopTimer = setTimeout(() => {
          if (activeRecordingQid === qid) {
            stopActiveRecording(true);
          }
        }, 25000);
      });
    }

    // 내 목소리 다시 듣기
    qRoot.addEventListener("click", e => {
      const btn = e.target.closest(".btn-play-myvoice");
      if (!btn) return;
      const qid = btn.getAttribute("data-qid");
      getRecording(qid, blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
          showToast("녹음된 내 목소리를 재생합니다.");
        }
      });
    });

    // 5-1 규칙 기반 답변 평가 엔진
    qRoot.addEventListener("click", e => {
      // 1. 단어별 정밀 대조 칩 클릭 -> 해당 단어 원어민 발음 재생
      const chip = e.target.closest(".spk-chip");
      if (chip) {
        const w = chip.getAttribute("data-word");
        if (w) {
          if (window.speak) window.speak(w, 0.85);
          else speakEnglish(w, 0.85);
        }
        return;
      }

      // 2. 모범 답안 원어민 발음 듣기
      const natBtn = e.target.closest(".btn-native-sample");
      if (natBtn) {
        const en = natBtn.getAttribute("data-en");
        if (en) {
          if (window.speak) window.speak(en, 0.85);
          else speakEnglish(en, 0.85);
        }
        return;
      }

      // 3. 내 목소리 1:1 비교 청취
      const mineBtn = e.target.closest(".btn-mine-sample");
      if (mineBtn) {
        const qid = mineBtn.getAttribute("data-qid");
        getRecording(qid, blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
            showToast("🎧 녹음된 내 목소리를 재생합니다.");
          } else {
            showToast("녹음된 내 음성이 없습니다. [🎙️ 말하기]로 녹음한 후 비교해 보세요.");
          }
        });
        return;
      }

      // 4. 내 말하기 클리닉(복습 코너) 저장 버튼
      const saveBtn = e.target.closest(".btn-save-spk-clinic");
      if (saveBtn) {
        const qid = saveBtn.getAttribute("data-qid");
        const score = saveBtn.getAttribute("data-score") || 85;
        const targetQ = B.ai_talk.questions.find(x => x.id === qid);
        if (targetQ) {
          const clinicQid = "AI-SPK-" + targetQ.id;
          let clinic = window.YeonStorage ? window.YeonStorage.get("spk_clinic", []) : StorageUtil.get("spk_clinic", []);
          if (!Array.isArray(clinic)) clinic = [];
          const exists = clinic.find(c => c.qid === clinicQid);
          if (!exists) {
            clinic.unshift({
              type: `AI 말하기 (${targetQ.id})`,
              qid: clinicQid,
              question: `${targetQ.id}. ${targetQ.question_ko} (${targetQ.question_en})`,
              mistake: `내 발화 평가 (${score}점)`,
              correct: targetQ.model_answers[0],
              rx: `핵심어: ${targetQ.must_include ? targetQ.must_include.join(', ') : '원어민 모범 문장'}`,
              practice: targetQ.model_answers[0]
            });
            if (window.YeonStorage) window.YeonStorage.set("spk_clinic", clinic);
            StorageUtil.set("spk_clinic", clinic);
            if (window.updateYeonCounters) window.updateYeonCounters();
          }
          saveBtn.classList.add("saved");
          saveBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-2px;margin-right:4px"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg><span>✓ 내 말하기 클리닉에 저장됨</span>';
          showToast(`⭐ ${targetQ.id}번 말하기 평가 결과가 복습 코너에 쏙 담겼습니다!`);
        }
        return;
      }

      // 5. [답변 확인] 버튼 클릭 -> 정밀 성취도 평가 리포트 렌더링
      const btn = e.target.closest(".btn-submit-speech");
      if (!btn) return;
      const qid = btn.getAttribute("data-qid");
      const q = B.ai_talk.questions.find(x => x.id === qid);
      const inputEl = document.getElementById("input-" + qid);
      const fbBox = document.getElementById("feedback-" + qid);
      const rawText = inputEl.value.trim();

      if (!rawText) {
        showToast("답변을 입력하거나 말씀해 주세요.");
        return;
      }

      const res = evaluateSpeechAnswer(rawText, q);
      fbBox.style.display = "block";
      fbBox.className = "speech-feedback-box " + res.status;

      let html = `
        <div class="speech-eval-report">
          <!-- 1. 종합 점수 및 등급 헤더 -->
          <div class="spk-eval-top">
            <div>
              <div class="spk-eval-label">AI 말하기 정밀 성취도 평가</div>
              <div class="spk-score-val" style="color: ${res.gradeColor}">
                ${res.totalScore}<span class="spk-score-sub"> / 100점</span>
              </div>
            </div>
            <div class="spk-grade-pill" style="color:${res.gradeColor};background:${res.gradeBg};border-color:${res.gradeColor}">
              ${res.grade}
            </div>
          </div>

          <!-- 2. 3대 정밀 분석 레이더 바 -->
          <div class="spk-radar-box">
            <div class="spk-radar-row">
              <span class="spk-radar-label">🎯 발화 정확도</span>
              <div class="spk-bar-bg"><div class="spk-bar-fill" style="width:${res.accuracyPct}%;background:#0284c7"></div></div>
              <span class="spk-radar-num">${res.accuracyPct}%</span>
            </div>
            <div class="spk-radar-row">
              <span class="spk-radar-label">🗣️ 핵심어 완성도</span>
              <div class="spk-bar-bg"><div class="spk-bar-fill" style="width:${res.keywordCoveragePct}%;background:#16a34a"></div></div>
              <span class="spk-radar-num">${res.keywordCoveragePct}%</span>
            </div>
            <div class="spk-radar-row">
              <span class="spk-radar-label">⚡ 문장 구사력</span>
              <div class="spk-bar-bg"><div class="spk-bar-fill" style="width:${res.fluencyPct}%;background:#d97706"></div></div>
              <span class="spk-radar-num">${res.fluencyPct}%</span>
            </div>
          </div>

          <!-- 3. 단어별 정밀 대조 플로우 칩 -->
          <div class="spk-chips-box">
            <div class="spk-chips-header">
              <span class="spk-chips-title">단어별 발화 정밀 대조</span>
              <span class="spk-chips-sub">💡 단어 칩을 누르면 원어민 발음 재생</span>
            </div>
            <div class="spk-chips-flow">
              ${res.wordsAnalysis.map(w => {
                const mark = w.status === 'match' ? '✓' : (w.status === 'partial' ? '~' : '✕');
                const cleanW = w.word.replace(/[^a-zA-Z]/g, '');
                return `<button type="button" class="spk-chip ${w.status}" data-word="${escapeHtml(cleanW)}" title="${escapeHtml(w.word)} 원어민 발음 듣기">${escapeHtml(w.word)} <span class="chip-mark">${mark}</span></button>`;
              }).join('')}
            </div>
          </div>

          <!-- 4. 정밀 1:1 오류 클리닉 & 모범 답안 -->
          <div class="spk-prescription-box" style="border-left-color:${res.gradeColor}">
            <div class="spk-rx-header" style="color:${res.gradeColor}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
              <b>${escapeHtml(res.rxTitle)}</b>
            </div>
            <div class="spk-rx-body">${res.rxDesc}</div>
            ${res.matchedMistake ? `
              <div class="spk-mistake-compare">
                <div class="spk-wrong-line"><span class="badge-wrong">❌ 아쉬운 표현</span> <s>${escapeHtml(res.matchedMistake.wrong)}</s></div>
                <div class="spk-correct-line"><span class="badge-correct">⭕ 올바른 추천</span> <b>${escapeHtml(res.matchedMistake.correct)}</b></div>
              </div>
            ` : ''}
            <div class="spk-model-line">
              <span style="font-weight:700;color:#334155">모범 답안:</span> "${escapeHtml(res.bestModel)}"
            </div>
          </div>

          <!-- 5. 듀얼 오디오 1:1 비교 (모범 답안 ↔ 내 목소리) -->
          <div class="spk-audio-compare-row">
            <button type="button" class="btn-eval-audio btn-native-sample" data-en="${escapeHtml(res.bestModel)}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span>모범 답안 원어민 발음 듣기</span>
            </button>
            <button type="button" class="btn-eval-audio btn-mine-sample" data-qid="${q.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
              <span>내 목소리 다시 듣기</span>
            </button>
          </div>

          <!-- 6. 이어지는 꼬리 질문 (통과 시) -->
          ${res.followUp ? `
            <div class="spk-followup-box">
              <div style="font-size:12px;font-weight:800;color:var(--color-primary-dark);margin-bottom:3px">🤖 이어지는 질문 (Follow-up)</div>
              <div style="font-size:13.5px;color:#1e293b;display:flex;align-items:center;justify-content:space-between;gap:8px">
                <span>"${escapeHtml(res.followUp)}"</span>
                <button type="button" class="btn-q-speak" data-en="${escapeHtml(res.followUp)}" title="꼬리 질문 듣기" style="padding:4px 8px;font-size:12px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>
              </div>
            </div>
          ` : ''}

          <!-- 7. 복습 코너(말하기 클리닉) 저장 버튼 -->
          <div class="spk-save-row">
            <button type="button" class="btn-save-spk-clinic" data-qid="${q.id}" data-score="${res.totalScore}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              <span>🔖 내 말하기 클리닉(복습 코너)에 저장</span>
            </button>
          </div>
        </div>
      `;
      fbBox.innerHTML = html;

      // 기록 저장 (Stage 7 요약에 반영)
      const date = todayKey();
      const prevSpk = StorageUtil.get("spk_records_" + date, []);
      prevSpk.push({ qid: q.id, ok: res.status === "ok", wrong: res.wrongText, correct: res.correctText, score: res.totalScore });
      StorageUtil.set("spk_records_" + date, prevSpk);
      updateSummaryStage();
    });

    // 5-2 발음 클리닉
    const pronRoot = document.getElementById("pron-cards-root");
    pronRoot.innerHTML = "";
    B.ai_talk.pronunciation.forEach(item => {
      const card = document.createElement("div");
      card.className = "pron-card";
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="pron-word">${escapeHtml(item.word)}</span>
          <span class="pron-ipa">${escapeHtml(item.ipa)}</span>
        </div>
        <div class="pron-tip">${escapeHtml(item.tip_ko)}</div>
        <div style="display:flex;gap:6px;margin-top:6px">
          <button type="button" class="btn-secondary btn-pron-listen" data-word="${escapeHtml(item.word)}" style="flex:1;min-height:36px;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg><span>듣기 (0.7×)</span></button>
          ${isSpeechRecSupported ? `<button type="button" class="btn-primary btn-pron-rec" data-word="${escapeHtml(item.word)}" style="flex:1;min-height:36px;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>따라 말하기</span></button>` : ""}
        </div>
        <div class="pron-feedback" style="display:none;font-size:13px;padding:6px 8px;border-radius:4px;margin-top:4px"></div>
      `;
      pronRoot.appendChild(card);
    });

    pronRoot.addEventListener("click", e => {
      const listenBtn = e.target.closest(".btn-pron-listen");
      if (listenBtn) {
        speakEnglish(listenBtn.getAttribute("data-word"), 0.7);
      }

      const recBtn = e.target.closest(".btn-pron-rec");
      if (recBtn && isSpeechRecSupported) {
        const targetWord = recBtn.getAttribute("data-word").toLowerCase();
        const fb = recBtn.closest(".pron-card").querySelector(".pron-feedback");

        const sr = new SpeechRec();
        sr.lang = "en-US";
        sr.maxAlternatives = 1;
        recBtn.textContent = "듣는 중…";

        sr.onresult = ev => {
          const heard = (ev.results[0][0].transcript || "").trim().toLowerCase();
          const heardClean = heard.replace(/[^a-z]/g, "");
          const targetClean = targetWord.replace(/[^a-z]/g, "");
          fb.style.display = "block";

          let sim = calculateSimilarity(heardClean, targetClean);
          let score = Math.min(100, Math.round(sim * 100));
          if (heardClean === targetClean || heardClean.startsWith(targetClean) || targetClean.startsWith(heardClean)) {
            score = Math.max(score, 95);
          }

          if (score >= 80) {
            fb.style.background = "#dcfce7";
            fb.style.color = "#15803d";
            fb.innerHTML = `<b>${score}% 정밀 일치 ✓</b> 완벽한 미국 표준 발음이에요! (인식: "${heard}")`;
          } else if (score >= 60) {
            fb.style.background = "#fffbeb";
            fb.style.color = "#92400e";
            fb.innerHTML = `<b>${score}% 유사 (근접)</b> 거의 맞았어요! 조금 더 정확하게: "${heard}"`;
          } else {
            fb.style.background = "#fee2e2";
            fb.style.color = "#b91c1c";
            fb.innerHTML = `<b>${score}% (재시도 권장)</b> 들린 발음: "${heard}" → 원어민 발음을 다시 듣고 연습해 보세요`;
          }
        };

        const resetRecBtn = () => {
          recBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>따라 말하기</span>';
        };
        sr.onend = resetRecBtn;
        sr.onerror = resetRecBtn;
        sr.start();
      }
    });
  }

  // 유사도 계산 유틸 (Levenshtein Distance)
  function calculateSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    if (a === b) return 1.0;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const dist = matrix[b.length][a.length];
    return Math.max(0, 1 - dist / Math.max(a.length, b.length));
  }

  // 5-1 정밀 AI 말하기 다차원 평가 엔진
  function evaluateSpeechAnswer(rawInput, q) {
    let clean = rawInput.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ");
    clean = clean.replace(/\b27\b/g, "twenty-seven").replace(/\b1853\b/g, "eighteen fifty-three").replace(/\s+/g, " ").trim();
    const inputWords = clean.split(/\s+/).filter(Boolean);

    // 1. 최적 모범 답안 매칭 (모범 답안 중 가장 유사한 문장 선택)
    let bestModel = q.model_answers[0];
    let bestScore = -1;
    let bestModelClean = "";

    q.model_answers.forEach(m => {
      let mClean = m.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").replace(/\b27\b/g, "twenty-seven").replace(/\s+/g, " ").trim();
      let mWords = mClean.split(/\s+/).filter(Boolean);
      let matchCount = 0;
      mWords.forEach(w => { if (inputWords.includes(w)) matchCount++; });
      let sim = matchCount / Math.max(mWords.length, 1);
      if (sim > bestScore) {
        bestScore = sim;
        bestModel = m;
        bestModelClean = mClean;
      }
    });

    const modelWordsRaw = bestModel.split(/\s+/);
    const modelWordsClean = bestModelClean.split(/\s+/);

    // 2. 단어별 정밀 대조 (Word-by-word comparison for chips)
    let matchedWordCount = 0;
    let partialWordCount = 0;
    const wordsAnalysis = [];

    modelWordsClean.forEach((mw, idx) => {
      const rawWord = modelWordsRaw[idx] || mw;
      const cleanWord = mw.replace(/[^a-z0-9\-]/g, "");
      if (!cleanWord) {
        wordsAnalysis.push({ word: rawWord, status: "match" });
        return;
      }
      if (inputWords.includes(cleanWord)) {
        matchedWordCount++;
        wordsAnalysis.push({ word: rawWord, status: "match" });
      } else {
        const isPart = inputWords.some(iw => {
          if (iw.length >= 3 && cleanWord.length >= 3) {
            return iw.startsWith(cleanWord.slice(0, 3)) || cleanWord.startsWith(iw.slice(0, 3));
          }
          return false;
        });
        if (isPart) {
          partialWordCount++;
          wordsAnalysis.push({ word: rawWord, status: "partial" });
        } else {
          wordsAnalysis.push({ word: rawWord, status: "miss" });
        }
      }
    });

    // 3. 3대 정밀 지표 산출
    // 지표 1: 🎯 발화 정확도 (Accuracy %, 0~100)
    const validModelLen = Math.max(modelWordsClean.filter(Boolean).length, 1);
    let accuracyPct = Math.round(((matchedWordCount * 1.0 + partialWordCount * 0.5) / validModelLen) * 100);
    if (accuracyPct > 100) accuracyPct = 100;

    // 지표 2: 🗣️ 핵심 어휘 완성도 (Keyword Coverage %, 0~100)
    const mustWords = q.must_include || [];
    const missing = mustWords.filter(mw => {
      const target = mw.toLowerCase().replace(/-/g, " ");
      return !clean.includes(target) && !clean.includes(mw.toLowerCase());
    });
    const foundKeywordsCount = mustWords.length - missing.length;
    const keywordCoveragePct = mustWords.length > 0 ? Math.round((foundKeywordsCount / mustWords.length) * 100) : 100;

    // 지표 3: ⚡ 문장 구사력 & 유창성 (Fluency %, 0~100)
    let fluencyPct = 70;
    const wordCount = inputWords.length;
    if (wordCount >= Math.min(modelWordsClean.length * 0.7, 5)) {
      fluencyPct = 95;
    } else if (wordCount >= 3) {
      fluencyPct = 80;
    } else if (wordCount >= 1) {
      fluencyPct = 60;
    }

    // 4. 공통 실수 정밀 진단 (오답 구문 정밀 매칭 및 교정어 감지)
    let matchedMistake = null;
    if (q.common_mistakes) {
      for (const m of q.common_mistakes) {
        const wrongClean = m.wrong.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim();
        const correctClean = m.correct.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim();

        // 1) 학생 답변이 이미 올바른 교정 문구(correctClean)를 포함하고 있다면 오답이 아님!
        if (clean.includes(correctClean)) {
          continue;
        }

        // 2) correctClean에만 존재하는 핵심 교정 단어 (예: 'to', 'was', 'sunflowers' 등)
        const wrongWords = wrongClean.split(/\s+/).filter(Boolean);
        const correctWords = correctClean.split(/\s+/).filter(Boolean);
        const diffWords = correctWords.filter(cw => !wrongWords.includes(cw));
        const hasDiffWord = diffWords.length > 0 && diffWords.every(dw => inputWords.includes(dw));

        // 이미 핵심 교정 단어를 올바르게 구사했다면 실수로 판정하지 않음
        if (hasDiffWord) {
          continue;
        }

        // 3) 오답 표현(wrongClean)을 통째로 포함하거나, 오답 단어들이 집중 포함된 경우
        if (clean.includes(wrongClean)) {
          matchedMistake = m;
          break;
        }

        let overlap = 0;
        wrongWords.forEach(w => { if (inputWords.includes(w)) overlap++; });
        if (overlap / Math.max(wrongWords.length, 1) >= 0.80) {
          matchedMistake = m;
          break;
        }
      }
    }

    // 5. 종합 점수 및 등급 산출
    let totalScore = Math.round(accuracyPct * 0.45 + keywordCoveragePct * 0.35 + fluencyPct * 0.20);
    if (matchedMistake) {
      if (totalScore > 75) totalScore = 75;
    }
    if (missing.length > 0) {
      if (totalScore > 65) totalScore = 65;
    }
    if (totalScore < 30 && inputWords.length > 0) {
      totalScore = 45;
    }

    let grade = "S등급 (PERFECT)";
    let gradeColor = "#16a34a";
    let gradeBg = "#f0fdf4";
    let status = "ok";
    let rxTitle = "원어민급 완전 정복!";
    let rxDesc = "문장의 완성도와 발음/어휘가 완벽합니다. 자연스러운 원어민 억양으로 훌륭히 답변하셨어요!";

    if (matchedMistake) {
      status = "fix";
      grade = "B등급 (CLINIC)";
      gradeColor = "#d97706";
      gradeBg = "#fffbeb";
      rxTitle = "1:1 원어민 맞춤 처방";
      rxDesc = matchedMistake.why_ko;
    } else if (missing.length > 0) {
      status = "retry";
      grade = "C등급 (RETRY)";
      gradeColor = "#dc2626";
      gradeBg = "#fef2f2";
      rxTitle = "핵심 어휘 보완 권장";
      rxDesc = `다음 핵심 단어가 답변에 빠졌어요: <b>${missing.join(", ")}</b>. 이 단어를 포함하여 다시 한번 소리 내어 말해 보세요!`;
    } else if (totalScore >= 90) {
      grade = "S등급 (PERFECT)";
      gradeColor = "#16a34a";
      gradeBg = "#f0fdf4";
      status = "ok";
      rxTitle = "원어민급 완전 정복!";
      rxDesc = "문장의 완성도와 발음/어휘가 완벽합니다. 자연스러운 원어민 억양으로 훌륭히 답변하셨어요!";
    } else if (totalScore >= 80) {
      grade = "A등급 (EXCELLENT)";
      gradeColor = "#2563eb";
      gradeBg = "#eff6ff";
      status = "ok";
      rxTitle = "아주 훌륭한 답변!";
      rxDesc = "질문의 의도에 정확히 부합하며, 핵심 의미를 영어로 유창하게 잘 표현했습니다.";
    } else {
      grade = "B등급 (GOOD)";
      gradeColor = "#d97706";
      gradeBg = "#fffbeb";
      status = "fix";
      rxTitle = "기본 의미 전달 완료!";
      rxDesc = "단어 의미는 통했으나, 주어와 동사를 갖춘 온전한 한 문장으로 말하면 더욱 완벽해집니다.";
    }

    return {
      status,
      totalScore,
      grade,
      gradeColor,
      gradeBg,
      accuracyPct,
      keywordCoveragePct,
      fluencyPct,
      wordsAnalysis,
      bestModel,
      matchedMistake,
      missing,
      rxTitle,
      rxDesc,
      followUp: q.follow_up_en,
      rawInput,
      wrongText: matchedMistake ? matchedMistake.wrong : null,
      correctText: matchedMistake ? matchedMistake.correct : null
    };
  }

  /* ── 6. 테스트 단계 ── */
  let testAnswers = {};
  let testSeconds = 0;
  let testTimerInterval = null;

  function initStageTest() {
    const qRoot = document.getElementById("test-questions-root");
    const bannerRoot = document.getElementById("test-banner-root");
    const submitBtn = document.getElementById("btn-submit-test");
    const retryBtn = document.getElementById("btn-retry-wrong");

    // 시험 타이머 시작
    if (!testTimerInterval) {
      testSeconds = 0;
      testTimerInterval = setInterval(() => { testSeconds++; }, 1000);
    }

    function renderTest() {
      qRoot.innerHTML = "";
      bannerRoot.innerHTML = "";

      B.test.forEach(item => {
        const card = document.createElement("div");
        card.className = "test-q-card";
        card.id = "test-q-" + item.no;

        const badgeClass = item.type === "vocab" ? "vocab" : (item.type === "reading" ? "reading" : "dialogue");
        const badgeName = item.type === "vocab" ? "단어" : (item.type === "reading" ? "본문 읽기" : "대화문");

        let html = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <b style="color:var(--color-primary-dark);font-size:16px">${item.no}번 문항</b>
            <span class="test-badge ${badgeClass}">${badgeName}</span>
          </div>
          <div style="font-size:15.5px;font-weight:600;margin-bottom:12px;white-space:pre-line">${escapeHtml(item.q)}</div>
          <div class="choices-list">
        `;

        item.choices.forEach((ch, chIdx) => {
          const isSelected = testAnswers[item.no] === chIdx;
          html += `<button type="button" class="choice-btn ${isSelected ? 'selected' : ''}" data-qno="${item.no}" data-ch="${chIdx}" style="${isSelected ? 'border-color:var(--color-primary);background:#f0fdfa' : ''}">
            ${chIdx + 1}. ${escapeHtml(ch)}
          </button>`;
        });

        html += `</div><div class="choice-why" style="display:none" id="test-why-${item.no}"><b>해설:</b> ${escapeHtml(item.why)}</div>`;
        card.innerHTML = html;
        qRoot.appendChild(card);
      });
    }

    qRoot.addEventListener("click", e => {
      const btn = e.target.closest(".choice-btn");
      if (!btn) return;
      const qno = +btn.getAttribute("data-qno");
      const ch = +btn.getAttribute("data-ch");
      testAnswers[qno] = ch;

      const card = document.getElementById("test-q-" + qno);
      card.querySelectorAll(".choice-btn").forEach(b => {
        b.style.borderColor = "";
        b.style.background = "";
      });
      btn.style.borderColor = "var(--color-primary)";
      btn.style.background = "#f0fdfa";
    });

    submitBtn.addEventListener("click", () => {
      const total = B.test.length;
      let score = 0;
      let typeScores = { vocab: 0, reading: 0, dialogue: 0 };
      let typeTotals = { vocab: 0, reading: 0, dialogue: 0 };
      let wrongList = [];

      B.test.forEach(item => {
        typeTotals[item.type]++;
        const userAns = testAnswers[item.no];
        const isCorrect = userAns === item.answer;
        if (isCorrect) {
          score++;
          typeScores[item.type]++;
        } else {
          wrongList.push(item.no);
        }

        const card = document.getElementById("test-q-" + item.no);
        if (card) {
          card.querySelectorAll(".choice-btn").forEach(b => {
            b.disabled = true;
            const bIdx = +b.getAttribute("data-ch");
            if (bIdx === item.answer) b.classList.add("correct");
            else if (bIdx === userAns) b.classList.add("wrong");
          });
          const whyEl = document.getElementById("test-why-" + item.no);
          if (whyEl) whyEl.style.display = "block";
        }
      });

      // 점수 배너 렌더링
      bannerRoot.innerHTML = `
        <div class="test-score-banner">
          <div style="font-size:15px;color:var(--color-text-sub);margin-bottom:4px">최종 채점 결과</div>
          <div class="score-num">${score} / ${total}점</div>
          <div style="font-size:14px;color:#334155;margin-top:8px">
            단어: ${typeScores.vocab}/${typeTotals.vocab} · 읽기: ${typeScores.reading}/${typeTotals.reading} · 대화: ${typeScores.dialogue}/${typeTotals.dialogue}
          </div>
        </div>
      `;

      submitBtn.style.display = "none";
      if (wrongList.length > 0) {
        retryBtn.style.display = "block";
        retryBtn.onclick = () => {
          wrongList.forEach(wno => {
            delete testAnswers[wno];
            const card = document.getElementById("test-q-" + wno);
            if (card) {
              card.querySelectorAll(".choice-btn").forEach(b => {
                b.disabled = false;
                b.classList.remove("correct", "wrong");
                b.style.borderColor = "";
                b.style.background = "";
              });
              const whyEl = document.getElementById("test-why-" + wno);
              if (whyEl) whyEl.style.display = "none";
            }
          });
          submitBtn.style.display = "block";
          retryBtn.style.display = "none";
          bannerRoot.innerHTML = "";
          showToast("틀린 문항을 다시 풀어보세요!");
        };
      }

      // 서버 student_results 기록
      if (window.YK && typeof window.YK.saveResult === "function") {
        window.YK.saveResult({
          title: "영어 예술가 교재 1 · 빈센트 반 고흐",
          pid: "eng-gogh-m2",
          sc: score,
          mx: total,
          sec: testSeconds,
          items: B.test.map(t => ({
            i: String(t.no),
            k: t.type === "vocab" ? 1 : (t.type === "reading" ? 2 : 3),
            r: testAnswers[t.no] === t.answer ? 1 : 0,
            a: t.choices[testAnswers[t.no]] || "",
            q: t.q
          }))
        }).catch(err => console.warn("시험 결과 서버 저장 대기:", err));
      }

      // 로컬 통계 저장
      const date = todayKey();
      StorageUtil.set("test_result_" + date, {
        score: score,
        total: total,
        typeScores: typeScores,
        wrongList: wrongList
      });

      updateSummaryStage();
      showToast(`채점 완료: ${score}점입니다.`);
    });

    renderTest();
  }

  /* ── 7. 오늘의 요약 단계 ── */
  function updateSummaryStage() {
    const metricsList = document.getElementById("summary-metrics-list");
    const shareTextBox = document.getElementById("parent-share-text");
    if (!metricsList || !shareTextBox) return;

    const date = todayKey();
    const readCount = StorageUtil.get("read_count_" + date, 0);
    const readSec = StorageUtil.get("read_sec_" + date, 0);
    const rM = Math.floor(readSec / 60);
    const rS = readSec % 60;

    const listenedP = StorageUtil.get("listened_p_" + date, 0);
    const maxSpeed = StorageUtil.get("max_speed_" + date, 0.85);

    const spkRecords = StorageUtil.get("spk_records_" + date, []);
    const spkCount = spkRecords.length;
    const spkOkCount = spkRecords.filter(x => x.ok).length;
    const corrections = spkRecords.filter(x => x.wrong && x.correct).slice(0, 3);

    const testRes = StorageUtil.get("test_result_" + date, null);
    const testScore = testRes ? testRes.score : 0;
    const testTotal = testRes ? testRes.total : 10;
    const wrongList = testRes ? testRes.wrongList : [];

    // 한 줄 피드백
    let feedback = "";
    if (testScore >= 9) feedback = "오늘 아주 잘했어요!";
    else if (testScore >= 7) feedback = "꾸준히 하면 더 좋아져요.";
    else if (testScore > 0) feedback = "틀린 부분을 한 번 더 복습해요.";
    else feedback = "테스트를 풀어 실력을 확인해 보세요.";
    if (spkCount === 0) feedback += " 말하기도 한 번 해 볼까요?";

    // 잘한 점 & 더 연습할 점
    let goodPoint = "성실하게 본문과 단어를 학습했습니다.";
    if (testScore >= 8) goodPoint = "단어와 본문 내용 이해도가 매우 높습니다.";
    else if (spkOkCount >= 3) goodPoint = "AI 말하기 답변을 주저 없이 영어로 잘 표현했습니다.";

    let practicePoint = "특별히 없어요 (완벽해요!)";
    if (wrongList.length > 0) {
      practicePoint = `${wrongList.join(", ")}번 문항 오답을 다시 확인해 보세요.`;
    }

    // 학생 이름 (공용 부품 연동, 전화번호/비번 일체 제외)
    const studentName = (window.YK && typeof window.YK.name === "function" && window.YK.name()) || "학생";

    const myVocabCount = Wordbook.getAll().length;

    metricsList.innerHTML = `
      <li><b>1. 읽기:</b> 오늘 ${readCount}회 완독 (${rM}분 ${rS}초 소요)${myVocabCount > 0 ? ` · ⭐ 내 단어장 ${myVocabCount}개 저장` : ""}</li>
      <li><b>2. 듣기:</b> ${listenedP}개 문단 청취 (최대 속도: ${maxSpeed}×)</li>
      <li><b>3. 말하기:</b> ${spkCount}문장 시도 중 ${spkOkCount}문장 내용 OK ${corrections.length > 0 ? `(교정: ${corrections.map(c => `"${c.wrong} → ${c.correct}"`).join(", ")})` : ""}</li>
      <li><b>4. 테스트:</b> ${testRes ? `${testScore}/${testTotal}점 (오답: ${wrongList.length > 0 ? wrongList.join(", ") + "번" : "없음"})` : "미응시"}</li>
      <li><b>5. 칭찬 피드백:</b> ${escapeHtml(feedback)}</li>
    `;

    // 학부모님께 보낼 글 양식
    const cardText = `[영어 예술가 교재 1 · 빈센트 반 고흐]
${studentName} 학생(중2)의 오늘 학습이에요.
· 읽기 ${readCount}회 (${rM}분 ${rS}초) · 듣기 ${listenedP}문단
· 말하기 ${spkCount}문장 중 ${spkOkCount}문장 내용 OK
· 단어·읽기·대화 테스트 : ${testScore}/10점
· 잘한 점 : ${goodPoint}
· 더 연습할 점 : ${practicePoint}`;

    shareTextBox.textContent = cardText;

    // 카톡 공유 단추
    const shareBtn = document.getElementById("btn-share-kakaotalk");
    const copyBtn = document.getElementById("btn-copy-card");

    shareBtn.onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: "영어 예술가 교재 1 학습 요약",
          text: cardText
        }).catch(() => {
          copyCardToClipboard(cardText);
        });
      } else {
        copyCardToClipboard(cardText);
      }
    };

    copyBtn.onclick = () => {
      copyCardToClipboard(cardText);
    };
  }

  function copyCardToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("복사했어요 — 카톡에 붙여넣으세요");
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("복사했어요 — 카톡에 붙여넣으세요");
    } catch (e) {
      showToast("복사에 실패했습니다. 글을 직접 드래그하여 복사해 주세요.");
    }
    document.body.removeChild(ta);
  }

  /* ── 8. 인쇄 2모드 («원본 인쇄» & «절약 인쇄») ── */
  window.ecoPrint = function () {
    document.body.classList.add("eco-print");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("eco-print");
    }, 800);
  };

  /* ── 9. HTML 이스케이프 유틸 ── */
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ── 초기화 실행 ── */
  document.addEventListener("DOMContentLoaded", () => {
    initStageRead();
    initStageGrammar();
    initStageListen();
    initStageDialogue();
    initStageSpeech();
    initStageTest();
    updateSummaryStage();
  });

})();
