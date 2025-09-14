<div align="center">
<img width="1200" height="475" alt="GHBanner" src="/vendor/0aa67016-6eaf-458a-adb2-6e31a0763ed6-2c20a08a" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

FIRST - Move all the CDN links in local my project. 
1. All external URLs (scripts, styles, images, fonts) - find & vendor everything automatically
2. Download all external URLs into public/vendor and automatically replace references across the repo - remove SRI attributes and rewrite url() in CSS

View your app in AI Studio: /vendor/
11z7WgqCtAQYOdZfrr1WE-jHlykRLcDQi-d8749cd4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
