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
        const v = localStorage.getItem("eng-gogh/" + key);
        return v === null ? def : JSON.parse(v);
      } catch (e) {
        return def;
      }
    },
    set(key, val) {
      try {
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
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => { t.style.display = "none"; }, 300);
    }, 2200);
  }

  /* ── 0. 음성 합성 (speechSynthesis) 유틸 ── */
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
    utt.pitch = pitch;
    if (onEndCallback) {
      utt.onend = onEndCallback;
      utt.onerror = onEndCallback;
    }
    window.speechSynthesis.speak(utt);
  }

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

    // 어휘 26개 표 렌더링
    vocabBody.innerHTML = "";
    B.vocab.forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b style="color:var(--color-primary-dark)">${escapeHtml(v.en)}</b></td>
        <td><span style="color:var(--color-text-sub)">${escapeHtml(v.pos)}</span></td>
        <td>${escapeHtml(v.ko)}</td>
        <td><button type="button" class="btn-vocab-listen" data-en="${escapeHtml(v.en)}" title="발음 듣기"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></button></td>
      `;
      vocabBody.appendChild(tr);
    });

    vocabBody.addEventListener("click", e => {
      const btn = e.target.closest(".btn-vocab-listen");
      if (btn) {
        const en = btn.getAttribute("data-en");
        speakEnglish(en, 0.85);
      }
    });
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

    modal.style.display = "flex";
  }

  document.getElementById("btn-modal-close").addEventListener("click", () => {
    document.getElementById("word-modal").style.display = "none";
  });

  /* ── 2. 문법 단계 ── */
  function initStageGrammar() {
    const root = document.getElementById("grammar-cards-root");
    root.innerHTML = "";

    B.grammar.forEach(g => {
      const card = document.createElement("div");
      card.className = "grammar-card";
      card.id = "grammar-g-" + g.no;

      let html = `<h3>${g.no}. ${escapeHtml(g.name_ko)}</h3>
      <div class="grammar-rule">${escapeHtml(g.rule_ko)}</div>`;

      // 본문 예문
      html += `<div class="grammar-examples"><b>본문 속 예문:</b><ul style="margin:4px 0 0 18px">`;
      g.examples.forEach(sid => {
        const sentence = findSentenceById(sid);
        if (sentence) {
          html += `<li style="margin-bottom:4px"><em>"${highlightGrammarExample(sentence.en, g.no)}"</em><br><small style="color:#64748b">${sentence.ko}</small></li>`;
        }
      });
      html += `</ul></div>`;

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

    // 선택지 클릭 이벤트
    root.addEventListener("click", e => {
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

  function highlightGrammarExample(text, gno) {
    if (gno === 1) return text.replace(/\b(was born|worked|moved|stayed|watched|started|passed away|sold|loved)\b/gi, "<b>$1</b>");
    if (gno === 2) return text.replace(/\b(decided to become|wanted to support|started drawing|hope to see)\b/gi, "<b>$1</b>");
    if (gno === 3) return text.replace(/\b(enjoyed walking|loved looking at|loved painting|drawing spinning)\b/gi, "<b>$1</b>");
    if (gno === 4) return text.replace(/\b(was supported|were painted|was created)\b/gi, "<b>$1</b>");
    if (gno === 5) return text.replace(/\b(have visited|have loved|has touched)\b/gi, "<b>$1</b>");
    return text;
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
      qRoot.addEventListener("click", async e => {
        const btn = e.target.closest(".btn-mic");
        if (!btn) return;
        const qid = btn.getAttribute("data-qid");
        const inputEl = document.getElementById("input-" + qid);

        if (btn.classList.contains("recording")) {
          // 중지
          if (speechRecognition) speechRecognition.stop();
          if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
          btn.classList.remove("recording");
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:3px"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>말하기</span>';
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = ev => {
            if (ev.data.size > 0) audioChunks.push(ev.data);
          };
          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            saveRecording(qid, audioBlob);
            const playVoiceBtn = document.querySelector(`.btn-play-myvoice[data-qid="${qid}"]`);
            if (playVoiceBtn) playVoiceBtn.style.display = "inline-flex";
            stream.getTracks().forEach(t => t.stop());
          };
          mediaRecorder.start();
        } catch (err) {
          console.warn("MediaRecorder 마이크 접근 불가 (글 입력으로 계속):", err);
        }

        speechRecognition = new SpeechRec();
        speechRecognition.lang = "en-US";
        speechRecognition.interimResults = false;
        speechRecognition.maxAlternatives = 1;

        btn.classList.add("recording");
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-2px;margin-right:3px"><rect x="4" y="4" width="16" height="16" rx="2"/></svg><span>듣는 중…</span>';
        inputEl.placeholder = "말씀을 듣고 있어요…";

        speechRecognition.onresult = ev => {
          const transcript = ev.results[0][0].transcript;
          inputEl.value = transcript;
        };

        speechRecognition.onend = () => {
          btn.classList.remove("recording");
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:3px"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>말하기</span>';
          if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
        };

        speechRecognition.onerror = () => {
          btn.classList.remove("recording");
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:3px"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span>말하기</span>';
          if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
        };

        speechRecognition.start();
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

      const evalResult = evaluateSpeechAnswer(rawText, q);
      fbBox.style.display = "block";
      fbBox.className = "speech-feedback-box " + evalResult.status;

      let html = `<div>${evalResult.msg}</div>`;
      if (evalResult.followUp) {
        html += `<div style="margin-top:6px;font-size:13.5px;color:var(--color-primary-dark)"><b>이어지는 질문:</b> "${escapeHtml(evalResult.followUp)}"</div>`;
      }
      if (evalResult.modelAnswer) {
        html += `<div style="margin-top:6px;font-size:13.5px;color:#475569"><b>모범 답안:</b> "${escapeHtml(evalResult.modelAnswer)}"</div>`;
      }
      fbBox.innerHTML = html;

      // 기록 저장 (Stage 7 요약에 반영)
      const date = todayKey();
      const prevSpk = StorageUtil.get("spk_records_" + date, []);
      prevSpk.push({ qid: q.id, ok: evalResult.status === "ok", wrong: evalResult.wrongText, correct: evalResult.correctText });
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
          const heard = (ev.results[0][0].transcript || "").trim().toLowerCase().replace(/[^a-z]/g, "");
          fb.style.display = "block";
          if (heard === targetWord || heard.startsWith(targetWord) || targetWord.startsWith(heard)) {
            fb.style.background = "#dcfce7";
            fb.style.color = "#15803d";
            fb.textContent = "잘 알아들었어요 ✓";
          } else {
            fb.style.background = "#fee2e2";
            fb.style.color = "#b91c1c";
            fb.textContent = `다시 한 번 — 내가 들은 말은 "${heard}" 였어요`;
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

  // 5-1 평가 로직 함수
  function evaluateSpeechAnswer(rawInput, q) {
    let clean = rawInput.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ");
    clean = clean.replace(/\b27\b/g, "twenty-seven").replace(/\s+/g, " ").trim();

    // 필수 단어 검사
    const mustWords = q.must_include || [];
    const missing = mustWords.filter(mw => !clean.includes(mw.toLowerCase().replace(/-/g, " ")) && !clean.includes(mw.toLowerCase()));

    // 공통 실수 유사도 검사
    let matchedMistake = null;
    if (q.common_mistakes) {
      for (const m of q.common_mistakes) {
        const wrongWords = m.wrong.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
        const cleanWords = clean.split(/\s+/);
        let overlap = 0;
        wrongWords.forEach(w => { if (cleanWords.includes(w)) overlap++; });
        if (overlap / Math.max(wrongWords.length, 1) >= 0.75) {
          matchedMistake = m;
          break;
        }
      }
    }

    if (matchedMistake) {
      return {
        status: "fix",
        msg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg><b>이렇게 고쳐 말해 볼까요?</b><br>"${escapeHtml(matchedMistake.correct)}"<br><small>${escapeHtml(matchedMistake.why_ko)}</small>`,
        modelAnswer: q.model_answers[0],
        wrongText: matchedMistake.wrong,
        correctText: matchedMistake.correct
      };
    }

    if (missing.length === 0) {
      const praise = B.ai_talk.praise_en[Math.floor(Math.random() * B.ai_talk.praise_en.length)];
      return {
        status: "ok",
        msg: `<b>${praise}</b> 내용이 완벽해요!`,
        followUp: q.follow_up_en,
        modelAnswer: q.model_answers[0]
      };
    } else {
      return {
        status: "retry",
        msg: `다시 말해 볼래요? 꼭 들어가야 할 내용이 조금 빠졌어요.`,
        modelAnswer: q.model_answers[0]
      };
    }
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

    metricsList.innerHTML = `
      <li><b>1. 읽기:</b> 오늘 ${readCount}회 완독 (${rM}분 ${rS}초 소요)</li>
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
