/**
 * NanoPress Proofreader Script
 * This script handles grammar and spelling checks using the browser's Proofreader API.
 * Runs in the WordPress admin post editor and integrates with the Gutenberg block editor.
 *
 * @package nano-press
 * @since 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {

	const proofreadBtn      = document.getElementById( 'nanopress-proofread-btn' );
	const statusEl          = document.getElementById( 'nanopress-proofread-status' );
	const panelEl           = document.getElementById( 'nanopress-proofread-panel' );
	const correctionsEl     = document.getElementById( 'nanopress-proofread-corrections' );
	const actionsEl         = document.getElementById( 'nanopress-proofread-actions' );
	const acceptAllBtn      = document.getElementById( 'nanopress-accept-all-btn' );

	if ( ! proofreadBtn ) {
		return;
	}

	let currentCorrections  = [];
	let correctedInput      = '';
	let originalText        = '';

	proofreadBtn.addEventListener( 'click', handleProofread );

	if ( acceptAllBtn ) {
		acceptAllBtn.addEventListener( 'click', handleAcceptAll );
	}

	/**
	 * Retrieves the plain text content from the Gutenberg editor.
	 *
	 * @returns {string} The plain text content of the editor.
	 */
	function getEditorText() {
		if ( typeof wp !== 'undefined' && wp.data && wp.data.select( 'core/editor' ) ) {
			const content = wp.data.select( 'core/editor' ).getEditedPostContent();
			// Strip HTML tags to get plain text for proofreading.
			const parser  = new DOMParser();
			const doc     = parser.parseFromString( content, 'text/html' );
			return doc.body.textContent || '';
		}
		return '';
	}

	/**
	 * Retrieves the raw HTML content from the Gutenberg editor.
	 *
	 * @returns {string} The HTML content of the editor.
	 */
	function getEditorContent() {
		if ( typeof wp !== 'undefined' && wp.data && wp.data.select( 'core/editor' ) ) {
			return wp.data.select( 'core/editor' ).getEditedPostContent();
		}
		return '';
	}

	/**
	 * Updates the editor content with new HTML.
	 *
	 * @param {string} newContent The new HTML content.
	 */
	function setEditorContent( newContent ) {
		if ( typeof wp !== 'undefined' && wp.data && wp.data.dispatch( 'core/editor' ) ) {
			wp.data.dispatch( 'core/editor' ).editPost( { content: newContent } );
		}
	}

	/**
	 * Main handler for the proofread button click.
	 */
	async function handleProofread() {
		// Disable button during processing.
		proofreadBtn.disabled = true;
		proofreadBtn.classList.add( 'nanopress-btn-disabled' );
		panelEl.style.display = 'none';
		actionsEl.style.display = 'none';
		correctionsEl.innerHTML = '';

		// Check if the Proofreader API is available.
		if ( ! ('Proofreader' in self) ) {
			statusEl.innerHTML = '<p class="nanopress-proofread-error">The built-in Proofreader API is not available in your browser. This feature requires a supported browser with the Proofreader API enabled.</p>';
			proofreadBtn.disabled = false;
			proofreadBtn.classList.remove( 'nanopress-btn-disabled' );
			return;
		}

		try {
			statusEl.innerHTML = '<p>Checking proofreader availability...</p>';

			const availability = await Proofreader.availability();

			if ( 'unavailable' === availability ) {
				statusEl.innerHTML = '<p class="nanopress-proofread-error">The Proofreader API is not supported in your current browser configuration.</p>';
				proofreadBtn.disabled = false;
				proofreadBtn.classList.remove( 'nanopress-btn-disabled' );
				return;
			}

			if ( 'downloadable' === availability ) {
				statusEl.innerHTML = '<p>Downloading the proofreader model. This may take a moment...</p>';
			} else {
				statusEl.innerHTML = '<p>Proofreading content...</p>';
			}

			const proofreader = await Proofreader.create( {
				expectedInputLanguages: ['en'],
			} );

			originalText = getEditorText();

			if ( ! originalText.trim() ) {
				statusEl.innerHTML = '<p class="nanopress-proofread-error">No content found to proofread. Please add some text first.</p>';
				proofreadBtn.disabled = false;
				proofreadBtn.classList.remove( 'nanopress-btn-disabled' );
				return;
			}

			const result = await proofreader.proofread( originalText );

			correctedInput     = result.correctedInput || '';
			currentCorrections = result.corrections || [];

			if ( currentCorrections.length === 0 ) {
				statusEl.innerHTML = '<p class="nanopress-proofread-success">No grammar or spelling issues found! ✅</p>';
				panelEl.style.display = 'none';
			} else {
				statusEl.innerHTML = '<p>Found ' + currentCorrections.length + ' suggestion(s).</p>';
				renderCorrections( originalText );
				panelEl.style.display = 'block';
				actionsEl.style.display = 'block';
			}

		} catch (error) {
			console.error( 'Proofreader error:', error );
			const errorEl = document.createElement( 'p' );
			errorEl.className = 'nanopress-proofread-error';
			errorEl.textContent = 'An error occurred while proofreading: ' + error.message;
			statusEl.innerHTML = '';
			statusEl.appendChild( errorEl );
		} finally {
			proofreadBtn.disabled = false;
			proofreadBtn.classList.remove( 'nanopress-btn-disabled' );
		}
	}

	/**
	 * Renders the list of corrections in the review panel.
	 *
	 * @param {string} sourceText The original text that was proofread.
	 */
	function renderCorrections( sourceText ) {
		correctionsEl.innerHTML = '';

		currentCorrections.forEach( ( correction, index ) => {
			const originalSegment = sourceText.substring( correction.startIndex, correction.endIndex );
			const suggestion      = correction.suggestion || '';

			const itemEl       = document.createElement( 'div' );
			itemEl.className   = 'nanopress-correction-item';
			itemEl.setAttribute( 'data-index', index );

			const detailsEl     = document.createElement( 'div' );
			detailsEl.className = 'nanopress-correction-details';

			const originalEl     = document.createElement( 'span' );
			originalEl.className = 'nanopress-correction-original';
			originalEl.textContent = originalSegment;

			const arrowEl     = document.createElement( 'span' );
			arrowEl.className = 'nanopress-correction-arrow';
			arrowEl.textContent = ' → ';

			const suggestionEl     = document.createElement( 'span' );
			suggestionEl.className = 'nanopress-correction-suggestion';
			suggestionEl.textContent = suggestion;

			detailsEl.appendChild( originalEl );
			detailsEl.appendChild( arrowEl );
			detailsEl.appendChild( suggestionEl );

			const buttonsEl     = document.createElement( 'div' );
			buttonsEl.className = 'nanopress-correction-buttons';

			const acceptBtn     = document.createElement( 'button' );
			acceptBtn.className = 'button nanopress-correction-accept';
			acceptBtn.type      = 'button';
			acceptBtn.textContent = 'Accept';
			acceptBtn.addEventListener( 'click', () => handleAcceptSingle( index, itemEl ) );

			const ignoreBtn     = document.createElement( 'button' );
			ignoreBtn.className = 'button nanopress-correction-ignore';
			ignoreBtn.type      = 'button';
			ignoreBtn.textContent = 'Ignore';
			ignoreBtn.addEventListener( 'click', () => handleIgnore( itemEl ) );

			buttonsEl.appendChild( acceptBtn );
			buttonsEl.appendChild( ignoreBtn );

			itemEl.appendChild( detailsEl );
			itemEl.appendChild( buttonsEl );

			correctionsEl.appendChild( itemEl );
		} );
	}

	/**
	 * Handles accepting a single correction by replacing text in the editor content.
	 *
	 * @param {number} index The index of the correction.
	 * @param {HTMLElement} itemEl The correction item element.
	 */
	function handleAcceptSingle( index, itemEl ) {
		const correction = currentCorrections[index];

		if ( ! correction ) {
			return;
		}

		const originalSegment = originalText.substring( correction.startIndex, correction.endIndex );
		const suggestion      = correction.suggestion || '';

		// Apply correction to the editor HTML content.
		const content    = getEditorContent();
		const newContent = content.replace( originalSegment, suggestion );
		setEditorContent( newContent );

		// Mark this correction item as resolved.
		itemEl.classList.add( 'nanopress-correction-resolved' );
		const buttons = itemEl.querySelector( '.nanopress-correction-buttons' );
		if ( buttons ) {
			buttons.innerHTML = '<span class="nanopress-correction-accepted">Accepted ✅</span>';
		}

		checkAllResolved();
	}

	/**
	 * Handles ignoring a correction.
	 *
	 * @param {HTMLElement} itemEl The correction item element.
	 */
	function handleIgnore( itemEl ) {
		itemEl.classList.add( 'nanopress-correction-resolved' );
		const buttons = itemEl.querySelector( '.nanopress-correction-buttons' );
		if ( buttons ) {
			buttons.innerHTML = '<span class="nanopress-correction-ignored">Ignored</span>';
		}

		checkAllResolved();
	}

	/**
	 * Handles accepting all corrections at once.
	 * Applies corrections from last to first to preserve text positions.
	 */
	function handleAcceptAll() {
		let content = getEditorContent();

		// Sort corrections in reverse order by startIndex to preserve positions.
		const sorted = currentCorrections
			.slice()
			.sort( ( a, b ) => b.startIndex - a.startIndex );

		sorted.forEach( ( correction ) => {
			const originalSegment = originalText.substring( correction.startIndex, correction.endIndex );
			const suggestion      = correction.suggestion || '';
			content = content.replace( originalSegment, suggestion );
		} );

		setEditorContent( content );

		// Mark all items as resolved.
		const items = correctionsEl.querySelectorAll( '.nanopress-correction-item' );
		items.forEach( ( item ) => {
			item.classList.add( 'nanopress-correction-resolved' );
			const buttons = item.querySelector( '.nanopress-correction-buttons' );
			if ( buttons ) {
				buttons.innerHTML = '<span class="nanopress-correction-accepted">Accepted ✅</span>';
			}
		} );

		statusEl.innerHTML = '<p class="nanopress-proofread-success">All corrections applied! ✅</p>';
		actionsEl.style.display = 'none';
	}

	/**
	 * Checks if all corrections have been resolved and updates the UI.
	 */
	function checkAllResolved() {
		const items    = correctionsEl.querySelectorAll( '.nanopress-correction-item' );
		const resolved = correctionsEl.querySelectorAll( '.nanopress-correction-resolved' );

		if ( items.length === resolved.length ) {
			statusEl.innerHTML = '<p class="nanopress-proofread-success">All corrections reviewed! ✅</p>';
			actionsEl.style.display = 'none';
		}
	}

} );
