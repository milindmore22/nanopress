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
		monitor( m ) {
			m.addEventListener('downloadprogress', (e) => {
      			console.log(`Language Model Downloaded ${e.loaded * 100}%`);
    		} );
		}
	};

	// Check if the Summarizer API is available in the browser
	if ('Summarizer' in self) {
		try {
			
			summaryOutput.innerHTML = 'Detecting page language...';
			const sourceLanguage = await detectLanguage();

			if ( ! sourceLanguage) {
				// Error message is already set by detectLanguage() if it fails
				throw new Error( "Could not determine the source language." );
			}

			console.log( `Source language detected: ${sourceLanguage}` );

			summaryOutput.innerHTML = 'Checking summarization model availability...';

			const availability = await Summarizer.availability( {
				expectedInputLanguages: [sourceLanguage],
				outputLanguage: 'en',
				type: options.type,
				format: options.format,
				length: options.length,
			} );

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

			} else if ( 'unavailable' === availability ) {
				// Handle the case where the API is not supported
				const reason = availability || 'The browser does not support this feature.';
				console.warn('Summarizer not supported:', reason);
				summaryOutput.innerHTML = `<p class="font-semibold">Summarizer API Not Supported: ${reason}</p>`;
				summaryOutput.classList.remove('bg-blue-50', 'border-blue-400', 'text-blue-800');
				summaryOutput.classList.add('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');
			} else if ( 'downloadable' === availability || 'downloading' === availability ) {
				// Handle the case where the model needs to be downloaded
				// User gesture is required to download the model
				console.warn('Summarizer model needs to be downloaded.');
				summaryOutput.innerHTML = `
					<div class="space-y-3">
						<p class="font-semibold">Summarizer Model Required</p>
						<p>The summarization model needs to be downloaded first. Click the button below to download and use it.</p>
						<button id="download-model-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
							Download Model & Summarize
						</button>
					</div>
				`;
				summaryOutput.classList.remove('bg-blue-50', 'border-blue-400', 'text-blue-800');
				summaryOutput.classList.add('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');

				// Add click event to download button (user gesture required)
				document.getElementById('download-model-btn').addEventListener('click', async () => {
					try {
						summaryOutput.innerHTML = 'Downloading summarization model... This may take a moment.';
						summaryOutput.classList.remove('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');
						summaryOutput.classList.add('bg-blue-50', 'border-blue-400', 'text-blue-800');

						// Now with user gesture, we can create the summarizer
						const summarizer = await Summarizer.create(options);

						summaryOutput.innerHTML = 'Generating summary...';

						// Get the text from the article
						const textToSummarize = articleContent.innerText;

						// Generate the summary
						const summary = await summarizer.summarize(textToSummarize);

						const markdownSummary = marked.parse(summary);

						// Display the generated summary
						summaryOutput.innerHTML = `<p>${markdownSummary}</p>`;
					} catch (downloadError) {
						console.error('Error downloading or using the model:', downloadError);
						summaryOutput.innerHTML = `<p>An error occurred while downloading or using the model: ${downloadError.message}</p>`;
						summaryOutput.classList.remove('bg-blue-50', 'border-blue-400', 'text-blue-800');
						summaryOutput.classList.add('bg-red-50', 'border-red-400', 'text-red-800');
					}
				});
			} else {
				// Handle any other unexpected availability status
				console.warn('Unexpected Summarizer availability status:', availability);
				summaryOutput.innerHTML = `<p class="font-semibold">Unexpected Summarizer Availability Status: ${availability}</p>`;
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