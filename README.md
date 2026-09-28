# Reproduction: `notFound()` returns HTTP 200 instead of 404 when a sibling route has `dynamicParams: true`

Verified on `next@16.3.6` (latest stable) and `next@canary` (16.4.0-canary.50).

## The bug

`app/brands/[brand]/page.tsx` has `dynamicParams = false` and calls `notFound()`
for any `brand` not returned by its own `generateStaticParams()`. Per the
[ISR docs](https://nextjs.org/docs/app/guides/incremental-static-regeneration),
requesting an unknown param should return **404**.

It does — **unless** any other route anywhere in the app has
`dynamicParams = true`. Here, `app/[category]/[slug]/page.tsx` does. Its mere
existence in the build (it never has to be requested) flips
`/brands/<unknown>` from a correct 404 to an incorrect **200**, still
rendering the correct `not-found.tsx` content — only the status code is
wrong.

A root `app/loading.tsx` is also required to trigger it; without one,
`/brands/<unknown>` is unaffected.

## Reproduce

```bash
npm install
npm run build
npm run start
```

Then:

```bash
# BUG: should be 404, is 200 (not-found.tsx content, wrong status)
curl -I http://localhost:3000/brands/does-not-exist

# BUG: should be 404, is 200 — the *other* dynamicParams:true route itself
curl -I http://localhost:3000/laptops/does-not-exist

# CONTROL: correctly 404 — a single top-level dynamic segment with no
# sibling dynamicParams:true route anywhere in the app
curl -I http://localhost:3000/does-not-exist

# Sanity check: known params still 200 as expected
curl -I http://localhost:3000/brands/apple
```

## Isolating the trigger

Each of these alone is **not** sufficient — only the full combination
reproduces it:

- `app/brands/[brand]/page.tsx` alone (`dynamicParams: false` +
  `generateStaticParams` + `notFound()`), with no sibling dynamic route and
  no `loading.tsx` → correctly 404.
- Adding a root `app/loading.tsx` alone → still correctly 404.
- Adding the sibling `app/[category]/[slug]/page.tsx` with
  `dynamicParams: false` (matching `brands/[brand]`'s own setting) → still
  correctly 404.
- Only when the sibling route has `dynamicParams: true` **and** a root
  `app/loading.tsx` exists does `/brands/<unknown>` start returning 200.

`revalidate` and `generateMetadata` were both tested and are **not**
required to reproduce this — removing them does not change the result.

## Route tree

```
app/
├── layout.tsx
├── loading.tsx                  # required for the bug
├── not-found.tsx
├── page.tsx                     # links to all four test paths
├── [category]/
│   ├── page.tsx                 # dynamicParams: false — the control, always correct
│   └── [slug]/
│       └── page.tsx             # dynamicParams: true  — the trigger; also affected itself
└── brands/
    └── [brand]/
        └── page.tsx             # dynamicParams: false — the reported bug
```
