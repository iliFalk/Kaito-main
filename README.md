

This contains everything you need to run your app locally.

FIRST - Move all the CDN links in local my project. 
1. All external URLs (scripts, styles, images, fonts) - find & vendor everything automatically
2. Download all external URLs into public/vendor and automatically replace references across the repo - remove SRI attributes and rewrite url() in CSS

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
