import './style.scss';

/*
 * Grab the language dropdown, status display, and the language selector
 * container from the page.
 */
const translateDropdown = document.getElementById(
	'language-dropdown'
) as HTMLSelectElement | null;
const statusElement = document.getElementById('status');
const htmlElement = document.documentElement;
const languageSelectorContainer = document.getElementById(
	'ai-translator-language-selector'
);

/* Escape HTML special characters so we don't accidentally inject unsafe content. */
const escapeHtml = (text: string): string =>
	text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');

/* Show a status message — either plain text or HTML. */
const setStatus = (message: string, useHtml = false): void => {
	if (!statusElement) {
		return;
	}

	if (useHtml) {
		statusElement.innerHTML = message;
		return;
	}

	statusElement.textContent = message;
};

/* Use the browser's Language Detector API to figure out what language the page is in. */
const detectLanguage = async (): Promise<string | null> => {
	if (!window.LanguageDetector || !statusElement) {
		return null;
	}

	const contentElement =
		document.querySelector<HTMLElement>('#main') ?? document.body;
	const contentText = contentElement.innerText;

	if (!contentText.trim()) {
		setStatus('No content found to analyze.');
		return null;
	}

	try {
		const detector = await window.LanguageDetector.create();
		const results = await detector.detect(contentText);

		return results[0]?.detectedLanguage ?? null;
	} catch (error) {
		setStatus(
			'<p class="nanopress-status-error">An error occurred during language detection.</p>',
			true
		);
		return null;
	}
};

/*
 * Walk the DOM and collect text nodes we can translate.
 * Skips script/style tags, buttons, SVG, code blocks, and the language selector itself.
 */
const findTextNodes = (node: Node): Text[] => {
	const excludedTags = [
		'SCRIPT',
		'STYLE',
		'NOSCRIPT',
		'BUTTON',
		'CANVAS',
		'SVG',
		'CODE',
	];

	if (excludedTags.includes(node.nodeName)) {
		return [];
	}

	/* Don't translate the language picker UI itself. */
	if (
		languageSelectorContainer &&
		(node === languageSelectorContainer ||
			languageSelectorContainer.contains(node as Node))
	) {
		return [];
	}

	if (node.nodeType === Node.TEXT_NODE) {
		const textNode = node as Text;
		return textNode.nodeValue?.trim() ? [textNode] : [];
	}

	return Array.from(node.childNodes).flatMap(findTextNodes);
};

/* When the user picks a language from the dropdown, kick off the translation. */
const handleTranslation = async (): Promise<void> => {
	if (!translateDropdown || !statusElement) {
		return;
	}

	const selectedLanguage = translateDropdown.value;
	if (!selectedLanguage) {
		setStatus('Please select a language.');
		return;
	}

	translateDropdown.disabled = true;
	translateDropdown.classList.add('opacity-50', 'cursor-not-allowed');

	if (!window.Translator || !window.LanguageDetector) {
		setStatus(
			'<strong>Translation failed:</strong> Your browser does not support the required APIs.',
			true
		);
		translateDropdown.disabled = false;
		translateDropdown.classList.remove('opacity-50', 'cursor-not-allowed');
		return;
	}

	try {
		setStatus('Detecting page language...');
		const sourceLanguage = await detectLanguage();

		if (!sourceLanguage) {
			throw new Error('Could not determine the source language.');
		}

		setStatus('Checking language model availability...');
		const availability = await window.Translator.availability({
			sourceLanguage,
			targetLanguage: selectedLanguage,
		});

		if (availability === 'unavailable') {
			throw new Error(
				`Translation from ${sourceLanguage} to ${selectedLanguage} is not supported by your browser.`
			);
		}

		if (availability === 'downloadable') {
			setStatus(
				'A language model needs to be downloaded. This may take a moment...'
			);
		}

		const translator = await window.Translator.create({
			sourceLanguage,
			targetLanguage: selectedLanguage,
		});

		setStatus('Gathering page text...');
		const textNodes = findTextNodes(document.body);

		setStatus(`Translating ${textNodes.length} text fragments...`);

		/* Translate in small batches to avoid overwhelming the API and to show progress. */
		const BATCH_SIZE = 10;
		const translatedValues: string[] = [];

		for (let i = 0; i < textNodes.length; i += BATCH_SIZE) {
			const batch = textNodes.slice(i, i + BATCH_SIZE);
			const batchResults = await Promise.all(
				batch.map((textNode) =>
					translator.translate(textNode.nodeValue ?? '')
				)
			);
			translatedValues.push(...batchResults);
			setStatus(
				`Translating... ${Math.min(i + BATCH_SIZE, textNodes.length)}/${textNodes.length}`
			);
		}

		/* Swap each text node with its translation. */
		textNodes.forEach((textNode, index) => {
			textNode.nodeValue = translatedValues[index] ?? textNode.nodeValue;
		});

		htmlElement.lang = selectedLanguage;
		setStatus('Translation complete.');
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error';
		setStatus(
			`<strong>An error occurred:</strong><br>${escapeHtml(message)}`,
			true
		);
	} finally {
		translateDropdown.disabled = false;
		translateDropdown.classList.remove('opacity-50', 'cursor-not-allowed');
	}
};

/* On page load, try to detect the current language and pre-select it in the dropdown. */
const initializeDetectedLanguage = async (): Promise<void> => {
	if (!translateDropdown || !statusElement) {
		return;
	}

	try {
		setStatus('Detecting page language...');
		const sourceLanguage = await detectLanguage();

		if (!sourceLanguage) {
			throw new Error('Could not determine the source language.');
		}

		const option = Array.from(translateDropdown.options).find(
			(candidate) => candidate.value === sourceLanguage
		);

		if (option) {
			translateDropdown.value = sourceLanguage;
			setStatus(`Detected page language: ${option.text}`);
			return;
		}

		setStatus(`Unsupported language: ${sourceLanguage}`);
	} catch {
		setStatus(
			'<p class="nanopress-status-error">An error occurred during language detection.</p>',
			true
		);
	}
};

/* When the user selects a different language, start translating. */
if (translateDropdown) {
	translateDropdown.addEventListener('change', () => {
		void handleTranslation();
	});
}

document.addEventListener('DOMContentLoaded', () => {
	void initializeDetectedLanguage();
});
