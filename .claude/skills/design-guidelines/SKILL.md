---
name: design-guidelines
description: UI/UX design guidelines for building or reviewing frontend screens in this repo (React + Tailwind CSS + shadcn/ui). Use when creating new pages/components, styling UI, or reviewing a diff for visual quality, accessibility, or responsive behavior.
---

# UI/UX & Design Guidelines for Claude Code

> **저장소 팔레트 참고**: 이 문서는 원본 그대로 보관한 범용 가이드라인입니다. 색상값(슬레이트 다크
> `#0F172A`/`#1E293B`, Interstellar Blue `#3B82F6`)은 **현재 이 저장소의 실제 적용 팔레트와 다릅니다.**
> 이 저장소는 이미 `src/index.css`의 `@theme`에 확정된 다크 테마(배경 `#1d1d1d`, 액센트 그린
> `#8ec21f`, 위험등급 시맨틱 토큰 등 — Figma Make 디자인 스펙 기준, `AGENTS.md` §2 Ground Truth)를
> 쓰고 있으므로, **색상은 이 스킬이 아니라 `src/index.css`의 기존 토큰을 따르세요.** 아래 가이드라인 중
> 컴포넌트 품질/접근성/반응형/마이크로인터랙션 규칙은 그대로 적용됩니다.

## Design Philosophy & System
- **Framework**: React + Tailwind CSS + shadcn/ui
- **Theme**: Dark mode optimized (#0F172A primary background, #1E293B surface)
- **Primary Color**: Interstellar Blue (`#3B82F6`)
- **Typography**: Inter / Pretendard (Korean support)

## Code Quality Rules
1. **Avoid AI Slop/Generic UI**: Do not generate basic white/black layouts without hierarchy. Use subtle borders, backdrop-blur, and deliberate spacing.
2. **Accessibility (WCAG 2.1 AA)**: Ensure all interactive elements have focus states, aria-labels, and a minimum contrast ratio of 4.5:1.
3. **Responsive Design**: Mobile-first architecture using Tailwind breakpoints (`sm:`, `md:`, `lg:`).
4. **Micro-interactions**: Include smooth hover transitions (`transition-all duration-200 ease-in-out`), active feedback, and loading skeletons.
