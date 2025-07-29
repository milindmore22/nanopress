/**
 * NanoPress Summarizer Script
 * This script handles the summarization of page content using the browser's Summarizer API.
 *
 * @package nano-press
 * @since 1.0.0
 */

document.addEventListener('DOMContentLoaded', async () => {

	const summaryOutput = document.getElementById('summary-result');
	const articleContent = document.getElementsByTagName('main')[0] || document.body;

	const options = {
		sharedContext: 'A general summary to help a user summarize an article.',
		type: 'tldr',
		format: 'plain-text',
		length: 'long',
		expectedContextLanguages : ['en'], // Currently only English is supported, but it can take other languages as input.
		expectedInputLanguages: ['en'], // Currently only English is supported, but it can take other languages as input and generate summaries in english.
		outputLanguage: 'en', // Currently only English is supported.
	};

	// Check if the Summarizer API is available in the browser
	if ('Summarizer' in self) {
		try {
			const availability = await Summarizer.availability();

			if ('available' === availability) {
				// If the API is supported, create a summarizer instance
				const summarizer = await Summarizer.create(options);

				// Get the text from the article
				const textToSummarize = articleContent.innerText;

				// Generate the summary
				const summary = await summarizer.summarize(textToSummarize);

				const markdownSummary = marked.parse(summary);

				// Display the generated summary
				summaryOutput.innerHTML = `<p>${markdownSummary}</p>`;

			} else {
				// Handle the case where the API is not supported
				const reason = availability || 'The browser does not support this feature.';
				console.warn('Summarizer not supported:', reason);
				summaryOutput.innerHTML = `<p class="font-semibold">Summarizer API Not Supported: ${reason}</p>`;
				summaryOutput.classList.remove('bg-blue-50', 'border-blue-400', 'text-blue-800');
				summaryOutput.classList.add('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');
			}
		} catch (error) {
			// Handle any errors during the process
			console.error('Error using the Summarizer API:', error);
			summaryOutput.innerHTML = `<p>An error occurred while trying to generate the summary: ${error.message}</p>`;
			summaryOutput.classList.remove('bg-blue-50', 'border-blue-400', 'text-blue-800');
			summaryOutput.classList.add('bg-red-50', 'border-red-400', 'text-red-800');
		}
	} else {
		// Handle the case where the Summarizer object itself is not in the window
		console.warn('Summarizer API not available in this browser.');
		summaryOutput.innerHTML = `<p>The built-in Summarizer API is not available in your browser. This is an experimental feature and may be supported in future versions.</p>`;
		summaryOutput.classList.remove('bg-blue-50', 'border-blue-400', 'text-blue-800');
		summaryOutput.classList.add('bg-gray-200', 'border-gray-400', 'text-gray-700');
	}
});