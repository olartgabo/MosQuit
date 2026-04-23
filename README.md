# MosQuit - AI Decision System for Vector Control

> Watch AI agents argue with each other to make impossible life-or-death decisions

An AI-powered decision system where multiple AI agents debate in real-time to decide how to allocate limited mosquito fumigation resources during dengue outbreaks.

**Built for:** Anthropic Opus 4.7 Hackathon
**Tech Stack:** Next.js 14 + TypeScript + Mapbox GL + Claude API

---

## Overview

MosQuit addresses a real problem faced by under-resourced health departments: **How do you decide which neighborhoods to protect when you can't save everyone?**

Instead of just predicting risk, MosQuit uses four AI agents with competing priorities to:
- Debate trade-offs transparently
- Optimize resource allocation under constraints
- Explain every decision
- Simulate outcomes to show consequences

### The Agents

1. **Epidemiologist** - Minimize infections, aggressive intervention
2. **Budget Officer** - Maximize ROI, minimize costs
3. **Operations Manager** - Ensure feasibility, logistics constraints
4. **Public Risk Advisor** - Minimize panic, protect visible areas

They argue, disagree, and compromise to create an intervention plan you can trust.

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Anthropic API key** (get one at https://console.anthropic.com/)
- **Mapbox access token** (get one at https://account.mapbox.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MosQuit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env.local` in the root directory:
   ```env
   # Required: Anthropic API
   ANTHROPIC_API_KEY=sk-ant-...

   # Required: Mapbox for map rendering
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

   # Optional: Feature flags
   NEXT_PUBLIC_ENABLE_NATURAL_LANGUAGE=true
   NEXT_PUBLIC_ENABLE_WHAT_IF_MODE=true

   # Optional: Demo mode (uses pre-generated responses)
   NEXT_PUBLIC_DEMO_MODE=false
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to http://localhost:3000

---

## Project Structure

```
mosquit/
├── CLAUDE.md              # AI assistant context (read this first!)
├── context.md             # Technical implementation reference
├── README.md              # This file
├── plan.md                # Original hackathon concept
├── project.md             # Original system specification
│
├── src/
│   ├── app/
│   │   ├── page.tsx       # Main demo page
│   │   └── api/agents/    # Claude API endpoints
│   │
│   ├── components/
│   │   ├── Map/           # Map visualization components
│   │   ├── Agents/        # Agent debate UI components
│   │   ├── Controls/      # Resource sliders & simulation controls
│   │   └── Explainability/# Reasoning panels
│   │
│   ├── lib/
│   │   ├── agents/        # Agent orchestration & prompts
│   │   ├── simulation/    # Outbreak simulation engine
│   │   ├── city/          # Zone definitions & risk calculation
│   │   └── utils/         # API client & helpers
│   │
│   └── types/             # TypeScript interfaces
│
└── public/
    └── city-data/         # Zone GeoJSON data
```

---

## Development Workflow

### Core Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code (if Prettier is installed)
npm run format
```

### Recommended Development Flow

1. **Read the documentation**
   - Start with `CLAUDE.md` for high-level context
   - Refer to `context.md` for implementation details

2. **Work in feature branches**
   ```bash
   git checkout -b feature/agent-debate
   # Make changes
   git commit -m "Add epidemiologist agent prompt"
   git push origin feature/agent-debate
   ```

3. **Daily integration checkpoints**
   - End of each day: merge working code to main
   - Verify full flow still works end-to-end

4. **Test the demo flow**
   - Can you complete the 3-minute demo without crashing?
   - Does it look impressive?

---

## Features

### Core Features (Must Have)

- ✅ **Multi-Agent Debate** - Watch 4 agents argue in real-time with streaming responses
- ✅ **Interactive Map** - Animated heatmap showing risk zones and infection spread
- ✅ **Simulation Engine** - Day-by-day outbreak evolution with play/pause controls
- ✅ **Explainability** - Every decision explained with visible trade-offs

### Advanced Features (Should Have)

- ⬜ **"What-If" Comparison** - Split-screen: AI plan vs. user's alternative
- ⬜ **Natural Language Input** - "Lots of mosquitoes near school" → adjusted risk
- ⬜ **Agent Influence Sliders** - Adjust agent priorities dynamically

### Optional Features (Nice to Have)

- ⬜ **Preset Scenarios** - Demo-ready outbreak scenarios
- ⬜ **Outcome Export** - Download results as JSON/CSV
- ⬜ **Mobile Optimization** - Responsive design for tablets

---

## Usage

### 1. Set Constraints

Use the sliders to set resource constraints:
- **Teams:** Number of fumigation teams available (1-6)
- **Budget:** Total budget in dollars ($10k - $50k)
- **Time Window:** Days to deploy interventions (24h - 72h)

### 2. Generate Plan

Click **"Generate Plan"** to:
1. Watch 4 agents analyze the outbreak independently (30 seconds)
2. See them debate and challenge each other's proposals
3. Get a unified consensus plan with trade-offs documented

### 3. Review Recommendations

See which zones are recommended for fumigation:
- **Map highlights** show selected zones
- **Reasoning panels** explain why each zone
- **Trade-offs view** shows what was sacrificed

### 4. Run Simulation

Click **"Play Simulation"** to:
1. Watch the 7-day outbreak evolution
2. See infection spread between zones
3. Observe intervention effects
4. Compare outcomes vs. no action

### 5. Challenge the AI (Optional)

Use **"What-If" mode** to:
- Select your own zones manually
- Run parallel simulations (AI vs. You)
- Compare infection counts and costs
- See who saved more people

---

## API Usage

### Anthropic API

The project uses Claude Opus 4.7 with:

- **Extended Thinking** - Agents show internal reasoning
- **Prompt Caching** - Zone data cached across all 4 agents (4× efficiency)
- **Structured Outputs** - JSON mode for reliable parsing
- **Streaming** - Real-time debate visualization

**Estimated costs per demo run:** ~$0.50 (with caching)

### Mapbox API

Used for map rendering:

- Heatmap layers (risk visualization)
- Zone polygons (city grid)
- Infection animations (ripple effects)

**Free tier:** 50,000 loads/month (enough for hackathon)

---

## Testing

### Manual Testing Checklist

Before demo day, verify:

- [ ] Can complete full 3-minute demo flow
- [ ] All 4 agents generate distinct proposals
- [ ] Map renders correctly on target device
- [ ] Simulation runs smoothly for 7 days
- [ ] No console errors in production build
- [ ] Fallback responses work if API fails
- [ ] Mobile/tablet layout is acceptable

### Edge Cases to Test

- [ ] What if all zones are high risk?
- [ ] What if budget is $0?
- [ ] What if only 1 team available?
- [ ] What if Claude API is slow/down?
- [ ] What if map doesn't load?

### Demo Rehearsal

Practice the 3-minute demo at least 3 times:

1. **Day 4 PM** - First rehearsal (identify gaps)
2. **Day 5 PM** - Second rehearsal (smooth rough edges)
3. **Day 6 AM** - Final rehearsal (lock in script)

---

## Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard**
   - Go to Project Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_MAPBOX_TOKEN`

5. **Verify deployment**
   - Visit the deployed URL
   - Test the full demo flow
   - Check console for errors

### Alternative: Run Locally at Demo

If deployment fails:

1. Build production version locally:
   ```bash
   npm run build
   npm run start
   ```

2. Screen-share during demo presentation

3. Have backup video ready (record in advance)

---

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: TypeScript errors**
```bash
# Check types
npm run type-check
```

### API Errors

**Error: 401 Unauthorized (Claude API)**
- Check that `ANTHROPIC_API_KEY` is set correctly in `.env.local`
- Verify key is active at https://console.anthropic.com/

**Error: 429 Rate Limited (Claude API)**
- You're making too many requests
- Add delays between API calls
- Use fallback responses for demo

**Error: Mapbox map not rendering**
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set
- Verify token is active at https://account.mapbox.com/
- Check browser console for specific Mapbox errors

### Performance Issues

**Simulation is slow**
- Reduce number of zones (use 15-20 instead of 30)
- Simplify spread algorithm
- Add debouncing to state updates

**Map is laggy**
- Reduce heatmap intensity
- Use simpler zone geometries
- Disable infection animations during fast playback

---

## Team Collaboration

### Git Workflow

1. **Main branch** - Always deployable, protected
2. **Feature branches** - `feature/agent-debate`, `feature/map-viz`, etc.
3. **Commit messages** - Clear and descriptive
4. **Pull requests** - Quick review before merge

### Communication

- **Daily standups** - 15 min alignment
- **Blockers** - Announce immediately
- **Integration** - End-of-day checkpoint

### Role Assignments

Suggested split for 2-3 person team:

**Person A (Frontend Lead)**
- Map integration
- UI components
- Styling and animations

**Person B (AI/Backend Lead)**
- Agent prompts and orchestration
- Claude API integration
- Debate flow logic

**Person C (Full-Stack)**
- Simulation engine
- Integration between frontend/backend
- Polish and optimization

---

## 3-Minute Demo Script

### [0:00-0:20] The Problem

> "Imagine you're a health official in Manila. Dengue cases are rising. You have 4 fumigation teams, $30k budget, and 48 hours. Which neighborhoods do you treat first? Get it wrong, and hundreds get sick. This is MosQuit - an AI command center that makes this decision for you."

**Action:** Show map with risk zones

---

### [0:20-1:00] The Debate

> "Watch as 4 AI agents with different priorities analyze the same data and argue. The Epidemiologist wants aggressive intervention. The Budget Agent wants cost efficiency. They disagree on Zone 5 - is it worth the $12k? Watch them debate and compromise in real-time."

**Action:** Click "Generate Plan", show streaming agent responses

---

### [1:00-1:40] The Simulation

> "Here's their final plan: 3 zones, 4 teams, $28k spent. Let's see what happens over the next 7 days."

**Action:** Click "Play", watch infections spread (fumigated zones stay green)

> "120 total infections. Not bad. But what if we had no AI?"

---

### [1:40-2:20] The What-If

> "Let's compare. Same outbreak, no intervention."

**Action:** Split screen, run comparison

> "340 infections. The AI's plan just prevented 220 cases. But here's the cool part - you can challenge it. Judge, pick any 3 zones you want."

**Action:** Judge selects zones, run simulation

> "Interesting! Your plan resulted in 180 infections - better than nothing, but the AI's optimization saved 60 more people by accounting for spread patterns."

---

### [2:20-2:40] The Why

> "Every decision is explained. Click any zone, see the reasoning. Why Zone 5? High humidity, dense population, adjacent to active cases. Why not Zone 3? Lower spread probability, can wait until Day 3. This isn't a black box - it's transparent, adaptive, and could run on any city's infrastructure today."

**Action:** Click zones, show reasoning panels

---

### [2:40-3:00] The Impact

> "This is decision support for the 3 billion people living in dengue-risk areas. Health departments don't need more predictions - they need help making impossible choices with limited resources. That's MosQuit."

**End with:** Live demo URL on screen

---

## FAQ

### Why Next.js instead of pure React?

- Built-in API routes (no separate backend needed)
- Server-side rendering for better performance
- Easy Vercel deployment (zero config)
- Better developer experience

### Why Mapbox instead of Google Maps?

- Better animation support
- Heatmap layers built-in
- More customizable
- Free tier is generous

### Why rule-based simulation instead of ML?

- More transparent (can explain every decision)
- Easier to tune for demo effect
- No training data needed
- Faster to implement

### Why 4 agents specifically?

- Enough diversity to create debate
- Not too many to overwhelm UI
- Represents real stakeholder groups
- Fits nicely in 2×2 grid layout

### What if Claude API goes down during demo?

We have fallback responses pre-generated for 3 demo scenarios. The demo will still work (using cached responses) even if API is unavailable.

### Can this work for diseases other than dengue?

Yes! The system is agnostic to disease type. The simulation parameters would need adjustment (transmission rate, recovery rate, etc.), but the core architecture works for any vector-borne disease.

---

## Resources

### Documentation

- [CLAUDE.md](./CLAUDE.md) - High-level project context
- [context.md](./context.md) - Technical implementation details
- [plan.md](./plan.md) - Original hackathon concept
- [project.md](./project.md) - System specification

### External Links

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Hackathon Resources

- [Anthropic Opus 4.7 Hackathon](https://anthropic.com/hackathon) (if available)
- Judging criteria: Impact (30%) + Demo (25%) + AI Use (20%) + Depth (20%)

---

## Contributing

This is a hackathon project with tight deadlines. To contribute:

1. Read `CLAUDE.md` first (understand the vision)
2. Check `context.md` for implementation patterns
3. Create a feature branch
4. Keep changes focused and testable
5. Merge frequently (daily integration)

---

## License

MIT (or whatever license the team chooses)

---

## Acknowledgments

- **Anthropic** for Claude Opus 4.7 and the hackathon
- **Mapbox** for mapping infrastructure
- **Vercel** for hosting platform
- Health workers everywhere who make these impossible decisions daily

---

## Support

For questions or issues:

1. Check existing documentation (CLAUDE.md, context.md)
2. Search issues in the repository
3. Ask in team chat
4. Create new issue with detailed description

---

**Built with ❤️ for the Anthropic Opus 4.7 Hackathon**

*Let's help cities make smarter decisions to save lives.*
