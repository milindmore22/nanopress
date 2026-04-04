/**
 * NanoPress Translation Script
 * This script handles the translation of page content using the browser's Translation API.
 *
 * @package
 * @since 1.0.0
 */

/* global Translator, LanguageDetector */

// --- DOM Element References ---
const translateDropdown = document.getElementById( 'language-dropdown' );
const statusEl = document.getElementById( 'status' );
const htmlEl = document.documentElement;

// --- Event Listener ---
translateDropdown.addEventListener( 'change', handleTranslation );

/**
 * The main function called when the user selects a language from the translate dropdown.
 * It checks for API support, detects the source language, and orchestrates the translation.
 */
async function handleTranslation() {
	// --- Step 1: Get User Input & Validate ---
	const selectedLanguage = translateDropdown.value;
	if ( ! selectedLanguage ) {
		statusEl.textContent = 'Please select a language.';
		return;
	}

	// Disable UI during processing
	translateDropdown.disabled = true;
	translateDropdown.classList.add( 'opacity-50', 'cursor-not-allowed' );
	statusEl.textContent = 'Initializing...';

	// --- Step 2: Verify Browser and API Support ---
	if ( ! ( 'Translator' in window ) || ! ( 'LanguageDetector' in window ) ) {
		statusEl.innerHTML = `<strong>Translation Failed: </strong> Your browser does not support the required Translation APIs.`;
		return; // Stop execution if APIs are missing
	}

	try {
		// --- Step 3: Detect Source Language ---
		statusEl.textContent = 'Detecting page language...';
		const sourceLanguage = await detectLanguage();

		if ( ! sourceLanguage ) {
			// Error message is already set by detectLanguage() if it fails
			throw new Error( 'Could not determine the source language.' );
		}
		// --- Step 4: Check Translation Model Availability ---
		statusEl.textContent = 'Checking language model availability...';
		const availability = await Translator.availability(
			{
				sourceLanguage,
				targetLanguage: selectedLanguage,
			},
		);

		if ( availability === 'unavailable' ) {
			throw new Error( `Translation from '${ sourceLanguage }' to '${ selectedLanguage }' is not supported by your browser.` );
		}

		if ( availability === 'downloadable' ) {
			statusEl.textContent = 'A language model needs to be downloaded. This may take a moment...';
		}

		// --- Step 5: Translate Page Content ---
		const translator = await Translator.create(
			{
				sourceLanguage,
				targetLanguage: selectedLanguage,
			},
		);

		statusEl.textContent = 'Gathering page text...';
		const textNodes = findTextNodes( document.body );
		const originalTexts = textNodes.map( ( node ) => node.nodeValue );

		statusEl.textContent = `Translating ${ originalTexts.length } text fragments...`;

		// Translate each text node and update the DOM
		for ( let i = 0; i < textNodes.length; i++ ) {
			const translatedText = await translator.translate( originalTexts[ i ] );
			textNodes[ i ].nodeValue = translatedText;
		}

		// --- Step 6: Finalize ---
		htmlEl.lang = selectedLanguage; // Update page language for accessibility
		statusEl.textContent = 'Translation complete! ✅';
	} catch ( error ) {
		statusEl.innerHTML = ` <strong>An error occurred: </strong> <br> ${ error.message }`;
	} finally {
		// Re-enable the dropdown regardless of success or failure
		translateDropdown.disabled = false;
		translateDropdown.classList.remove( 'opacity-50', 'cursor-not-allowed' );
	}
}

/**
 * Detects the language of the main content area.
 * Assumes LanguageDetector API availability has already been checked.
 *
 * @return {Promise<string|null>} The detected language code (e.g., 'en') or null if detection fails.
 */
async function detectLanguage() {
	const contentElement = document.querySelector( '#main' ) || document.body;
	const contentText = contentElement.innerText;

	if ( ! contentText.trim() ) {
		statusEl.textContent = 'No content found to analyze.';
		return null;
	}

	try {
		const detector = await LanguageDetector.create();
		const results = await detector.detect( contentText );

		if ( results.length > 0 ) {
			// Return the BCP 47 language code of the top result (e.g., "en", "hi")
			return results[ 0 ].detectedLanguage;
		}
		statusEl.textContent = 'Could not determine the language.';
		return null;
	} catch ( error ) {
		statusEl.innerHTML = `<p class="text-red-600 font-semibold"> An error occurred during detection.</p>`;
		return null;
	}
}

/**
 * Recursively finds all non-empty text nodes within an element.
 * Skips script, style, and other non-visible or interactive tags.
 *
 * @param {Node} node - The starting node to traverse.
 * @return {Node[]} - An array of text nodes.
 */
function findTextNodes( node ) {
	const textNodes = [];
	// Exclude tags that should not be translated
	const excludedTags = [ 'SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'CANVAS', 'SVG', 'CODE' ];

	if ( excludedTags.includes( node.nodeName ) ) {
		return [];
	}

	// exclude the dropdown and status elements
	if ( node === translateDropdown || node === statusEl ) {
		return [];
	}

	if ( node.nodeType === Node.TEXT_NODE ) {
		// Only include text nodes that contain non-whitespace characters
		if ( node.nodeValue.trim().length > 0 ) {
			textNodes.push( node );
		}
	} else {
		for ( const child of node.childNodes ) {
			textNodes.push( ...findTextNodes( child ) );
		}
	}
	return textNodes;
}

// On load select the language detected by the browser in the dropdown.
document.addEventListener( 'DOMContentLoaded', async () => {
	try {
		// --- Step 3: Detect Source Language ---
		statusEl.textContent = 'Detecting page language...';
		const sourceLanguage = await detectLanguage();

		if ( ! sourceLanguage ) {
			// Error message is already set by detectLanguage() if it fails
			throw new Error( 'Could not determine the source language.' );
		}
		// If the detected language is in the dropdown, select it
		const optionToSelect = Array.from( translateDropdown.options ).find( ( option ) => option.value === sourceLanguage );
		if ( optionToSelect ) {
			translateDropdown.value = sourceLanguage;
			statusEl.textContent = `Detected page language: ${ optionToSelect.text }`;
		} else {
			statusEl.textContent = 'Unsupported language : ' + sourceLanguage;
		}
	} catch ( error ) {
		statusEl.innerHTML = `<p class="text-red-600 font-semibold"> An error occurred during detection.</p>`;
	}
} );
