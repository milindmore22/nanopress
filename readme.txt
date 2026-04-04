=== NanoPress ===
Contributors:      milindmore22
Tags:              ai, translation, summarizer, proofreader, browser-ai
Requires at least: 5.0
Requires PHP:      7.2
Stable tag:        1.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html
Tested up to:      6.9

An experimental WordPress plugin that enhances content management using the browser's built-in AI APIs.

== Description ==

NanoPress is an experimental WordPress plugin that leverages the browser's built-in AI APIs to enhance content management. It provides on-device, privacy-friendly features for translating, summarizing, and proofreading content — no external API keys required.

**Please check [supported browsers](https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs#browser_compatibility) for compatibility.**

**Features:**

* **Content Translation**: Translate post content on the fly using the browser's built-in Translator API, supporting a wide range of languages.
* **Language Detection**: Automatically detect the language of content using the browser's Language Detector API.
* **Content Summarization**: Generate concise summaries of posts using the browser's Summarizer API.
* **Proofreader**: Review and improve post content directly in the editor using the browser's built-in Proofreader API.
* **Customizable Settings**: Enable or disable each feature independently from the NanoPress settings page.
* **Lightweight and Fast**: Runs entirely in the browser — no server-side processing or external API calls.
* **WordPress Playground Support**: Try the plugin instantly in the browser without installation.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/nanopress/` directory, or install the plugin through the WordPress Plugins screen directly.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Go to **Settings > NanoPress** to configure the available features.
4. Use a [supported browser](https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs#browser_compatibility) to take full advantage of the built-in AI APIs.

== Frequently Asked Questions ==

= Which browsers are supported? =

NanoPress relies on browser-native AI APIs (Translator, Language Detector, Summarizer, Proofreader). Currently these APIs are available in Chrome Canary and other Chromium-based browsers with the appropriate flags enabled. Check the [MDN compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs#browser_compatibility) for the latest information.

= Do I need an API key? =

No. All processing happens in the browser using on-device AI models. No external API keys or accounts are required.

= Where do I enable or disable features? =

Go to **Settings > NanoPress** in the WordPress admin dashboard. You can toggle translation, summarization, and proofreader features individually.

= How do I use the Summarizer? =

Open any post or page in the editor. Click the **Summarize** button to generate a summary of the post content. The summary will appear in the designated output area.

= How do I use the Proofreader? =

Enable the proofreader in **Settings > NanoPress**, then open a post or page. A **NanoPress Proofreader** meta box will appear in the editor sidebar.

= How do I use the Translation feature? =

Enable translation in **Settings > NanoPress** and select your target languages. The plugin will show a translation UI on the frontend for visitors to translate post content.

= Can I try this without installing it? =

Yes! Use [WordPress Playground](https://playground.wordpress.net/?mode=seamless&blueprint-url=https://raw.githubusercontent.com/milindmore22/nanopress/refs/heads/main/blueprints/playground.json) to test the plugin directly in your browser. Note that some WebAssembly features may not be fully supported in Playground.

== Screenshots ==

1. NanoPress settings page showing feature toggles for translation, summarization, and proofreader.
2. Summarizer button in the post editor generating a content summary.
3. Proofreader meta box in the post editor sidebar.
4. Frontend translation UI on a published post.

== Changelog ==

= 1.0 =
* Initial release.
* Added content translation using the browser's Translator API.
* Added language detection using the browser's Language Detector API.
* Added content summarization using the browser's Summarizer API.
* Added proofreader meta box in the post editor using the browser's Proofreader API.
* Added settings page to enable or disable each feature independently.

== Upgrade Notice ==

= 1.0 =
Initial release.
