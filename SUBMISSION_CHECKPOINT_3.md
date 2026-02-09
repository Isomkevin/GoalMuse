# Checkpoint 3 — Copy-paste for submission form

Use the content below when filling the Checkpoint 3 submission fields. Replace placeholder links with your actual URLs before submitting.

---

## Submission Details (Required)

**Provide a detailed explanation of your submission. Describe what you've done, the process, and any relevant context.**

GoalMuse is a mobile app that turns vision boards and daily journaling into measurable progress. We built a full stack: an Expo/React Native app (Board, Goals, Tasks & Journal, Insights, Voice tabs), a FastAPI backend with JWT auth and CRUD for boards, goals, tasks, and journal entries, and three modular AI agents that run on a single LLM.

**What we did:** Users create a vision board and goals, add tasks (optionally linked to goals), and write journal entries. Instead of showing a raw “X% complete,” we compute a **progress confidence** score (0–100) from four signals: task completion, consistency (recent activity), how well actions align with goals (Alignment agent), and whether we have enough data to recommend (agent confidence). We expose a transparent breakdown so users see how the number is calculated. Three agents run on demand: **Alignment** scores how well recent actions match goals; **Synergy** finds connections between goals and suggests compound actions that advance multiple goals; **Optimization** returns exactly one next action with a short reason. Every AI output is explainable. We integrated Opik for observability (traces and metrics on agent/LLM calls) so we can compare prompt and model versions with data. We also added a “Did this help?” feedback (Yes / Somewhat / No) and persist it for evaluation and future improvement.

**Process:** We started from a clear architecture (Phase 0 doc), implemented backend and mobile in phases (boards → goals → entries → progress → AI agents → feedback → voice and polish). Each agent lives in its own module with a single LLM interface; we use low temperature and structured JSON for reliable, explainable outputs. The app handles loading, empty, and error states and degrades gracefully when the backend or LLM is unavailable.

**Key achievements:** One clear next action (no list overload); progress that reflects momentum and alignment, not just task count; full flow from sign-in to insights and feedback; Opik integration so improvements are measurable; and a calm, production-grade UI aligned with our design system.

---

## One-Liner (Required)

**Share a one-liner for your project, no buzzwords, no detail. Just answer the question: What is this?**

**An app that turns your vision board and daily habits into one clear next step and a progress score you can trust.**

(Alternative, even shorter: **An app that shows you how close you are to your goals and what to do next.**)

---

## Link to Code (Required)

Replace with your actual GitHub repo URL.

**https://github.com/Isomkevin/GoalMuse**

---

## Link to Demo Video (Required)

Replace with your actual YouTube video URL.

**https://www.youtube.com/watch?v=lVpWJ1BQtmE**  
Short link: **https://youtu.be/lVpWJ1BQtmE**

---

## Live Demo Link (Optional)

Replace with your deployed app URL (e.g. Expo Go link, or web demo if you have one).

**e.g. https://expo.dev/... or https://goal-muse.vercel.app/**

(Leave blank if you don’t have a live demo.)

---

## Link to Presentation (Optional)

Replace with your deck URL (Google Slides, Canva, etc.).

**https://pitch.com/v/ai-goalmuse-pitch-transform-vision-to-results-nqznsz**

(Leave blank if not required.)
