/**
 * emailTemplates.js
 * HTML email templates for the PedBoards QE automated email sequence.
 * Each function returns a { subject, html, bcc } object ready for sending.
 *
 * Stats shape: { questionsThisWeek, accuracyPct, strongestTopic, weakestTopic, weakestAccuracy, totalQuestions, overallAccuracy }
 */

const EXAM_DATE = new Date('2026-05-04T00:00:00');
const APP_URL = 'https://pedsdentqe.com';
const SUPPORT_EMAIL = 'support@pedsdentqe.com';
const SIGN_OFF = 'The PedBoards QE Team';

export function daysUntilExam() {
  const today = new Date();
  const diff = Math.ceil((EXAM_DATE - today) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function progressBar(pct) {
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${pct}%`;
}

function baseWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
<tr><td style="background:#1a365d;padding:24px 32px;text-align:center">
  <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px">PedBoards QE</span>
</td></tr>
<tr><td style="padding:32px">
${content}
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;text-align:center;color:#718096;font-size:13px">
  ${SIGN_OFF}<br>
  <a href="mailto:${SUPPORT_EMAIL}" style="color:#718096">${SUPPORT_EMAIL}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(text, url = APP_URL) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td align="center">
<a href="${url}" style="display:inline-block;background:#2b6cb0;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px">${text}</a>
</td></tr></table>`;
}

// ── Email #3 — Day 7: Weekly Check-in ──────────────────────────────────────

export function buildWeeklyCheckinEmail(stats, days) {
  const subject = `Your week in review + ${days} days until Part 1 🦷`;
  const html = baseWrapper(`
<h2 style="color:#1a365d;margin:0 0 8px">Your Week in Review</h2>
<p style="font-size:18px;color:#e53e3e;font-weight:700;margin:0 0 24px">
  ${days} days until ABPD Part 1 — May 4, 2026
</p>

<table width="100%" cellpadding="12" cellspacing="0" style="background:#f7fafc;border-radius:6px;margin-bottom:20px">
<tr><td style="font-size:14px;color:#4a5568">
  <strong>Progress:</strong> <code style="font-size:15px;letter-spacing:1px">${progressBar(stats.overallAccuracy)}</code>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
<tr>
  <td width="50%" style="padding:12px;background:#ebf8ff;border-radius:6px 0 0 6px;text-align:center">
    <div style="font-size:28px;font-weight:700;color:#2b6cb0">${stats.questionsThisWeek}</div>
    <div style="font-size:13px;color:#4a5568">Questions This Week</div>
  </td>
  <td width="50%" style="padding:12px;background:#ebf4ff;border-radius:0 6px 6px 0;text-align:center">
    <div style="font-size:28px;font-weight:700;color:#2b6cb0">${stats.accuracyPct}%</div>
    <div style="font-size:13px;color:#4a5568">Accuracy</div>
  </td>
</tr>
</table>

<table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom:20px">
<tr>
  <td style="background:#f0fff4;border-radius:4px;padding:10px 14px">
    <span style="color:#276749;font-weight:600">💪 Strongest:</span> ${stats.strongestTopic}
  </td>
</tr>
<tr><td style="height:6px"></td></tr>
<tr>
  <td style="background:#fff5f5;border-radius:4px;padding:10px 14px">
    <span style="color:#c53030;font-weight:600">🎯 Focus area:</span> ${stats.weakestTopic} (${stats.weakestAccuracy}%)
  </td>
</tr>
</table>

<p style="color:#4a5568;line-height:1.6">
  You answered <strong>${stats.questionsThisWeek} questions</strong> this week.
  Your weakest area is <strong>${stats.weakestTopic} (${stats.weakestAccuracy}%)</strong>
  — we have queued up more of those for your next session.
</p>

${ctaButton('Keep your streak going →')}
  `);

  return { subject, html, bcc: SUPPORT_EMAIL };
}

// ── Email #4 — Day 14: Study Plan Push ─────────────────────────────────────

export function buildStudyPlanEmail(stats, days) {
  const subject = `${days} days to go — your personalized study plan`;

  const weeksLeft = Math.ceil(days / 7);
  const weakTopics = [stats.weakestTopic, stats.strongestTopic].filter(Boolean);

  let weeklyPlan = '';
  for (let i = 0; i < Math.min(weeksLeft, 4); i++) {
    const focus = i === 0
      ? stats.weakestTopic || 'Review weak areas'
      : i === 1
        ? 'Mixed practice — all topics'
        : i === 2
          ? 'Full-length practice exams'
          : 'Light review + rest before exam day';
    weeklyPlan += `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#2b6cb0;white-space:nowrap">Week ${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#4a5568">${focus}</td>
    </tr>`;
  }

  const html = baseWrapper(`
<h2 style="color:#1a365d;margin:0 0 8px">Your Personalized Study Plan</h2>
<p style="font-size:18px;color:#e53e3e;font-weight:700;margin:0 0 24px">
  ${days} days until ABPD Part 1 — May 4, 2026
</p>

<p style="color:#4a5568;line-height:1.6;margin-bottom:20px">
  Based on your performance so far (<strong>${stats.totalQuestions} questions</strong>,
  <strong>${stats.overallAccuracy}% overall</strong>), here's a focused plan
  for your remaining ${weeksLeft} weeks:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px">
<tr style="background:#f7fafc">
  <th style="padding:10px 12px;text-align:left;font-size:13px;color:#718096;text-transform:uppercase">Week</th>
  <th style="padding:10px 12px;text-align:left;font-size:13px;color:#718096;text-transform:uppercase">Focus</th>
</tr>
${weeklyPlan}
</table>

<p style="color:#4a5568;line-height:1.6">
  Your biggest opportunity for improvement is <strong>${stats.weakestTopic}</strong>.
  Prioritize that this week, then broaden your review.
</p>

${ctaButton('Start your study plan →')}
  `);

  return { subject, html, bcc: SUPPORT_EMAIL };
}

// ── Email #5 — Day 21: Final Push ──────────────────────────────────────────

export function buildFinalPushEmail(days) {
  const subject = `${days} days left — time to simulate the real thing`;
  const html = baseWrapper(`
<h2 style="color:#1a365d;margin:0 0 8px">Time to Simulate the Real Thing</h2>
<p style="font-size:18px;color:#e53e3e;font-weight:700;margin:0 0 24px">
  ${days} days until ABPD Part 1 — May 4, 2026
</p>

<p style="color:#4a5568;line-height:1.6">
  The real ABPD Part 1 exam is <strong>240 questions in 4 hours</strong>.
  The best way to prepare? Simulate it.
</p>

<table width="100%" cellpadding="16" cellspacing="0" style="background:#f7fafc;border-radius:6px;border-left:4px solid #2b6cb0;margin:20px 0">
<tr><td style="color:#2d3748;line-height:1.6">
  <strong>This week's challenge:</strong><br>
  Try a full-length Exam Mode simulation. Set a timer, close your notes, and treat it like the real thing.
  The more realistic your practice, the more confident you'll feel on May 4.
</td></tr>
</table>

<p style="color:#4a5568;line-height:1.6">
  Even one full simulation before exam day can significantly reduce test-day anxiety.
  You've put in the work — now prove it to yourself.
</p>

${ctaButton('Launch Exam Mode →')}
  `);

  return { subject, html, bcc: SUPPORT_EMAIL };
}

// ── Email #6 — Day 30: Part 2 Planning ─────────────────────────────────────

export function buildPart2PlanningEmail() {
  const subject = 'Part 1 is almost here — here is what comes next';
  const html = baseWrapper(`
<h2 style="color:#1a365d;margin:0 0 8px">Thinking Ahead: Part 2</h2>

<p style="color:#4a5568;line-height:1.6">
  Part 1 is almost here — great work getting this far.
</p>

<p style="color:#4a5568;line-height:1.6">
  Once you pass Part 1, the next step is the <strong>ABPD Part 2 (Oral Clinical Exam)</strong>.<br><br>
  Here is the timeline you need to know:<br>
  • Part 1 results: <strong>6–8 weeks after May 4</strong> (late June/July 2026)<br>
  • Part 2 registration: <strong>January 6–20, 2027</strong> — only <strong>15 days</strong> to apply<br>
  • Part 2 exam: <strong>October 2027</strong> in Raleigh, NC<br><br>
  Most residents miss the January window. We will remind you well in advance.<br><br>
  Start collecting your clinical cases now —
  the earlier you organize your case presentations, the less stressful
  the prep will be.
</p>

<table width="100%" cellpadding="16" cellspacing="0" style="background:#fffff0;border-radius:6px;border-left:4px solid #d69e2e;margin:20px 0">
<tr><td style="color:#744210;line-height:1.6">
  <strong>We are building Part 2 prep.</strong><br>
  Want early access? Reply to this email and we'll add you to the list.
</td></tr>
</table>

<p style="color:#4a5568;line-height:1.6">
  Focus on Part 1 for now. We'll be here when you're ready for Part 2.
</p>

${ctaButton('Reply for Part 2 early access →', `mailto:${SUPPORT_EMAIL}?subject=Part%202%20Early%20Access`)}
  `);

  return { subject, html, bcc: SUPPORT_EMAIL };
}

// ── Email #7 — Post May 4: Post-Exam ───────────────────────────────────────

export function buildPostExamEmail() {
  const subject = 'Part 1 is done — how did it go?';
  const html = baseWrapper(`
<h2 style="color:#1a365d;margin:0 0 8px">Part 1 Is Done!</h2>

<p style="color:#4a5568;line-height:1.6">
  The exam was yesterday — we hope it went well!
</p>

<p style="color:#4a5568;line-height:1.6">
  <strong>Results</strong> typically come out <strong>6–8 weeks</strong> after the exam.
  We know the wait is tough, but you've done the hard part.
</p>

<table width="100%" cellpadding="16" cellspacing="0" style="background:#f0fff4;border-radius:6px;border-left:4px solid #38a169;margin:20px 0">
<tr><td style="color:#276749;line-height:1.6">
  <strong>What's next?</strong><br>
  If you passed, your next milestone is <strong>Part 2 registration — January 6–20, 2027</strong> (only 15 days to apply, easy to miss).<br>
  The Part 2 exam is held in <strong>October 2027</strong> in Raleigh, NC. You have time to prepare — but start collecting your clinical cases now.
  Reply to this email if you want us to notify you when Part 2 prep launches.
</td></tr>
</table>

<p style="color:#4a5568;line-height:1.6">
  No matter what, you showed up and put in the work.
  That's something to be proud of.
</p>

${ctaButton('Reply about Part 2 →', `mailto:${SUPPORT_EMAIL}?subject=Part%202%20Notify%20Me`)}
  `);

  return { subject, html, bcc: SUPPORT_EMAIL };
}
