# 🦟 MosQuit — AI Multi-Agent Vector Control Command Center

## Overview

MosQuit is an AI-powered decision system designed to help cities allocate limited mosquito-control resources (e.g., fumigation teams) under uncertainty.

Instead of only predicting risk, MosQuit simulates decisions, models trade-offs, and uses multiple AI agents to debate and recommend optimal interventions.

The system is built for demonstration purposes in a hackathon environment. It prioritizes clarity, reasoning, and interaction over real-world accuracy.

---

## Core Objective

Given:

- Limited fumigation teams
- Budget constraints
- Time constraints (24–72 hours)

The system must answer:

> "Where should we intervene now to minimize expected infections?"

---

## Key Principles

1. **Decision-making over prediction**
   - Risk estimation is approximate
   - The core value is reasoning and planning under constraints

2. **Multiple perspectives**
   - No single “correct” answer
   - Trade-offs must be surfaced explicitly

3. **Explainability**
   - Every recommendation must be justified
   - Disagreements between agents are important

4. **Simulation over static output**
   - The system should show consequences over time

---

## System Components

### 1. Risk Estimation Layer

Purpose:
- Generate a probabilistic heatmap of mosquito-borne disease risk

Inputs (can be simulated or heuristic-based):
- Temperature
- Humidity
- Population density
- Proximity to previous outbreaks
- Optional: citizen reports

Output:
- Zones with associated risk scores (e.g., 0–1)

Important:
- Do NOT claim high accuracy
- This is an approximation layer

---

### 2. Multi-Agent Decision System (CORE)

The system contains multiple AI agents, each with different objectives:

---

#### 🧠 Epidemiologist Agent
Goal:
- Minimize infections

Behavior:
- Prioritizes high-risk and high-spread zones
- Favors early and aggressive intervention

---

#### 💰 Budget Agent
Goal:
- Minimize cost

Behavior:
- Prefers fewer interventions
- Focuses on cost-effectiveness

---

#### 🚧 Operations Agent
Goal:
- Ensure feasibility

Behavior:
- Considers travel time, reachability, and execution constraints
- Rejects unrealistic plans

---

#### ⚠️ Public Risk Agent
Goal:
- Minimize visible/public risk

Behavior:
- Prioritizes dense or sensitive areas
- Focuses on perception and potential panic

---

### Agent Interaction

All agents:

1. Receive the same input:
   - Risk map
   - Available resources
   - Constraints

2. Independently propose actions

3. Engage in a structured debate:
   - Agree / disagree
   - Challenge assumptions
   - Propose alternatives

4. Produce a final negotiated plan

---

### 3. Planning Engine

The system must:

- Select zones for intervention
- Allocate teams
- Respect constraints:
  - Team count
  - Budget
  - Time

Output:

- Ranked list of zones
- Allocation plan
- Trade-offs made

Important:
- Do NOT rely on rigid optimization algorithms
- Use reasoning-based planning

---

### 4. Narrative Simulation Engine

Purpose:
- Show how outcomes evolve over time

Given a plan, simulate:

- Infection spread
- Secondary effects
- Impact of delayed or skipped interventions

Output format:

Day-by-day narrative, for example:

Day 1:
- Initial interventions applied

Day 3:
- Spread begins in adjacent zones

Day 5:
- Secondary cluster forms

Day 7:
- Outcome stabilizes or worsens

Important:
- Focus on clarity and plausibility, not epidemiological precision

---

### 5. Explainability Layer

The system must clearly explain:

- Why each zone was selected
- Why alternatives were rejected
- What trade-offs were made
- Which agents disagreed and why

---

### 6. Noisy Input Handling (Optional but encouraged)

The system may receive unstructured inputs such as:

- "There are many mosquitoes near the school"
- "Standing water after rain"

The system should:

- Interpret these inputs
- Map them to zones
- Adjust risk accordingly

---

## Constraints

- Focus on ONE disease (dengue)
- Focus on ONE city (can be simulated)
- Time horizon: short-term (1–7 days)
- Data can be synthetic or heuristic

---

## Output Format (Strict)

The system should produce structured outputs in this format:

### 1. Recommended Plan

- Zones selected
- Resource allocation
- Summary of reasoning

---

### 2. Agent Debate Summary

- Key arguments from each agent
- Points of disagreement
- Final compromise

---

### 3. Trade-offs

- What was sacrificed
- What risks remain

---

### 4. Simulation

- Day-by-day evolution of the outbreak
- Consequences of the chosen plan

---

## Tone & Style

- Clear, structured, and professional
- Avoid exaggeration
- Be honest about uncertainty
- Prioritize reasoning over confidence

---

## What This Is NOT

- Not a precise epidemiological model
- Not a real-time government system
- Not globally scalable

---

## What This IS

> A decision-support AI that demonstrates how multiple intelligent agents can reason, debate, and act under real-world constraints.

---

## One-Line Summary

"An AI command center where competing agents decide how to stop outbreaks before they happen.":