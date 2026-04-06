import './style.scss';

const translateDropdown = document.getElementById(
	'language-dropdown'
) as HTMLSelectElement | null;
const statusElement = document.getElementById('status');
const htmlElement = document.documentElement;
const languageSelectorContainer = document.getElementById(
	'ai-translator-language-selector'
);

const escapeHtml = (text: string): string =>
	text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');

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

	// Exclude the entire language selector container and all its descendants
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

if (translateDropdown) {
	translateDropdown.addEventListener('change', () => {
		void handleTranslation();
	});
}

document.addEventListener('DOMContentLoaded', () => {
	void initializeDetectedLanguage();
});
