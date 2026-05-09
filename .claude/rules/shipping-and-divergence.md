# Shipping to production (plain English)

There are **two copies** of the project that can drift apart:

| Where | What it is |
|---|---|
| **Your computer** (local `main`) | The code on this machine. Only you see it. |
| **GitHub** (`origin/main`) | The shared truth. Vercel watches this branch and auto-deploys it to https://www.mdeai.co. |

A change is **only live** after it lands on GitHub's `main`. Code committed locally but not pushed is invisible to users.

## Path from "I wrote code" → "users see it"

1. Write code locally.
2. `git commit` — saved on your computer only.
3. `git push` — uploaded to GitHub (a branch).
4. Open a Pull Request — ask GitHub to merge your branch into `main`.
5. Merge the PR — code lands on GitHub's `main`.
6. Vercel auto-deploys — live on www.mdeai.co (~1–2 min).

Skip any step and **it's not live**.

## When local and GitHub disagree ("diverged")

- *"12 ahead, 46 behind"* means **your computer has 12 commits GitHub doesn't have**, and **GitHub has 46 commits you don't have**.
- You cannot just push — Git refuses, because pushing would erase the 46 commits on GitHub.

**Safest fix when diverged:**
1. Make a fresh branch from GitHub's current `main` (not your local one).
2. Cherry-pick only the commits you want to ship onto that branch.
3. Push the branch and open a PR.
4. Resolve any merge conflicts.
5. Merge the PR.

## Why test counts can look weird

`npm run test` runs the tests **on your current branch**, not main. If `main` has 41 tests and your branch has more, the count differs — that's not a regression.

## Rule of thumb

> If it's not on GitHub's `main`, it's not on production. *"I committed it"* ≠ *"it's deployed."*
