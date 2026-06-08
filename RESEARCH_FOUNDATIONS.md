# Research Foundations
## Scientific Basis for the Forgetting Curve, Velocity, and Spaced Repetition in Learngraph

---

## Overview

This document outlines the academic research that informed the memory science implementation in Learngraph's backend. Three core cognitive mechanisms are implemented: the **Ebbinghaus Forgetting Curve** (exponential retention decay), **Learning Velocity** (rate of mastery change as a momentum signal), and **Streak-Driven Half-Life Progression** (spaced repetition interval expansion based on the SM-2 algorithm). A fourth mechanism — **Item Response Theory (IRT)** — governs dynamic question difficulty calibration.

---

## 1. The Ebbinghaus Forgetting Curve

### Original Research

**Hermann Ebbinghaus**, *Über das Gedächtnis (Memory: A Contribution to Experimental Psychology)*, 1885

Between 1880 and 1885, Ebbinghaus conducted systematic self-experiments using nonsense syllables (consonant-vowel-consonant trigrams like "WID" and "ZOF"). He measured **savings** — the percentage reduction in time needed to re-learn material compared to the first learning session — at intervals from 20 minutes to 31 days.

His original mathematical model:

```
b = 100k / (log(t))^c + k
where c = 1.25, k = 1.84, t = time in minutes
```

The two foundational findings from this work that remain valid today:
1. Memory decays **exponentially** — approximately 70% of newly learned information is lost within 24 hours without review
2. Forgetting is fastest immediately after learning, then the rate of loss decelerates over time

### Modern Simplified Formula

The field converged on a simpler exponential decay model:

```
R = e^(-t / S)
```

- `R` = retention (0.0 to 1.0, representing probability of recall)
- `t` = time elapsed since last review
- `S` = memory stability (the "half-life" — time at which retention is ~63%)

This is the exact formula implemented in Learngraph.

### Modern Replication

**Jaap M. J. Murre & Joeri Dros**, *"Replication and Analysis of Ebbinghaus' Forgetting Curve"*, PLOS ONE, 2015
[https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0120644](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0120644)

This was the first rigorous modern replication of Ebbinghaus' experiment. A single subject spent 70 hours across retention intervals from 20 minutes to 31 days learning and re-learning 70 lists of 104 Dutch nonsense syllables. Key findings:

- The forgetting curve was successfully replicated with results remarkably similar to the 1885 data
- A **24-hour memory boost** was observed — savings after 1 day were slightly higher than predicted by the pure exponential curve, likely due to sleep consolidation
- The study validated that the exponential decay model generalizes beyond Ebbinghaus' original single-subject design

**Implication for Learngraph:** Validates the `computeRetention()` function and confirms that 1 day is a natural starting half-life for the first review cycle.

### Wikipedia Reference

[https://en.wikipedia.org/wiki/Forgetting_curve](https://en.wikipedia.org/wiki/Forgetting_curve)

---

## 2. Spaced Repetition and the SM-2 Algorithm (Streak → Half-Life Progression)

### Original Research

**Piotr A. Wozniak**, *"Optimization of Learning"*, Master's Thesis, University of Technology in Poznan, 1990
[https://www-beta.supermemo.com/archives1990-2015/english/ol/sm2](https://www-beta.supermemo.com/archives1990-2015/english/ol/sm2)

Wozniak developed the **SuperMemo 2 (SM-2)** algorithm between 1985 and 1987, publishing it openly in his 1990 thesis. SM-2 is the most widely adopted spaced repetition algorithm in history — used in Anki, Mnemosyne, and hundreds of other tools. In the first year of use on 10,255 English vocabulary items (~41 min/day), Wozniak achieved a **92% retention rate**.

The core insight of SM-2: each item has its own **ease factor** that starts at 2.5 and is adjusted based on answer quality. The review interval grows multiplicatively:

```
I(1) = 1 day
I(2) = 6 days
I(n) = I(n-1) × EaseFactor      (for n > 2)

EF = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
EF_min = 1.3
```

Where `q` is the grade (0–5). Any answer below grade 3 resets the interval to day 1.

**Implication for Learngraph:** The `consecutiveCorrect` streak directly mirrors SM-2's repetition counter, and `HALF_LIFE_PROGRESSION = [1, 3, 7, 14, 30, 60]` is a discrete simplification of SM-2's interval expansion. Rather than a continuous ease factor, Learngraph uses six fixed half-life milestones. A wrong answer resets `halfLifeDays` to 1.0 — exactly as SM-2 resets the interval to 1 day.

### Practical Applications

**C. A. Mace**, *"Psychology of Study"*, 1932 — first to suggest reviewing learned material at spaced intervals.

**H. Pashler, N. Cepeda, J. Wixted, R. Rohrer** (2007): Determined that reviewing 10–20% of the way through the period toward when the information will next be needed is the optimal single-review timing.

---

## 3. Half-Life Regression — Per-Item Trainable Half-Life

### Research

**Burr Settles & Brendan Meeder**, *"A Trainable Spaced Repetition Model for Language Learning"*, Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (ACL), 2016
[https://research.duolingo.com/papers/settles.acl16.pdf](https://research.duolingo.com/papers/settles.acl16.pdf)
[https://aclanthology.org/P16-1174/](https://aclanthology.org/P16-1174/)
[https://github.com/duolingo/halflife-regression](https://github.com/duolingo/halflife-regression)

Developed at **Duolingo**, Half-Life Regression (HLR) is the closest published precedent to Learngraph's memory model. HLR models the probability of recall as:

```
p(recall) = 2^(-t / h)
```

Where `h` is the **half-life** — the time after which there is a 50% probability of forgetting. Unlike SM-2's one-size-fits-all formula, HLR learns `h` per-student per-item via regularized regression on features including:

- Number of correct attempts (`right`)
- Number of wrong attempts (`wrong`)  
- Time elapsed since last practice (`lag`)

Results from 13 million Duolingo practice records:
- **45%+ reduction in recall prediction error** compared to SM-2 and Leitner baselines
- **+12% improvement in daily student engagement** in A/B test

**Implication for Learngraph:** The `halfLifeDays` field in `ConceptMastery` is Learngraph's implementation of HLR's `h`. The key difference: HLR learns `h` continuously from large-scale behavioral data. Learngraph uses the rule-based `HALF_LIFE_PROGRESSION` ladder — a deliberate trade-off appropriate for an early-stage product before sufficient data is available for regression training. The architecture is designed to be replaced with a learned model.

---

## 4. Per-Skill Forgetting Curves (DAS3H)

### Research

**Choffin, Popineau, Bourda, Vie**, *"DAS3H: Modeling Student Learning and Forgetting for Optimally Scheduling Distributed Practice of Skills"*, arXiv, 2019
[https://arxiv.org/pdf/1905.06873](https://arxiv.org/pdf/1905.06873)

DAS3H extends standard spaced repetition by allowing **each skill to have its own independent forgetting curve**. It incorporates the temporal distribution of all past practice on a skill — not just the most recent attempt. Key insight: forgetting rates differ significantly between concepts; a single global decay parameter misrepresents reality.

**Implication for Learngraph:** Each `ConceptMastery` record stores its own `halfLifeDays` value, meaning Concept A for a student might have a half-life of 14 days (mastered repeatedly) while Concept B has 1 day (just introduced or error-prone). This mirrors DAS3H's per-skill model exactly.

---

## 5. Learning Velocity — Rate of Mastery Change

### Research

**LECTOR: LLM-Enhanced Concept-based Test-Oriented Repetition for Adaptive Spaced Learning**, arXiv, 2025
[https://arxiv.org/html/2508.03275v1](https://arxiv.org/html/2508.03275v1)

LECTOR is a modern adaptive learning system that explicitly tracks `learning_speed` as a first-class learner profile dimension:

```
learner_profile = [success_rate, learning_speed, retention, semantic_sensitivity]
```

This directly establishes **learning velocity** (rate of mastery change) as a measurable and actionable metric — not just an observation.

### Additional Support

**Enhancing human learning via spaced repetition optimization**, PNAS / NCBI, 2019
[https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6410796/](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6410796/)

This paper proposed heuristic scheduling algorithms that select the next item to review by **greedily picking the item closest to its maximum learning rate**. A student with a high positive velocity is actively consolidating — different scheduling treatment is warranted than a student with negative velocity (regressing).

**Implication for Learngraph:** `velocity = currentScore - previousScore` captures the direction and magnitude of the most recent learning event. Positive velocity (0 to +1.0) means improving; negative velocity (−1.0 to 0) means regressing. The `velocityFactor = clamp(1 + velocity × 0.2, 0.7, 1.3)` amplifies `effectiveMastery` for improving students and penalizes it for declining ones, allowing the content generation layer to respond faster to sudden drops than the slower exponential decay alone would allow.

---

## 6. Item Response Theory — Dynamic Question Difficulty

### Research

**Lord, F.M.**, *Applications of Item Response Theory to Practical Testing Problems*, 1980

**Birnbaum, A.**, *"Some Latent Trait Models"*, in Lord & Novick, *Statistical Theories of Mental Test Scores*, 1968

IRT models the probability that a student with ability `θ` correctly answers an item with difficulty `b`, discrimination `a`, and guessing `c` as:

```
P(correct | θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
```

In practice, Learngraph uses a simplified empirical version: question difficulty is estimated from the observed pass rate across all students.

**Spaced Repetition and Retrieval Practice: Efficient Learning Mechanisms from a Cognitive Psychology Perspective**, International Journal of Asian Social Science Research, 2024
[https://journals.zeuspress.org/index.php/IJASSR/article/view/425](https://journals.zeuspress.org/index.php/IJASSR/article/view/425)

Meta-analysis (Adesope, 2017) cited here found that retrieval practice improves long-term retention by **30–50%** compared to passive review. Passive review creates an "illusion of mastery" (familiarity memory) while active retrieval builds durable "recollective memory."

**Implication for Learngraph:** `difficulty = 1 - correctRate` (estimated after 5+ attempts). The `discriminationIndex = √(p × (1-p))` is maximized at a 50% pass rate — the questions that best differentiate students who know from those who don't. These are prioritized in question assembly: `ORDER BY discriminationIndex DESC`.

---

## Summary Table

| Mechanism | Research Basis | Paper | What It Drives in Learngraph |
|---|---|---|---|
| Exponential forgetting curve | Ebbinghaus (1885) | *Über das Gedächtnis* | `R = e^(-t/halfLife)` in `computeRetention()` |
| Replication validation | Murre & Dros (2015) | PLOS ONE | Confirms 1-day starting half-life; sleep boost |
| Streak → interval growth | Wozniak SM-2 (1990) | Optimization of Learning | `consecutiveCorrect` → `HALF_LIFE_PROGRESSION` |
| Per-item half-life | Settles & Meeder (2016) | ACL / Duolingo HLR | `halfLifeDays` field per student-concept pair |
| Per-skill forgetting curves | Choffin et al. (2019) | DAS3H arXiv | Independent `halfLifeDays` per concept |
| Learning velocity | LECTOR (2025) | arXiv | `velocity` field + `velocityFactor` in `getEffectiveMastery()` |
| Optimal scheduling rate | NCBI (2019) | Pnas / NCBI PMC | Velocity-adjusted mastery informs review priority |
| Question difficulty calibration | Lord (1980), Birnbaum (1968) | IRT textbooks | `difficulty = 1 - correctRate`, `discriminationIndex` |
| Retrieval over passive review | Adesope meta-analysis (2017) | IJASSR 2024 | Active MCQ format; no passive re-reading |

---

## References

1. Ebbinghaus, H. (1885). *Über das Gedächtnis*. Leipzig: Duncker & Humblot. English translation: *Memory: A Contribution to Experimental Psychology* (1913).

2. Murre, J.M.J. & Dros, J. (2015). Replication and Analysis of Ebbinghaus' Forgetting Curve. *PLOS ONE*, 10(7), e0120644.
   [https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0120644](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0120644)

3. Wozniak, P.A. (1990). *Optimization of Learning*. Master's Thesis, University of Technology in Poznan.
   Algorithm page: [https://www-beta.supermemo.com/archives1990-2015/english/ol/sm2](https://www-beta.supermemo.com/archives1990-2015/english/ol/sm2)

4. Settles, B. & Meeder, B. (2016). A Trainable Spaced Repetition Model for Language Learning. *Proceedings of the 54th Annual Meeting of the ACL*, 1848–1858.
   [https://research.duolingo.com/papers/settles.acl16.pdf](https://research.duolingo.com/papers/settles.acl16.pdf)
   [https://aclanthology.org/P16-1174/](https://aclanthology.org/P16-1174/)

5. Choffin, B., Popineau, F., Bourda, Y., & Vie, J.J. (2019). DAS3H: Modeling Student Learning and Forgetting for Optimally Scheduling Distributed Practice of Skills. *arXiv preprint arXiv:1905.06873*.
   [https://arxiv.org/pdf/1905.06873](https://arxiv.org/pdf/1905.06873)

6. Tabibian, B., et al. (2019). Enhancing human learning via spaced repetition optimization. *Proceedings of the National Academy of Sciences*, 116(10), 3988–3993.
   [https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6410796/](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6410796/)

7. LECTOR: LLM-Enhanced Concept-based Test-Oriented Repetition for Adaptive Spaced Learning. (2025). *arXiv preprint arXiv:2508.03275*.
   [https://arxiv.org/html/2508.03275v1](https://arxiv.org/html/2508.03275v1)

8. Spaced Repetition and Retrieval Practice: Efficient Learning Mechanisms from a Cognitive Psychology Perspective. (2024). *International Journal of Asian Social Science Research*.
   [https://journals.zeuspress.org/index.php/IJASSR/article/view/425](https://journals.zeuspress.org/index.php/IJASSR/article/view/425)

9. Forgetting Curve — Wikipedia.
   [https://en.wikipedia.org/wiki/Forgetting_curve](https://en.wikipedia.org/wiki/Forgetting_curve)

10. Duolingo Half-Life Regression — GitHub.
    [https://github.com/duolingo/halflife-regression](https://github.com/duolingo/halflife-regression)
