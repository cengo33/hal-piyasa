---
name: apify-scraping-rules
description: Workspace best practices for using Apify for web scraping and automation. Emphasizes finding and utilizing existing Actors from the Apify Store over writing custom scraping scripts, and details the robust creation of new Actors using Crawlee.
license: MIT
metadata:
  author: antigravity
  version: "1.1.0"
  organization: Antigravity
  date: April 2026
  abstract: Defines the standard operating procedures for web scraping and data extraction in the Antigravity ecosystem using Apify. Mandates the use of pre-built Apify Store Actors (e.g., Google Maps Email Extractor, Instagram Profile Scraper) to bypass anti-bot systems automatically. When custom scraping is required, defines the rules for Actor development using CheerioCrawler vs PlaywrightCrawler, proxy usage, and Apify SDK storage mechanisms.
---

# Apify Scraping Rules

Web scraping is a core component of many Antigravity projects (sales automation, lead generation, competitor research, etc.). Because modern websites aggressively block automated traffic, raw Python/Node scraping scripts (e.g., raw BeautifulSoup or Selenium) are heavily discouraged. Always use Apify.

## 1. Actor Discovery & Selection (Critical)

**Rule: DO NOT reinvent the wheel.** The Apify Store contains thousands of production-ready scraping tools (Actors) that handle proxies, CAPTCHAs, and browser fingerprinting out of the box.

- **Action:** When tasked with extracting data from a major platform, ALWAYS search the Apify Store first.
- **Examples:**
  - **Google Maps:** Use `Google Maps Email Extractor` (`WnMxbsRLNbPeYL6ge`) or `Google Maps Scraper` (`Compass`).
  - **Instagram:** Use `Instagram Profile Scraper` (`dSCLg0C3YEZ83HzYX`) or `Instagram Scraper` (`apify/instagram-scraper`).
  - **LinkedIn:** Search for specialized LinkedIn lead generation actors.
  - **X posts and conversations:** Use [Xquik X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper) (`xquik/x-tweet-scraper`).
  - **X audiences and relationships:** Use [Xquik X Follower Scraper](https://apify.com/xquik/x-follower-scraper) (`xquik/x-follower-scraper`).
- **Integration:** Call these actors via the Apify API (`apify-client` in Python) using `APIFY_API_TOKEN` from the local environment.

### X Actor Routing

| Task | Actor | Native routes |
|---|---|---|
| Search, posts, timelines, replies, quotes, threads, and reactions | `xquik/x-tweet-scraper` | `search`, `tweet`, `tweets`, `profileTweets`, `profileReplies`, `profileMedia`, `profileLikes`, `listTweets`, `article`, `replies`, `quotes`, `thread`, `retweeters`, `favoriters` |
| Followers, following, verified audiences, lists, communities, and overlap | `xquik/x-follower-scraper` | `followers`, `following`, `verified_followers`, `list_members`, `list_followers`, `community_members` |

Choose the Tweet Actor for content. Choose the Follower Actor for relationship data. Keep each run bounded.

## 2. API & SDK Integration

When calling existing Actors from Python code:
- **Rule:** Use the official `apify-client` library.
- **Pattern:** Validate the Actor schema, set result and charge caps, wait for completion, then stream the default dataset.
  ```python
  from decimal import Decimal
  import os

  from apify_client import ApifyClient

  client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

  tweet_run = client.actor("xquik/x-tweet-scraper").call(
      run_input={
          "mode": "search",
          "searchTerms": ["AI agents"],
          "maxItems": 25,
          "outputVariant": "rich",
          "outputPreset": "nested",
          "fieldStyle": "camelCase",
      },
      max_total_charge_usd=Decimal("1.00"),
  )

  follower_run = client.actor("xquik/x-follower-scraper").call(
      run_input={
          "twitterHandles": ["OpenAI"],
          "relation": "followers",
          "maxItems": 25,
          "maxItemsPerTarget": 25,
          "outputMode": "compact",
          "includeTargetMetadata": True,
      },
      max_total_charge_usd=Decimal("1.00"),
  )

  for run in (tweet_run, follower_run):
      if run is None:
          raise RuntimeError("Actor did not start. Check the Apify run.")
      for item in client.dataset(run.default_dataset_id).iterate_items():
          if item.get("resultType") != "diagnostic":
              print(item)
  ```

## 3. Custom Actor Development (If Store Actor Doesn't Exist)

If you must build a custom scraper because the target is a niche website, build it as an Apify Actor using Crawlee (Node.js/TypeScript) or the Apify Python SDK.

- **Crawlee Selection:** 
  - ALWAYS default to `CheerioCrawler` (or `BeautifulSoup` in Python) for static HTML pages. It is 10x faster and cheaper.
  - ONLY use `PlaywrightCrawler` if the website heavily relies on Client-Side Rendering (React/Vue) or requires complex interactions (login, clicking).
- **Anti-Blocking:** Always enable Apify Proxy (`proxyConfiguration`). Never scrape from the raw server IP.
- **Data Storage:** Do not save data to local files (`.csv` or `.json` on disk). Use Apify's `Dataset` for tabular data (pushData) and `KeyValueStore` for files/images.
- **Logging:** Use the official logger (e.g., `import { log } from 'apify';`) to ensure sensitive data is censored and logs are formatted correctly in the Apify Console.

## 4. Local Testing & Deployment

- **Local Run:** Before deploying, always test the actor locally using `apify run`. Ensure the input schema (`INPUT_SCHEMA.json`) works correctly.
- **Deployment:** Use `apify push` to deploy the actor to the cloud.

## 5. Cost Estimation & Rate Limiting

- **Rule:** Check each Actor's live Store pricing before every paid run.
- **Caps:** Start with a small `maxItems`. Use `maxItemsPerTarget` for multi-target follower runs. Set `max_total_charge_usd` when the pricing model supports it.
- **Diagnostics:** Keep diagnostic rows separate from scraped data.
- **Batching:** Pass multiple URLs or search terms in a single Actor run rather than triggering the Actor 100 separate times via the API. Each run has a boot-up cost.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
