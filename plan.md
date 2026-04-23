

# 🦟 Full Concept: MosQuit AI-Powered Vector Control Decision System

## 1. The Real Problem (framed correctly)

Cities don’t fail to control dengue or malaria because they lack maps.

They fail because:

* they have **limited fumigation teams**
* limited budget
* incomplete and delayed data
* and no system to decide **where to act first**

So even if they *know* risk areas, they:

* act too late
* spread resources too thin
* or prioritize incorrectly

Organizations like World Health Organization publish risk guidelines, but they don’t provide **real-time, localized decision engines**.
---

## 2. The Core Idea

Instead of predicting risk…

We build a system that answers:

> **“Given limited resources, where should we intervene *tomorrow* to minimize expected infections?”**

This is not just AI prediction.

It’s:

* **prediction + optimization + explainability**

---

## 3. System Overview (what you actually build)

### A. Risk Estimation Layer (yes, but simplified)

We combine:

* satellite proxies (vegetation, water likelihood—not perfect detection)
* humidity / temperature trends
* population density
* historical outbreak patterns (even simulated)

Output:

> A probabilistic **risk heatmap**

Not perfect. Doesn’t need to be.

---

### B. Intervention Simulation Layer (this is the differentiator)

This is where most ideas fail—and where yours wins.

For each zone, simulate:

* what happens if you **fumigate**
* what happens if you **do nothing**

Estimate:

* infection spread probability
* impact decay over time
* secondary spread to nearby zones

👉 Now your system doesn’t just *see risk*, it *understands consequences*

---

### C. Resource Optimization Engine 

Inputs:

* number of fumigation teams
* budget constraint
* time window (e.g. next 48 hours)

The system outputs:

* **ranked list of zones to intervene**
* optimized route / allocation
* expected reduction in cases

This turns the project into a:

> **decision-making AI under constraints**

---

### D. Explainability Layer (use LLMs here)

Using something like Claude/Opus:

For each recommendation:

* “Why this zone?”
* “Why now?”
* “What happens if we skip it?”

Example output:

> “Zone A has high humidity, dense population, and is adjacent to a recent cluster. Delaying intervention increases expected infections by 27%.”

This is huge for:

* policymakers
* non-technical judges

---

## 4. The Demo 

You don’t win with code—you win with **interaction + clarity**

### Your interface should show:

#### 🗺️ Live Map

* heatmap of risk zones
* color-coded severity

#### 🎛️ Controls

* slider: number of available teams
* slider: budget
* toggle: intervene / don’t intervene

#### ⚡ Output

* recommended zones (highlighted)
* projected infection reduction
* dynamic changes when sliders move

---

### 🔥 The killer feature

A **“What if?” simulator**

Example:

* “What if we only have 3 teams instead of 6?”
* “What if we delay 2 days?”

👉 The map updates instantly

This creates a *wow moment*

---

## 5. Data Strategy (be realistic)

You won’t have real government data. That’s fine.

Use:

* open climate datasets
* synthetic outbreak data
* simple heuristics

Even tools like Google Earth Engine can help mock inputs.

Judges care more about:

> **how you think**, not perfect accuracy

---

## 6. Why this is actually strong

Now the idea has:

### ✔ Clear differentiation

You’re not “another prediction model”

You’re:

> **a constrained optimization + decision intelligence system**

---

### ✔ Real-world relevance

This is something municipalities could actually use

Especially in regions like:

* Latin America
* Southeast Asia

---

### ✔ Technical depth (important for judges)

We touch:

* geospatial analysis
* probabilistic modeling
* optimization algorithms
* LLM reasoning

That’s a strong stack.

---

### ✔ Demo potential

Interactive + visual + intuitive

Huge advantage.

---

## 7. Where you should be careful

I’ll still push back on weak spots:

### ❌ Don’t claim “we detect stagnant water precisely”

That’s extremely hard even for NASA level systems.

Instead:

> “we estimate environmental suitability for mosquito breeding”

---

### ❌ Don’t oversell accuracy

Say:

> “decision-support tool under uncertainty”

That sounds smarter and more honest.

---

### ❌ Don’t go global

Pick:

* one region
* one disease (likely dengue)

Focus wins.

---

## 8 Problem Statements

#1: Build From What You Know

Start from a real problem in a real place: your work,
your community, a field you're close to. The
process that takes weeks and should take hours.
The thing someone you know still does by hand.
Domain expertise beats credentials - show us the
thing only you'd know to build.

Looks like: the process that takes weeks and
should take hours. The decision was made on gut
because the data's too scattered to use. The thing
someone you know still does by hand.

#2: Build For What's Next



Start from something that doesn't exist yet: a new
way to work, learn, or make that only makes sense
now that the tools have changed. An interface
without a name. A workflow from a few years out.
The best projects here are easier to demo than to
explain.

Looks like: an interface that doesn't have a name
yet. A workflow that changes how you do the thing,
not just how fast. A first draft of how this will work
in a few years when Claude is even more capable.


## 8 Judging Criteria

Impact (30%)

. What's the real-world potential here?
. Who benefits, and how much does it matter?
. Could this actually become something people use?
. Does it fit into one of the problem statements listed
above?

Demo (25%)

. Is this a working, impressive demo?
. Does it hold up live?
. Is it genuinely cool to watch?

Opus 4.7 Use (20%)

. How creatively did this team use Opus 4.7?
. Did they go beyond a basic integration?
. Did they surface capabilities that surprised even
us?

Depth & Execution (20%)

. Did the team push past their first idea?
. Is the engineering sound and thoughtfully refined
. Does this feel like something that was wrestled with
- real craft, not just a quick hack?

## 9 Special Prizes

### Most Creative Opus 4.7 Exploration: $5,000 in Claude API Credits

For the project that treated Opus 4.7 as a creative medium, not just a tool. We're looking for the project with a
voice, a point of view - something expressive, playful, strange, or alive. The one that made us feel something.

### The "Keep Thinking" Prize: $5,000 in Claude API Credits

For the project that didn't stop at the first idea - and landed somewhere nobody saw coming. We're looking
for the team that found a real-world problem nobody thought to point Claude at. The one that changes how we
think about where this technology belongs.

### Best use of Claude Managed Agents: $5,000 in Claude API Credits

For the team that leveraged the Claude platform the best. We're looking for the project that best uses Managed
Agents to hand off meaningful, long-running tasks - not just a demo, but something you'd actually ship.