const summaryOutput = document.getElementById('summary-result');
const articleContent =
	document.querySelector<HTMLElement>('main') ?? document.body;

const updateSummaryClasses = (...classes: string[]): void => {
	if (!summaryOutput) {
		return;
	}

	summaryOutput.classList.remove(
		'bg-blue-50',
		'border-blue-400',
		'text-blue-800',
		'bg-yellow-50',
		'border-yellow-400',
		'text-yellow-800',
		'bg-red-50',
		'border-red-400',
		'text-red-800',
		'bg-gray-200',
		'border-gray-400',
		'text-gray-700'
	);

	if (classes.length > 0) {
		summaryOutput.classList.add(...classes);
	}
};

const setSummaryHtml = (html: string): void => {
	if (summaryOutput) {
		summaryOutput.innerHTML = html;
	}
};

const escapeHtml = (text: string): string =>
	text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');

const detectPageLanguage = async (): Promise<string> => {
	if (!window.LanguageDetector) {
		return 'en';
	}

	const contentText = articleContent.innerText ?? '';
	if (!contentText.trim()) {
		return 'en';
	}

	try {
		const detector = await window.LanguageDetector.create();
		const results = await detector.detect(contentText);

		return results[0]?.detectedLanguage ?? 'en';
	} catch {
		return 'en';
	}
};

const summarizeContent = async (options: SummarizerOptions): Promise<void> => {
	if (!window.Summarizer || !summaryOutput) {
		return;
	}

	const summarizer = await window.Summarizer.create(options);
	setSummaryHtml('Generating summary...');

	const summary = await summarizer.summarize(articleContent.innerText);
	const formattedSummary = escapeHtml(summary).replaceAll('\n', '<br />');

	setSummaryHtml(`<div>${formattedSummary}</div>`);
};

const renderDownloadPrompt = (options: SummarizerOptions): void => {
	if (!summaryOutput) {
		return;
	}

	setSummaryHtml(
		`
			<div class="space-y-3">
				<p class="font-semibold">Summarizer Model Required</p>
				<p>The summarization model needs to be downloaded first. Click below to continue.</p>
				<button id="download-model-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" type="button">
					Download Model and Summarize
				</button>
			</div>
		`
	);
	updateSummaryClasses(
		'bg-yellow-50',
		'border-yellow-400',
		'text-yellow-800'
	);

	document
		.getElementById('download-model-btn')
		?.addEventListener('click', () => {
			void (async () => {
				try {
					setSummaryHtml(
						'Downloading summarization model... This may take a moment.'
					);
					updateSummaryClasses(
						'bg-blue-50',
						'border-blue-400',
						'text-blue-800'
					);
					await summarizeContent(options);
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: 'Unknown error';
					setSummaryHtml(
						`<p>An error occurred while downloading or using the model: ${message}</p>`
					);
					updateSummaryClasses(
						'bg-red-50',
						'border-red-400',
						'text-red-800'
					);
				}
			})();
		});
};

const initializeSummarizer = async (): Promise<void> => {
	if (!summaryOutput) {
		return;
	}

	if (!window.Summarizer) {
		setSummaryHtml(
			'<p>The built-in Summarizer API is not available in your browser.</p>'
		);
		updateSummaryClasses('bg-gray-200', 'border-gray-400', 'text-gray-700');
		return;
	}

	const options: SummarizerOptions = {
		sharedContext: 'A general summary to help a user summarize an article.',
		type: 'tldr',
		format: 'plain-text',
		length: 'long',
		expectedContextLanguages: ['en'],
		expectedInputLanguages: ['en'],
		outputLanguage: 'en',
		monitor(monitor) {
			monitor.addEventListener('downloadprogress', (event: Event) => {
				const progressEvent = event as Event & { loaded?: number };
				const progress = progressEvent.loaded
					? Math.round(progressEvent.loaded * 100)
					: 0;
				setSummaryHtml(`Downloading summarization model: ${progress}%`);
			});
		},
	};

	try {
		setSummaryHtml('Detecting page language...');
		const sourceLanguage = await detectPageLanguage();
		setSummaryHtml('Checking summarization model availability...');

		const availability = await window.Summarizer.availability({
			expectedInputLanguages: [sourceLanguage],
			outputLanguage: options.outputLanguage,
			type: options.type,
			format: options.format,
			length: options.length,
		});

		if (availability === 'available') {
			await summarizeContent(options);
			return;
		}

		if (availability === 'downloadable' || availability === 'downloading') {
			renderDownloadPrompt(options);
			return;
		}

		if (availability === 'unavailable') {
			setSummaryHtml(
				`<p class="font-semibold">Summarizer API Not Supported: ${availability}</p>`
			);
			updateSummaryClasses(
				'bg-yellow-50',
				'border-yellow-400',
				'text-yellow-800'
			);
			return;
		}

		setSummaryHtml(
			`<p class="font-semibold">Unexpected Summarizer Availability Status: ${availability}</p>`
		);
		updateSummaryClasses(
			'bg-yellow-50',
			'border-yellow-400',
			'text-yellow-800'
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error';
		setSummaryHtml(
			`<p>An error occurred while trying to generate the summary: ${message}</p>`
		);
		updateSummaryClasses('bg-red-50', 'border-red-400', 'text-red-800');
	}
};

document.addEventListener('DOMContentLoaded', () => {
	void initializeSummarizer();
});
