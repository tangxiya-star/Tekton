# Claude Fable 5 Build Day Participant Guide 👩‍💻👨‍💻
Welcome to the Claude Fable 5 Build Day! 👋 We’re thrilled to have you on board.

This guide is your all-in-one resource for the event, including schedule, rules, technical resources, problem statements, judging information, and more. Please read this carefully; most answers can be found here.

## **1️⃣ Your Goal – Hackathon Problem Statement**

### **Problem Statement**
Fable 5 is the first Mythos-class model we've made safe for general use (see [launch blog](https://www.anthropic.com/news/claude-fable-5-mythos-5), [docs](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)). Its capabilities exceed those of any model we've ever made generally available: state-of-the-art on nearly all tested benchmarks, with exceptional performance in software engineering, knowledge work, and vision. And the more complex the task, the larger Fable 5's lead over other models. What sets it apart most is long-horizon, difficult, autonomous work: planning, building, and validating its own work for a day or more at a time.

### **The challenge**
Build something new, such as a complete, working app from a standing start. Or bring your product and point the model at the biggest problem it's facing. Either way: run it with Claude Fable 5, brief it well, then interact minimally. Feel free to leverage[dynamic workflows](https://code.claude.com/docs/en/workflows) or other orchestration features, and let Fable 5 carry the work. You'll get credits to cover tokens for the entire Build Day.

1. **Start with a clear brief.** What's the problem, who is it for, and what does done look like? From watching early teams work with Fable 5: the model is particularly strong with autonomous tasks. The model excels at running against a goal, checking its own work, correcting, and continuing until the goal is met. Your challenge is to build the environment that makes that possible.
2. **Kick it off.** Spend time briefing the model: point it at your repo, answer its questions, set up your goal and rubric. Then let it go.
3. **Ship.** Deploy to a live URL and submit it with your brief, your rubric, and the session log.

### **Pick a problem worth solving**
A few thought starters:

- Ship your product somewhere you've never shipped: mobile, desktop, CLI — in one run.
- The tool San Francisco or a nonprofit you love deserves, built on the public data they already publish.
- A claims, loan-servicing, or back-office workflow that takes weeks today.
- The redesign your product has needed for a year.
- The swarm: point a team of agents at your real backlog, ship the release, and demo what's new.

**One note: **steer clear of builds in cybersecurity or the life sciences, especially research biology. Fable 5's safeguards route requests in those areas to Claude Opus 4.8 instead, a highly capable model in its own right, but you may lose Fable’s long-horizon edge that this challenge is built around. 

### **Scoring Criteria**

- **Impact (35%): **How useful is what they built? Who is it for, and how much does it matter to them? Is the output itself high quality (something someone would find useful)?
- **Demo (35%): **Is it a working and impressive demo? Does it hold up live? Does the demo prove the impact?
- **Autonomy (15%): **Judged from the session log. How many times did humans intervene mid-task, and were interventions course-corrections or new information? When something broke, did the model catch it itself (via a test, a check, a verifier), or did a human point it out? Did it run long stretches without steering?
- **Orchestration (15%): **Judged from the submitted brief, rubric, and any workflow scripts (not from which features were used). Is this orchestration simple and repeatable? Is "done" verifiable by the model without a human: a test suite, a responding URL, a rubric file it can grade against? Could another team rerun the setup tomorrow on a new problem?

A few ideas for how to design your loops:

- **Self-correction loops.** Use /goal in Claude Code to give Fable 5 a target it can hillclimb on. Let it run, read its own results, and decide the next experiment. Don't decide for it.
- **Verifier sub-agents.** Models struggle with self-critique on their own outputs. A verifier sub-agent tends to outperform self-critique with Fable 5, because grading happens in an independent context window. Have a fresh agent grade the work against your rubric before the builder is allowed to stop.
- **Dynamic workflows. **When the loop is bigger than one conversation can coordinate, move it into code. A dynamic workflow is a JavaScript script that orchestrates subagents at scale. Claude writes the script for the task you describe, and a runtime executes it in the background while your session stays free. The script holds the loop, the branching, and the intermediate results, so Claude's context holds only the final verified answer, and it can apply repeatable quality patterns, like independent agents adversarially reviewing each other's findings before they're reported. Ask for the workflow in your own words, and be specific about the steps: what fans out, when verification runs, what gates completion. In early testing with Fable 5, explicit step-by-step workflow requests (a code review pass every N steps, /goal for the target, CI feedback wired in) outperformed one-word triggers. If a run works, save it: your orchestration becomes a command you can rerun, and a great artifact for the judges.
- **Memory as the outer loop. **Fable 5 stays focused across millions of tokens and improves its outputs using its own notes. Give it persistent file-based memory and push it through the full progression: fail, investigate, verify, distill, consult, so it turns mistakes into general rules instead of re-deriving them.

**Resources:**

- [A harness for every task: dynamic workflows in Claude Code](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)
- [Designing loops with Fable](https://x.com/RLanceMartin/status/2064397389189071163)

## **2️⃣ Getting Ready – Location & Arrival**
**📍Location: **Shack15 (Ferry Building, 1, Suite 201, San Francisco, CA 94111)

### **Arrival Instructions**
Due to high demand and limited capacity, please arrive at 9:00 AM when doors open. Bring your ID for check-in on the second floor. You will receive a name tag and a wristband which must be worn at all times in the venue.

### Wi-Fi Access
**SSID: **Fable 5**Password:** problemsolvers

### Getting Here

- **Public Transit (recommended): **Take BART or Muni to the Embarcadero station — it's a 2-minute walk from there. The Ferry Building is also served by the F-Market streetcar and several Muni bus lines. SF-bound ferries from Oakland, Alameda, and Sausalito arrive right at the Ferry Building.
- **Rideshare & Waymo: **Set your destination to "Ferry Building." Drop-off and pick-up are on The Embarcadero, directly in front of the building.
- **Parking: **Limited paid parking is available in the Ferry Building garage (entrance on Washington St), with the Pier 1 lot as the nearest alternative. You can also check [SpotHero](https://spothero.com/) for availability at nearby lots.

*Parking is limited — we strongly recommend taking public transit or rideshare.*

## **3️⃣ Connect with the Community - Discord**
**For Build Day participants: **Join us on Discord to meet other participants, get official updates, begin forming teams:

### Getting Started:

- Join the Claude Discord server here:
- **Please note: **We will assign a custom role to your account so you will be able to see the hackathon specific channels.
- **Introduce yourself: **In #intros, share who you are, the skills you bring, and what project you’re looking to build.
- **Create a Team: **In #team-search, find teammates before the hackathon (maximum team size of four)

### **Key Channels:**

- **#general: **Socialize and meet other hackers.
- **#rules: **On the day rules spanning from registration, product building, and pitching.
- **#announcements: **Official updates and reminders from the CV Team.
- **#intros:** Introduce yourself and what you’re doing to everyone!
- **#team-search: **Find teammates before the hackathon (maximum team size of **four**).
- **#questions:** Ask any general questions to the CV and Anthropic team..
- **#social: **Share your hackathon posts for other participants to reshare/interact!
- **#credit-questions: **Request support from the CV team on obtaining your $500 in Claude API credits.

## **4️⃣ Share Your Builds - Media Guide**

- Pick a post below (we've got X options + a LinkedIn one) — feel free to make it your own.
- Tag [**@claudeai**](https://x.com/claudeai), [**@claudedevs**](https://x.com/claudedevs), and [**@cerebral_valley**](https://x.com/cerebral_valley)
- Attach the "Fable 5 Build Day" graphic to your post — it works on both X and LinkedIn.

![](https://cdn.cerebralvalley.ai/2026-06-12T00:26:42_583Z-Fable%205%20build%20day%20-%20static)
### Posting to Twitter/X
Building with Claude Fable 5 today as part of [@claudeai](https://x.com/claudeai), [@claudedevs](https://x.com/claudedevs), and [@cerebral_valley](https://x.com/cerebral_valley)'s Fable 5 Build Day. 

**

### Posting to LinkedIn
I'm participating in the Live Fable 5 Build Day with Anthropic and Cerebral Valley. It's a one-day challenge to build something with Claude Code and Fable 5 and I’m building **!

## **5️⃣ Schedule Overview**

- **9:00 AM:** Doors Open & Breakfast – *please arrive promptly!*
- **10:00 AM:** Welcome & Kick-Off
- **10:30 AM:** Hackathon Begins
- **1:00 PM:** Lunch
- **5:00 PM:** Submissions Due
- **5:30 PM:** Evening Remarks
- **5:50 PM:** EAP Customer Panel Discussion
- **6:15 PM:** Finalists Announced – *please be respectful as teams demo!*
- **7:45 PM:** Winners Announced
- **7:45–10:00 PM:** Closing Celebration – *beverages and dinner served*
- **10:00 PM:** Doors Close

## **6️⃣ Hackathon Rules**

- **Open Source: **Project** **repositories **must be public**.
- **Team Size: **A **maximum of four** team members per team. Solo participants are allowed.
- **Demo Requirements:** Your demo **must only highlight the specific features, code, and functionality that your team built during the hackathon**. Judges must be able to clearly identify what was created during the event.
- Failure to clearly identify your original contributions will result in immediate disqualification.

- **Technologies & Projects: **You’re welcome to bring in prior projects to augment with the use of Fable 5 during the hackathon.
- **Own Work: **Failure to clearly distinguish your contributions will result in immediate disqualification.
- **Banned Projects:** Projects will be **disqualified** if they: violate legal, ethical, or platform policies, use code, data, or assets you do not have the rights to.

### Prohibited Projects — STRICTLY NO:

- AI Mental Health Advisor
- Basic RAG Applications
- Streamlit Applications
- Image Analyzers
- “AI for Education” Chatbot
- AI Job Application Screener
- AI Nutrition Coach
- Personality Analyzers
- Medical advice bots
- Any project where a dashboard is the main feature
- Sports analyzers or coaches
- Projects will be disqualified if they: violate legal, ethical, or platform policies, use code, data, or assets you do not have the rights to.

## **7️⃣ Claude-Provided Resources**
**$500 in credits, with 24hr expiry.** Link to credits will be provided day of event.

[A harness for every task: dynamic workflows in Claude Code](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)

[Designing loops with Fable](https://x.com/RLanceMartin/status/2064397389189071163)

## **8️⃣ Submission Process**
Teams should submit [**here**](https://cerebralvalley.ai/e/claude-startups-build-day/hackathon/submit) at **5:00 PM sharp**. In the submission form, you will submit a short one-minute demo video. This should be a video highlighting the specific features, code, and functionality that your team built during the hackathon.

*Please double check that your build repository is public, your demo link is accessible, and all team members have been added to the submission page.*

### A Note to Founders/Startups:
We understand that some of you are building with existing products. You're welcome to extend what you may already have built, but the final submission to this hackathon must be an **open source public GitHub repository containing any and all code that you present in your demo **to allow our team and Anthropic's team to review.

This means that your project must be a standalone product or tangential feature that can be extracted into a separate repository and shared with us. The GitHub links will be kept internal to our judging team and never shared publicly.

## **9️⃣ Judging Process**
Judging will take place in two rounds.

**Round One:** Submissions will be reviewed asynchronously by the Anthropic team based on the materials submitted, including your demo video and GitHub repository. Finalist teams will be selected from this review.

**Round Two:** Top 6 teams will present on stage to a panel of judges & all attendees. Each team will have 3 minutes to live demo their project, followed by 1-2 minutes of Q&A. The same criteria as above will be used, though with equal weighting for each category.

**Round 2 Presentation format:** Presentations should be 3 minutes long showcasing what you built. 

We ask that you begin your presentation with the following graphic introducing your team:

*Make a copy, then fill in your team-specific details.*

Any other slides are discouraged - we want to see what you built (code and product on screen), how you built it, and the problem you're solving. 

In your presentation, you should show how you directed Claude and how it verified its own work: walk us through what you gave the model (your brief, rubric, tests, or workflow scripts) and, if you can, the moment it caught and fixed a failure on its own.

## **🔟 Prizes**
**First Place:** $100,000 API credits
**Second Place:** $40,000 API credits
**Third Place:** $10,000 API credits

把这个做成规范md也push进git
