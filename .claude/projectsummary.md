Project Summary

     MosQuit is an AI-powered decision system where multiple AI agents debate in real-time to decide how to 
     allocate limited mosquito fumigation resources during a dengue outbreak.

     The Hook: "Watch AI agents argue with each other to make impossible life-or-death decisions"

     Tech Stack: Next.js 14 + React + TypeScript + Mapbox GL + Anthropic Claude API (Opus 4.7)

     Team: 2-3 people over 6 days

     Priority: Impressive interactive demo powered by just enough AI to feel alive

     ---
     Polished Project Scope

     What We're Building

     A web application with three core components:

     1. Live Interactive Map - Animated heatmap showing 20-30 city zones with disease risk levels, infection 
     spread animations, and zone selection highlighting
     2. Multi-Agent AI Debate Theater - 4 AI agents with distinct personalities (Epidemiologist, Budget Officer, 
     Operations Manager, Public Risk Advisor) that visibly argue, disagree, and compromise to create an 
     intervention plan
     3. Real-Time Simulation Engine - Day-by-day outbreak evolution showing what happens with AI's plan vs. 
     alternatives, with play/pause controls and speed adjustment

     Core User Flow (3-Minute Demo)

     1. User sets constraints (teams: 4, budget: $30k, time: 48h)
     2. Click "Generate Plan" → Watch 4 agents debate for 30 seconds
     3. See final plan: highlighted zones on map with reasoning
     4. Click "Play Simulation" → Watch 7-day outbreak evolution
     5. Click "What If?" → Compare AI plan vs. user's alternative
     6. See outcome: "AI plan: 120 infections. Your plan: 180 infections. AI saved 60 people."

     What Makes It Special

     - Not just prediction - Optimization + explainability + transparent reasoning
     - Visible disagreement - Agents argue in real-time with streaming responses
     - Interactive consequences - Every decision shows impact through simulation
     - Real-world grounding - Addresses actual problem faced by under-resourced health departments

     ---
     File Structure & Key Documents

     CLAUDE.md - Project Context for AI Assistants

     Purpose: Help Claude Code and future AI collaborators understand the project quickly

     Contents:
     - Project overview and objectives
     - Architecture overview (frontend, AI, simulation)
     - Tech stack with rationale
     - Key concepts (agents, zones, simulation mechanics)
     - Development priorities (demo quality > accuracy)
     - Hackathon context and judging criteria
     - Special considerations (prompt engineering patterns, API optimization)

     Location: C:\Users\User\Downloads\MosQuit\CLAUDE.md

     ---
     context.md - Detailed Technical Context

     Purpose: In-depth technical reference for implementation decisions

     Contents:
     - Detailed component architecture
     - Data structures (zones, risk scores, agent responses)
     - Agent prompt engineering strategy
     - Simulation algorithm details
     - API integration patterns (caching, error handling)
     - UI/UX design principles
     - Testing strategy
     - Deployment configuration

     Location: C:\Users\User\Downloads\MosQuit\context.md

     ---
     Implementation Approach

     Phase 1: Project Setup & Documentation (Day 1 Morning)

     Create Core Documentation Files:

     1. CLAUDE.md - High-level context document
       - Project mission and hackathon goals
       - Architecture diagram (ASCII or markdown)
       - Tech stack justification
       - Development workflow
       - Key files and their purposes
     2. context.md - Technical implementation guide
       - Data models and TypeScript interfaces
       - Agent system prompt templates
       - Simulation mechanics (infection spread formulas)
       - Map integration approach
       - State management patterns
     3. README.md - Setup and running instructions
       - Prerequisites
       - Installation steps
       - Environment variables
       - Development commands
       - Deployment instructions

     Initialize Project Structure:

     mosquit/
     ├── CLAUDE.md              # AI assistant context
     ├── context.md             # Technical reference
     ├── README.md              # Setup instructions
     ├── package.json           # Dependencies
     ├── .env.example           # Environment template
     ├── src/
     │   ├── app/
     │   │   ├── page.tsx       # Main demo page
     │   │   └── api/agents/    # Claude API routes
     │   ├── components/
     │   │   ├── Map/           # Map visualization
     │   │   ├── Agents/        # Agent debate UI
     │   │   ├── Controls/      # Resource sliders
     │   │   └── Explainability/
     │   ├── lib/
     │   │   ├── agents/        # Agent orchestration
     │   │   ├── simulation/    # Outbreak simulation
     │   │   ├── city/          # Zone definitions
     │   │   └── utils/         # API client
     │   └── types/             # TypeScript types
     └── public/
         └── city-data/         # Zone GeoJSON

     ---
     Phase 2: Core Features (Days 1-3)

     Day 1: Foundation
     - Next.js setup with TypeScript + Tailwind
     - Basic map with dummy zones
     - First agent prompt working (Epidemiologist)
     - Sliders update state

     Day 2: Multi-Agent System (CRITICAL)
     - All 4 agent prompts with distinct personalities
     - Debate orchestration (parallel proposals → 2-round debate → consensus)
     - UI showing streaming agent responses
     - Highlight disagreements visually

     Day 3: Simulation Engine (CRITICAL)
     - Infection spread model (zone-to-zone transmission)
     - Fumigation effects (reduce spread rate)
     - Day-by-day state progression
     - Playback controls (play/pause/speed)
     - Animated infection visualization

     ---
     Phase 3: Polish & Advanced Features (Days 4-5)

     Day 4: Explainability & Professional Polish
     - Reasoning panels (why each zone selected)
     - Trade-off visualization
     - Outcome comparison charts
     - Error handling and loading states
     - Mobile responsiveness

     Day 5: Interactive "What-If" Mode
     - Split-screen comparison
     - User vs. AI plan comparison
     - Agent influence sliders
     - Preset demo scenarios

     ---
     Phase 4: Demo Preparation (Day 6)

     Deployment & Testing:
     - Deploy to Vercel
     - Pre-cache common prompts
     - Fallback responses for API failures
     - Record backup demo video

     Demo Materials:
     - 3-minute demo script
     - 1-slide visual (optional)
     - Pitch refinement
     - Team role assignments

     ---
     CLAUDE.md Content Strategy

     Section 1: Mission

     # MosQuit - AI Decision System for Vector Control

     ## Mission
     Help cities with limited resources decide which neighborhoods to fumigate
     during dengue outbreaks by using multiple AI agents that debate trade-offs
     and explain their reasoning.

     ## Hackathon Context
     - Built for Anthropic Opus 4.7 Hackathon
     - Timeline: 6 days
     - Team: 2-3 people
     - Priority: Impressive demo + creative Opus 4.7 usage
     - Target: Impact (30%) + Demo (25%) + AI Use (20%) + Depth (20%)

     Section 2: Architecture Overview

     ## System Architecture

     ### Three Core Components:

     1. **Multi-Agent Decision System** (AI Core)
        - 4 agents with competing priorities
        - Structured debate → consensus
        - Uses Opus 4.7 extended thinking & prompt caching

     2. **Interactive Map Interface** (Visual Core)
        - Mapbox GL for animations
        - Heatmap risk visualization
        - Infection spread effects

     3. **Simulation Engine** (Logic Core)
        - Rule-based outbreak spread
        - Intervention effects modeling
        - Day-by-day state progression

     Section 3: Key Concepts

     ## Agent Personalities

     - **Epidemiologist**: Minimize infections, aggressive intervention
     - **Budget Officer**: Minimize costs, prioritize ROI
     - **Operations Manager**: Ensure feasibility, logistics constraints
     - **Public Risk Advisor**: Minimize panic, protect sensitive areas

     ## Debate Flow

     1. All agents analyze risk map independently
     2. Each proposes intervention plan (parallel API calls)
     3. Round 1: Agents critique each other's proposals
     4. Round 2: Agents respond to critiques
     5. Final: Synthesize consensus plan

     Section 4: Development Priorities

     ## Development Philosophy

     ### DO:
     - Prioritize demo impact over technical perfection
     - Use rule-based simulation (not ML)
     - Make agent disagreements visible
     - Show consequences through animation

     ### DON'T:
     - Over-engineer (no real satellite data, no ML models)
     - Claim high accuracy (decision support under uncertainty)
     - Build for production scale (demo focused)
     - Add features that don't enhance demo

     ---
     context.md Content Strategy

     Section 1: Data Models

     // Zone structure
     interface Zone {
       id: number
       name: string
       geometry: GeoJSON.Polygon
       population: number
       baseRisk: number // 0-1 environmental suitability
       currentInfected: number
       susceptible: number
       recovered: number
       interventions: Intervention[]
     }

     // Agent response structure
     interface AgentProposal {
       agent: "epidemiologist" | "budget" | "operations" | "public_risk"
       recommendedZones: number[]
       reasoning: string
       concerns: string[]
       confidence: number // 0-1
     }

     Section 2: Agent Prompt Engineering

     ## Prompt Templates

     ### Epidemiologist Agent
     **Role:** Aggressive disease control specialist
     **Objective:** Minimize total infections
     **Personality:** Urgent, data-driven, risk-averse
     **Biases:** Favors early intervention, high-risk zones

     ### Prompt Structure:
     - System: Role definition + objectives
     - Context: Risk map + constraints + previous proposals (if debate)
     - Task: Analyze and propose OR critique OR synthesize
     - Output: Structured JSON with reasoning

     Section 3: Simulation Mechanics

     ## Infection Spread Model

     ### Per Day Tick:
     1. For each infected zone:
        - Calculate transmission probability to adjacent zones
        - P(spread) = baseRisk × interventionModifier × randomFactor
        - Update susceptible/infected/recovered counts

     2. Apply intervention effects:
        - Fumigation reduces transmission by 70% for 3 days
        - Delayed intervention = reduced effectiveness

     3. Calculate secondary effects:
        - High infection → increased public panic
        - Resource depletion → future constraints

     Section 4: API Optimization

     ## Claude API Usage Patterns

     ### Prompt Caching Strategy:
     - Cache zone data, risk map, system prompts
     - Reuse across all 4 agents (4× efficiency)
     - Update only agent-specific sections

     ### Cost Optimization:
     - Parallel agent calls (4 simultaneous)
     - Structured outputs (no parsing retries)
     - Fallback responses for demo scenarios
     - Pre-generated debates for backup

     ---
     Critical Success Factors

     Must Succeed:

     1. Multi-agent debate working by end of Day 2 - This is the core innovation
     2. Simulation engine working by end of Day 3 - This makes it feel alive
     3. Daily integration checkpoints - Don't let components drift
     4. Demo rehearsals (3x minimum) - Practice makes perfect

     Scope Discipline:

     - If behind schedule: Cut "What-If" mode (nice to have)
     - Protect: Agent debate, simulation, map visualization (must have)
     - Add only if ahead: Natural language input, agent tuning sliders

     ---
     Hackathon Scoring Strategy

     Impact (30%) - Target: 28/30

     Approach: Frame as decision support for real municipalities with limited resources
     Evidence: Show cost-benefit analysis, realistic constraints, explain why this doesn't exist today

     Demo (25%) - Target: 24/25

     Wow Factors:
     - Agents arguing in real-time (streaming text)
     - Infection spread animation (visual impact)
     - Split-screen "What-If" comparison (interactivity)

     Opus 4.7 Use (20%) - Target: 19/20

     Creative Usage:
     - Extended thinking for agent reasoning (show internal monologue)
     - Multi-turn debate with prompt caching (efficiency)
     - Structured outputs for complex decision schema
     - Natural language → structured data extraction

     Depth & Execution (20%) - Target: 18/20

     Quality Indicators:
     - TypeScript throughout (type safety)
     - Clean component architecture
     - Error boundaries, loading states
     - Thoughtful prompt engineering

     ---
     Risk Mitigation

     Critical Path Dependencies:

     - Claude API availability → Fallback: Pre-generated responses for demo
     - Map rendering issues → Fallback: Use Leaflet instead of Mapbox
     - Simulation complexity → Fallback: Simplified model with hardcoded outcomes
     - Deployment problems → Fallback: Run locally, screen-share

     Daily Blockers Check:

     - End of each day: Can we demo current state?
     - If no: Identify blocker, adjust next day's plan
     - If yes: Continue as planned

     ---
     Implementation Checklist

     Documentation Phase (Now):

     - Create CLAUDE.md with project context
     - Create context.md with technical details
     - Create README.md with setup instructions
     - Define TypeScript interfaces in context.md
     - Document agent prompt templates
     - Outline simulation algorithm

     Setup Phase (Day 1 Morning):

     - Initialize Next.js project with TypeScript
     - Install dependencies (Tailwind, shadcn/ui, Mapbox GL, Anthropic SDK)
     - Set up Git repository
     - Configure environment variables
     - Create basic project structure

     Development Phase (Days 1-5):

     - Follow day-by-day plan from comprehensive strategy
     - Daily integration checkpoints
     - Regular commits with clear messages

     Demo Phase (Day 6):

     - Deploy to Vercel
     - Record backup video
     - Practice 3-minute demo (3× minimum)
     - Prepare pitch (under 1 minute)
     - Test on demo device

     ---
     Key Files to Create First

     When implementation starts, create these files in priority order:

     1. CLAUDE.md - So AI assistants understand the project
     2. context.md - Technical reference for implementation
     3. src/types/index.ts - TypeScript interfaces for all data structures
     4. src/lib/agents/prompts.ts - Agent system prompts (critical for personalities)
     5. src/app/api/agents/debate.ts - Multi-agent orchestration endpoint
     6. src/lib/simulation/engine.ts - Simulation state machine
     7. src/components/Map/MapView.tsx - Main visual component

     ---
     Success Definition

     Minimum Viable Demo (End of Day 3):
     - Map shows 20 zones with heatmap
     - Click "Generate Plan" → See 4 agents debate (streaming text)
     - See final plan: 3 zones highlighted with reasoning
     - Click "Play" → Watch 7-day simulation (infection spreads, fumigated zones stay safer)

     Stretch Demo (End of Day 5):
     - All above +
     - "What-If" split-screen comparison
     - Natural language input ("Many mosquitoes near Zone 5")
     - Agent influence sliders
     - Polished animations and transitions

     Demo-Ready (End of Day 6):
     - Deployed and stable
     - 3-minute demo practiced
     - Backup plan ready
     - Team confident

     ---
     The Elevator Pitch

     "MosQuit is an AI command center where four competing agents debate in real-time to decide which 
     neighborhoods to fumigate when you can't save everyone. It's transparency meets optimization for public 
     health—and it could run on any city's laptop today."

     ---
     Next Steps

     1. Create CLAUDE.md - Project context document for AI collaboration
     2. Create context.md - Technical implementation reference
     3. Initialize Next.js project - Run npx create-next-app@latest mosquit --typescript --tailwind --app
     4. Set up Git repository - Initial commit with documentation
     5. Begin Day 1 development - Foundation work as outlined in comprehensive strategy

     The plan prioritizes visual demo impact while showcasing sophisticated AI agent reasoning—exactly what the 
     hackathon judges want to see.