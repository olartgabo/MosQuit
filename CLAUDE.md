# MosQuit - AI Decision System for Vector Control

## Mission

Help cities with limited resources decide which neighborhoods to fumigate during dengue outbreaks by using multiple AI agents that debate trade-offs and explain their reasoning.

**The Hook:** "Watch AI agents argue with each other to make impossible life-or-death decisions"

**One-Line Summary:** An AI command center where four competing agents debate in real-time to decide which neighborhoods to fumigate when you can't save everyone.

---

## Hackathon Context

- **Event:** Anthropic Opus 4.7 Hackathon
- **Timeline:** 6 days
- **Team Size:** 2-3 people
- **Priority:** Impressive interactive demo powered by just enough AI to feel alive

### Judging Criteria (Out of 100)
- **Impact (30%):** Real-world potential, addresses actual problem
- **Demo (25%):** Working, impressive, cool to watch
- **Opus 4.7 Use (20%):** Creative usage beyond basic integration
- **Depth & Execution (20%):** Engineering quality, thoughtful refinement

### Special Prizes We're Targeting
- **Most Creative Opus 4.7 Exploration** - Multi-agent debate with extended thinking
- **The "Keep Thinking" Prize** - Novel application (decision optimization vs. just prediction)

---

## What We're Building

A web application with three core components:

### 1. Live Interactive Map
- Animated heatmap showing 20-30 city zones
- Disease risk levels visualized with color gradients
- Infection spread animations (ripple effects)
- Zone selection highlighting

### 2. Multi-Agent AI Debate Theater
Four AI agents with distinct personalities:
- **Epidemiologist:** Minimize infections, aggressive intervention
- **Budget Officer:** Minimize costs, prioritize ROI
- **Operations Manager:** Ensure feasibility, logistics constraints
- **Public Risk Advisor:** Minimize panic, protect sensitive areas

They visibly argue, disagree, and compromise to create an intervention plan.

### 3. Real-Time Simulation Engine
- Day-by-day outbreak evolution (7-day simulation)
- Shows what happens with AI's plan vs. alternatives
- Play/pause controls and speed adjustment
- Infection spread visualization

---

## Core User Flow (3-Minute Demo)

1. **Set Constraints:** Teams: 4, Budget: $30k, Time: 48h
2. **Generate Plan:** Click button → Watch 4 agents debate for 30 seconds (streaming text)
3. **See Recommendation:** Final plan with highlighted zones on map + reasoning
4. **Run Simulation:** Click "Play" → Watch 7-day outbreak evolution
5. **Compare Alternatives:** Click "What If?" → Compare AI plan vs. user's alternative
6. **See Impact:** "AI plan: 120 infections. Your plan: 180 infections. AI saved 60 people."

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │              │  │              │  │              │  │
│  │  Map View    │  │ Agent Debate │  │  Simulation  │  │
│  │  (Mapbox GL) │  │   Theater    │  │   Controls   │  │
│  │              │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┼─────────────────┘           │
│                           │                             │
├───────────────────────────┼─────────────────────────────┤
│                    State Management                      │
│                    (Zustand/Context)                     │
├───────────────────────────┼─────────────────────────────┤
│                           │                             │
│  ┌────────────────────────┴──────────────────────────┐  │
│  │          API Routes (/api/agents/*)                │  │
│  └────────────────────────┬──────────────────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼─────┐    ┌────────▼───────┐   ┌──────▼──────┐
│             │    │                │   │             │
│  Claude API │    │  Simulation    │   │   City      │
│  (Opus 4.7) │    │    Engine      │   │   Data      │
│             │    │  (TypeScript)  │   │  (Zones)    │
└─────────────┘    └────────────────┘   └─────────────┘
```

### Three Core Components:

#### 1. Multi-Agent Decision System (AI Core)
- 4 agents with competing priorities
- Structured debate flow: propose → critique → respond → consensus
- Uses Opus 4.7 extended thinking & prompt caching
- Streaming responses for live debate visualization

#### 2. Interactive Map Interface (Visual Core)
- Mapbox GL for smooth animations
- Heatmap risk visualization
- Infection spread effects (ripples, color changes)
- Click interactions for zone details

#### 3. Simulation Engine (Logic Core)
- Rule-based outbreak spread (not ML)
- Intervention effects modeling (fumigation reduces spread 70% for 3 days)
- Day-by-day state progression
- Outcome metrics calculation

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Mapping:** Mapbox GL JS (fallback: Leaflet if issues)
- **State:** Zustand (lightweight) or React Context
- **API Calls:** Native fetch with streaming support

### AI Integration
- **Model:** Anthropic Claude API (claude-opus-4.7)
- **Features Used:**
  - Extended thinking (for agent reasoning)
  - Prompt caching (efficiency across 4 agents)
  - Structured outputs (JSON mode)
  - Streaming responses (live debate visualization)

### Backend
- **API Routes:** Next.js API routes (serverless functions)
- **Database:** None initially (in-memory state)
- **Simulation:** TypeScript classes (rule-based)

### Deployment
- **Platform:** Vercel (zero-config)
- **Environment:** Edge functions for API routes

---

## Key Concepts

### Agent Personalities

Each agent has distinct objectives and biases:

**Epidemiologist Agent**
- **Goal:** Minimize total infections
- **Personality:** Urgent, data-driven, risk-averse
- **Behavior:** Favors early intervention, prioritizes high-risk zones
- **Bias:** "Better safe than sorry"

**Budget Officer Agent**
- **Goal:** Minimize costs, maximize ROI
- **Personality:** Cautious, analytical, cost-conscious
- **Behavior:** Prefers fewer interventions, questions expensive zones
- **Bias:** "Every dollar counts"

**Operations Manager Agent**
- **Goal:** Ensure feasibility and logistics
- **Personality:** Pragmatic, realistic, detail-oriented
- **Behavior:** Considers travel time, team capacity, execution constraints
- **Bias:** "Can we actually do this?"

**Public Risk Advisor Agent**
- **Goal:** Minimize public panic and PR issues
- **Personality:** Strategic, perception-focused, sensitive to optics
- **Behavior:** Prioritizes visible/sensitive areas (schools, hospitals, dense neighborhoods)
- **Bias:** "What will the public think?"

### Debate Flow

```
Phase 1: Independent Analysis (Parallel)
├─ All 4 agents receive: risk map, constraints, zone data
├─ Each proposes intervention plan independently
└─ 4 parallel Claude API calls

Phase 2: Critique Round
├─ All agents see all proposals
├─ Each critiques others' plans
└─ Disagreements highlighted

Phase 3: Response Round
├─ Agents respond to critiques
├─ Modify or defend positions
└─ Convergence begins

Phase 4: Consensus Synthesis
├─ Final Claude call to synthesize
├─ Resolve remaining conflicts
└─ Generate unified plan with trade-offs documented
```

### Zone Risk Calculation

Risk score (0-1) based on:
- **Environmental factors:** Temperature, humidity (mocked)
- **Population density:** Higher density = higher spread potential
- **Proximity to outbreaks:** Distance from infected zones
- **Citizen reports:** Optional natural language input

Formula (simplified):
```
risk = (envFactor × 0.4) + (densityFactor × 0.3) + (proximityFactor × 0.3)
```

### Simulation Mechanics

**Infection Spread Model (Per Day Tick):**
1. For each infected zone:
   - Calculate transmission to adjacent zones
   - P(spread) = baseRisk × interventionModifier × randomFactor
   - Update susceptible/infected/recovered counts

2. Apply intervention effects:
   - Fumigation reduces transmission by 70% for 3 days
   - Effect decays after 3 days
   - Delayed intervention = reduced effectiveness

3. Track metrics:
   - Total infections
   - Zones affected
   - Cost of interventions
   - Public panic level (optional)

---

## Development Philosophy

### DO:
- **Prioritize demo impact** over technical perfection
- **Make agent disagreements visible** (red borders, highlighted conflicts)
- **Show consequences through animation** (infection spreading is visual)
- **Use rule-based simulation** (transparent, tunable, no ML needed)
- **Focus on reasoning quality** (prompt engineering matters)
- **Optimize for "wow moments"** (streaming debate, split-screen comparison)

### DON'T:
- **Over-engineer** (no real satellite data, no ML models, no microservices)
- **Claim high accuracy** (frame as "decision support under uncertainty")
- **Build for production scale** (demo-focused, optimize later)
- **Add features that don't enhance demo** (authentication, user profiles, etc.)
- **Use complex epidemiological models** (too hard to explain, too fragile)

### Scope Priorities

**Must Have (Protect these):**
- Multi-agent debate with streaming responses
- Simulation with infection spread visualization
- Map with heatmap and zone highlighting

**Should Have (Add if on schedule):**
- "What-If" split-screen comparison
- Explainability panels
- Natural language input

**Nice to Have (Cut if behind):**
- Agent influence sliders
- Multiple preset scenarios
- Outcome export

---

## File Structure

```
mosquit/
├── CLAUDE.md              # This file (AI assistant context)
├── context.md             # Technical implementation reference
├── README.md              # Setup and running instructions
├── plan.md                # Original hackathon concept
├── project.md             # Original system specification
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.example
│
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main demo page
│   │   ├── layout.tsx                  # Root layout
│   │   └── api/
│   │       └── agents/
│   │           ├── debate.ts           # Multi-agent debate endpoint
│   │           ├── propose.ts          # Initial proposals endpoint
│   │           └── simulate.ts         # Simulation endpoint (optional)
│   │
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapView.tsx             # Main map component
│   │   │   ├── ZoneLayer.tsx           # Heatmap rendering
│   │   │   ├── InfectionAnimation.tsx  # Spread visualization
│   │   │   └── ZoneDetails.tsx         # Click popup
│   │   │
│   │   ├── Agents/
│   │   │   ├── DebatePanel.tsx         # Full debate UI container
│   │   │   ├── AgentCard.tsx           # Individual agent display
│   │   │   ├── AgentMessage.tsx        # Single message bubble
│   │   │   └── ConsensusView.tsx       # Final plan display
│   │   │
│   │   ├── Controls/
│   │   │   ├── ResourceSliders.tsx     # Team/budget/time controls
│   │   │   ├── SimulationControls.tsx  # Play/pause/speed
│   │   │   └── ScenarioSelector.tsx    # Preset scenarios
│   │   │
│   │   └── Explainability/
│   │       ├── ReasoningPanel.tsx      # Why each zone selected
│   │       ├── TradeoffView.tsx        # What was sacrificed
│   │       └── MetricsDisplay.tsx      # Outcome stats
│   │
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── prompts.ts              # System prompts for all agents
│   │   │   ├── orchestrator.ts         # Debate flow logic
│   │   │   ├── types.ts                # Agent-related types
│   │   │   └── parser.ts               # Parse agent responses
│   │   │
│   │   ├── simulation/
│   │   │   ├── engine.ts               # Core simulation state machine
│   │   │   ├── spread.ts               # Infection spread algorithm
│   │   │   ├── interventions.ts        # Fumigation effects
│   │   │   └── metrics.ts              # Calculate outcomes
│   │   │
│   │   ├── city/
│   │   │   ├── zones.ts                # Zone definitions and generation
│   │   │   ├── risk.ts                 # Risk calculation
│   │   │   ├── adjacency.ts            # Zone neighbor graph
│   │   │   └── generator.ts            # Generate mock city data
│   │   │
│   │   └── utils/
│   │       ├── anthropic.ts            # API client wrapper
│   │       ├── streaming.ts            # Handle streaming responses
│   │       └── cache.ts                # Prompt caching helpers
│   │
│   └── types/
│       └── index.ts                    # Global TypeScript interfaces
│
└── public/
    └── city-data/
        └── zones.geojson               # Zone geometries (optional)
```

---

## Key Files and Their Purposes

### Critical Files (Create These First)

1. **`src/types/index.ts`**
   - All TypeScript interfaces (Zone, Agent, Simulation, etc.)
   - Single source of truth for data structures
   - Import from here everywhere

2. **`src/lib/agents/prompts.ts`**
   - System prompts for all 4 agents
   - Most important for agent personality quality
   - Tune these to improve debate richness

3. **`src/app/api/agents/debate.ts`**
   - Multi-agent orchestration logic
   - Handles Claude API calls with streaming
   - Implements debate flow phases

4. **`src/lib/simulation/engine.ts`**
   - Simulation state machine
   - Day-by-day progression
   - Intervention effects

5. **`src/components/Map/MapView.tsx`**
   - Main visual component
   - Map initialization and layers
   - User interactions

### Supporting Files

6. **`src/lib/city/zones.ts`** - Generate mock city with 20-30 zones
7. **`src/components/Agents/DebatePanel.tsx`** - UI for agent conversation
8. **`src/app/page.tsx`** - Main orchestration and layout
9. **`src/lib/utils/anthropic.ts`** - API client with caching
10. **`README.md`** - Setup instructions for team members

---

## Development Workflow

### Daily Standup (15 minutes)
- What did I finish yesterday?
- What will I do today?
- Any blockers?

### Integration Checkpoints (End of Each Day)
- Merge working code to main branch
- Verify full flow still works end-to-end
- Update todo list for next day

### Demo Rehearsals
- **Day 4 PM:** First full rehearsal (identify gaps)
- **Day 5 PM:** Second rehearsal (smooth rough edges)
- **Day 6 AM:** Third rehearsal (finalize script)

---

## How to Use Opus 4.7 Creatively (For Judges)

### 1. Extended Thinking for Agent Reasoning
```typescript
// Use thinking parameter to show internal monologue
const response = await anthropic.messages.create({
  model: "claude-opus-4.7",
  thinking: {
    type: "enabled",
    budget_tokens: 2000
  },
  // ...
});

// Show judges: "Watch the Epidemiologist think through trade-offs"
// Display thinking content alongside final reasoning
```

### 2. Multi-Turn Debate with Prompt Caching
```typescript
// Cache zone data and system prompts across all 4 agents
// Each agent call reuses cached context (4× efficiency)
const systemPrompt = {
  type: "text",
  text: AGENT_SYSTEM_PROMPT,
  cache_control: { type: "ephemeral" }
};

// Highlight savings: "Prompt caching reduced costs by 75%"
```

### 3. Structured Outputs for Decision Schema
```typescript
// Use JSON mode for guaranteed parseable responses
const response = await anthropic.messages.create({
  // ...
  response_format: { type: "json_object" }
});

// Complex nested structures work reliably
// No retry logic needed for parsing
```

### 4. Natural Language → Structured Data
```typescript
// Citizen input: "Lots of mosquitoes near the school in Zone 5"
// Claude extracts: { zone: 5, risk_increase: 0.3, reason: "standing water near school" }

// Shows Opus understanding context and extracting structured info
```

### 5. Meta-Reasoning and Adaptation
```typescript
// After simulation runs, ask Claude:
// "Analyze what went wrong and how the plan could have been better"

// Shows learning and hindsight analysis
// Demonstrates reasoning beyond initial decision
```

---

## Common Pitfalls to Avoid

### Technical
- **Don't hardcode API keys** - Use environment variables
- **Don't skip error handling** - Demo might fail at worst time
- **Don't forget loading states** - Blank screens look broken
- **Don't overcomplicate simulation** - Simple rules are more transparent

### Design
- **Don't make map too busy** - Visual clarity matters
- **Don't hide agent disagreements** - They're the main feature
- **Don't use jargon in UI** - Judges may not be epidemiologists
- **Don't neglect mobile layout** - Judges might view on tablets

### Demo
- **Don't rely on internet** - Have fallback responses
- **Don't wing the demo** - Practice the 3-minute flow
- **Don't skip the "why"** - Explain why this matters
- **Don't ignore questions** - Prepare for "what if" scenarios

---

## Environment Variables

Create `.env.local` with:

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Mapbox (for map rendering)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_NATURAL_LANGUAGE=true
NEXT_PUBLIC_ENABLE_WHAT_IF_MODE=true

# Optional: Demo mode (uses pre-generated responses)
NEXT_PUBLIC_DEMO_MODE=false
```

---

## Testing Strategy

### Manual Testing (Primary for Hackathon)
- **Smoke test:** Can we run the full 3-minute demo flow?
- **Edge cases:** What if all zones are high risk? What if budget is $0?
- **Error scenarios:** What if Claude API is down?

### Automated Testing (If Time Allows)
- Unit tests for simulation logic (jest)
- API route tests (ensure debate flow works)
- Component tests (ensure UI renders)

**Reality:** Skip automated tests if behind schedule. Manual testing is enough for demo.

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured in Vercel
- [ ] API keys secured (not in git)
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors in production build
- [ ] Fallback responses ready (if API fails)

### Post-Deployment
- [ ] Live URL works on desktop and mobile
- [ ] All features functional on production
- [ ] Demo flow tested end-to-end
- [ ] Backup video recorded (screen recording)
- [ ] Team knows production URL by heart

---

## Collaboration Guidelines

### Git Workflow
- **Main branch:** Always deployable, protected
- **Feature branches:** `feature/agent-debate`, `feature/map-viz`, etc.
- **Commit messages:** Clear and descriptive ("Add epidemiologist agent prompt")
- **Pull requests:** Quick review before merge (don't block progress)

### Code Style
- **TypeScript:** Strict mode, no `any` unless necessary
- **Components:** Functional components with hooks
- **Naming:** Descriptive (e.g., `calculateInfectionSpread` not `calc`)
- **Comments:** Explain "why" not "what"

### Communication
- **Blockers:** Announce immediately in team chat
- **Changes to plan:** Discuss before cutting features
- **Demo script:** Everyone should know it by Day 5

---

## Success Metrics

### Technical Success
- [ ] Multi-agent debate generates diverse perspectives
- [ ] Simulation runs smoothly for 7 days
- [ ] Map visualizations are smooth and clear
- [ ] No critical bugs in main demo flow

### Demo Success
- [ ] Can complete 3-minute demo without crashing
- [ ] Judges visibly engaged (nodding, asking questions)
- [ ] "Wow moment" lands (split-screen comparison)
- [ ] Able to answer technical questions confidently

### Judging Success
- **Impact:** 25+/30 (clear real-world relevance)
- **Demo:** 22+/25 (working and impressive)
- **Opus 4.7 Use:** 17+/20 (creative integration)
- **Depth:** 16+/20 (solid execution)
- **Total:** 80+/100 (competitive for prizes)

---

## Quick Reference

### Start Development Server
```bash
npm run dev
# → http://localhost:3000
```

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
vercel --prod
```

### Key Commands
- `npm run lint` - Check code quality
- `npm run type-check` - TypeScript validation
- `npm run format` - Auto-format code (if Prettier installed)

---

## Final Reminders

1. **Demo quality > Code perfection** - Ship something impressive
2. **Agent debate is the core** - Protect Day 2 milestone
3. **Visible disagreement** - Make agents argue visibly
4. **Practice the demo** - 3 rehearsals minimum
5. **Have backup plans** - Pre-recorded video, fallback responses
6. **Explain the "why"** - Why this matters for real cities
7. **Show Opus 4.7 depth** - Extended thinking, prompt caching, structured outputs
8. **Enjoy the process** - This is a cool idea, have fun building it

---

## Questions to Ask Claude Code

When working with Claude Code assistant, good questions to ask:

- "Review the agent prompt for the Epidemiologist - does it create a distinct personality?"
- "Help me optimize this Claude API call for prompt caching"
- "What's the simplest infection spread algorithm that would look realistic in the demo?"
- "How can I make the agent disagreements more visually obvious in the UI?"
- "Suggest improvements to the 3-minute demo script"
- "What edge cases should I test before demo day?"

---

**Ready to build? Let's make MosQuit a reality.** 🦟
