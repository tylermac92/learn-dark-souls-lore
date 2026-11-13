// Reusable quiz component. Usage in a lesson:
//   <section class="quiz"><script type="application/json">[ ...questions ]</script></section>
//   <script src="../assets/quiz.js"></script>
// Question shapes:
//   { "type": "choice", "q": "...", "options": ["...", ...], "answer": 0, "why": "..." }   answer = index in options
//   { "type": "order",  "q": "...", "items": ["first", "second", ...], "why": "..." }     items in correct order
//   { "type": "recall", "q": "...", "answer": "<p>model answer html</p>" }               self-graded
//   { "type": "multi",  "q": "...", "options": ["...", ...], "answers": [0, 2], "why": "..." }  select all that apply; all-or-nothing
// Options and items are shuffled on render, so position never gives the answer away.
(function () {
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function choice(q, card, done) {
    const opts = shuffle(q.options.map((text, i) => ({ text, i })));
    const list = el("div", "q-options");
    opts.forEach(({ text, i }) => {
      const b = el("button", "q-opt"); b.type = "button"; b.textContent = text;
      b.onclick = () => {
        const right = i === q.answer;
        list.querySelectorAll("button").forEach((x) => (x.disabled = true));
        b.classList.add(right ? "is-right" : "is-wrong");
        if (!right) list.children[opts.findIndex((o) => o.i === q.answer)].classList.add("is-right");
        done(right, q.why);
      };
      list.append(b);
    });
    card.append(list);
  }

  function order(q, card, done) {
    const picked = [];
    const pool = el("div", "q-options");
    const seq = el("ol", "q-seq");
    shuffle(q.items).forEach((text) => {
      const b = el("button", "q-opt"); b.type = "button"; b.textContent = text;
      b.onclick = () => {
        b.disabled = true; picked.push(text);
        seq.append(el("li", null, "")); seq.lastChild.textContent = text;
        if (picked.length === q.items.length) {
          const right = picked.every((t, i) => t === q.items[i]);
          [...seq.children].forEach((li, i) => li.classList.add(picked[i] === q.items[i] ? "is-right" : "is-wrong"));
          const fix = right ? "" : "<p><strong>Correct order:</strong></p><ol>" + q.items.map((t) => "<li>" + t + "</li>").join("") + "</ol>";
          done(right, fix + (q.why || ""));
        }
      };
      pool.append(b);
    });
    card.append(el("p", "q-hint", "Tap the events in the order they happened."), pool, seq);
  }

  function recall(q, card, done) {
    const id = "recall-" + Math.random().toString(36).slice(2, 8);
    const label = el("label", "q-hint", "Write it from memory first. Then reveal and mark yourself honestly."); label.htmlFor = id;
    const ta = el("textarea"); ta.id = id; ta.rows = 4;
    const reveal = el("button", "q-btn", "Reveal answer"); reveal.type = "button";
    reveal.onclick = () => {
      reveal.remove();
      const ans = el("div", "q-answer", q.answer);
      const yes = el("button", "q-btn", "I got the gist"); yes.type = "button";
      const no = el("button", "q-btn", "I missed parts"); no.type = "button";
      const row = el("div", "q-row"); row.append(yes, no);
      const finish = (r) => { row.remove(); done(r, ""); };
      yes.onclick = () => finish(true); no.onclick = () => finish(false);
      card.append(ans, row);
    };
    card.append(label, ta, reveal);
  }

  function multi(q, card, done) {
    const opts = shuffle(q.options.map((text, i) => ({ text, i })));
    const list = el("div", "q-options");
    const btns = opts.map(({ text }) => {
      const b = el("button", "q-opt"); b.type = "button"; b.textContent = text; b.setAttribute("aria-pressed", "false");
      b.onclick = () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
      list.append(b); return b;
    });
    const check = el("button", "q-btn", "Check"); check.type = "button";
    check.onclick = () => {
      check.remove();
      let right = true;
      btns.forEach((b, k) => {
        const should = q.answers.includes(opts[k].i), chose = b.getAttribute("aria-pressed") === "true";
        b.disabled = true;
        if (should) b.classList.add("is-right"); else if (chose) b.classList.add("is-wrong");
        if (should !== chose) right = false;
      });
      done(right, q.why);
    };
    card.append(el("p", "q-hint", "Select every option that applies, then check. Any miss or extra counts as wrong."), list, check);
  }

  const kinds = { choice, order, recall, multi };

  document.querySelectorAll("section.quiz").forEach((root) => {
    const qs = JSON.parse(root.querySelector('script[type="application/json"]').textContent);
    let answered = 0, right = 0;
    const score = el("p", "q-score");
    qs.forEach((q, n) => {
      const card = el("div", "q-card");
      card.append(el("p", "q-num eyebrow", "Question " + (n + 1) + " of " + qs.length), el("p", "q-text", q.q));
      kinds[q.type](q, card, (ok, why) => {
        answered++; if (ok) right++;
        const fb = el("div", "q-feedback " + (ok ? "is-right" : "is-wrong"), "<p><strong>" + (ok ? "Correct." : "Not quite.") + "</strong></p>" + (why || ""));
        card.append(fb);
        score.textContent = answered === qs.length ? "Score: " + right + " / " + qs.length + ". Missed ones come back in the next lesson's warm-up." : "";
      });
      root.append(card);
    });
    root.append(score);
  });
})();
