# 🦟 MosQuit — AI Multi-Agent Vector Control Command Center

> **"Watch AI agents argue with each other to make impossible life-or-death decisions."**

MosQuit is an AI-powered decision support system designed to help city health departments allocate limited mosquito-control resources (e.g., fumigation teams) under uncertainty. Built for the Anthropic Opus 4.7 Hackathon, it demonstrates how multiple specialized AI agents can debate trade-offs, explain their reasoning, and optimize interventions to minimize disease outbreaks.

---

## 🚀 Overview

Under-resourced health departments often face the impossible choice of which neighborhoods to protect when they can't save everyone. MosQuit addresses this by:

- **Multi-Agent Reasoning:** Four specialized AI agents (Epidemiologist, Budget Officer, Operations Manager, and Public Risk Advisor) analyze data and debate in real-time.
- **Environmental Intelligence:** An Environmental Monitor agent analyzes satellite-derived metrics (NDWI, rainfall, elevation) to identify breeding hotspots *before* they become epicenters.
- **Explainable Decisions:** Every recommendation is backed by a transparent debate where agents challenge assumptions and defend their priorities.
- **Predictive Simulation:** A rule-based simulation engine shows the 7-day evolution of an outbreak, comparing the AI's plan against a "do-nothing" baseline.

---

## 🧠 The Agent Cabinet

1. **Dr. Vega (Epidemiologist):** Focuses on minimizing total infections. Urgent and data-driven.
2. **Chen (CFO):** Focuses on ROI and budget discipline. Cautious and analytical.
3. **Commander Reyes (Operations):** Focuses on logistical feasibility and team capacity. Pragmatic and realistic.
4. **Santos (Public Affairs):** Focuses on sensitive populations and minimizing public panic. Optics-aware.
5. **Dr. Reyes (Environmental Monitor):** Uses "satellite" data to find breeding grounds. Upstream-thinker.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **AI:** Anthropic Claude API (`claude-opus-4.7`) utilizing:
  - **Extended Thinking:** For deep reasoning during agent analysis.
  - **Prompt Caching:** For efficient multi-turn debate across 5 agents.
  - **Streaming:** For real-time visualization of the debate.
- **Geospatial:** Mapbox GL JS for interactive heatmaps and zone visualization.
- **State Management:** Zustand and React Hooks.

---

## 🚦 Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API Key
- Mapbox Access Token

### Installation

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd MosQuit
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file:
   ```env
   ANTHROPIC_API_KEY=your_key_here
   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

- `app/api/agents/debate/`: The core orchestration logic for the multi-agent debate.
- `lib/agents/`: Prompts, schemas, and personalities for each AI advisor.
- `lib/simulation/`: The engine that models infection spread and intervention impact.
- `lib/city/`: Geospatial zone generation and "scanning" logic.
- `components/Map/`: Mapbox integration and risk visualization layers.
- `components/Agents/`: UI for the "Debate Theater."

---

## 📈 Future Improvements

- **Interactive "What-If" Mode:** Allow users to manually select zones and compete against the AI's optimized plan.
- **Natural Language Input:** Integrate citizen reports ("Many mosquitoes near the park") directly into the risk model.
- **Real Satellite Integration:** Move beyond simulated satellite metrics to live Sentinel-2 data feeds.
- **Multi-City Support:** Pre-configured scenarios for various global tropical metropolises.

---

**Built with ❤️ for the Anthropic Opus 4.7 Hackathon.**
