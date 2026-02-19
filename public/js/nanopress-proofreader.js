/**
 * NanoPress Proofreader Script
 * This script handles grammar and spelling checks using the browser's Proofreader API.
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
	const articleContent    = document.querySelector( '.entry-content' ) || document.querySelector( 'main' ) || document.querySelector( 'article' );

	if ( ! proofreadBtn || ! articleContent ) {
		return;
	}

	let currentCorrections  = [];
	let correctedInput      = '';
	let originalContent     = '';

	proofreadBtn.addEventListener( 'click', handleProofread );

	if ( acceptAllBtn ) {
		acceptAllBtn.addEventListener( 'click', handleAcceptAll );
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

			originalContent = articleContent.innerHTML;
			const textContent = articleContent.textContent;

			const result = await proofreader.proofread( textContent );

			correctedInput     = result.correctedInput || '';
			currentCorrections = result.corrections || [];

			if ( currentCorrections.length === 0 ) {
				statusEl.innerHTML = '<p class="nanopress-proofread-success">No grammar or spelling issues found! ✅</p>';
				panelEl.style.display = 'none';
			} else {
				statusEl.innerHTML = '<p>Found ' + currentCorrections.length + ' suggestion(s).</p>';
				renderCorrections( textContent );
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
			const originalText = sourceText.substring( correction.startIndex, correction.endIndex );
			const suggestion   = correction.suggestion || '';

			const itemEl       = document.createElement( 'div' );
			itemEl.className   = 'nanopress-correction-item';
			itemEl.setAttribute( 'data-index', index );

			const detailsEl     = document.createElement( 'div' );
			detailsEl.className = 'nanopress-correction-details';

			const originalEl     = document.createElement( 'span' );
			originalEl.className = 'nanopress-correction-original';
			originalEl.textContent = originalText;

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
			acceptBtn.className = 'nanopress-correction-accept';
			acceptBtn.textContent = 'Accept';
			acceptBtn.addEventListener( 'click', () => handleAcceptSingle( index, itemEl ) );

			const ignoreBtn     = document.createElement( 'button' );
			ignoreBtn.className = 'nanopress-correction-ignore';
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
	 * Handles accepting a single correction by walking DOM text nodes.
	 *
	 * @param {number} index The index of the correction.
	 * @param {HTMLElement} itemEl The correction item element.
	 */
	function handleAcceptSingle( index, itemEl ) {
		const correction = currentCorrections[index];

		if ( ! correction ) {
			return;
		}

		// Walk text nodes to find the correct position and apply replacement.
		replaceTextAtPosition(
			articleContent,
			correction.startIndex,
			correction.endIndex,
			correction.suggestion || ''
		);

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
	 * Handles accepting all corrections at once by applying each in reverse order.
	 * Applies corrections from last to first to preserve text positions.
	 */
	function handleAcceptAll() {
		// Sort corrections in reverse order by startIndex to preserve positions.
		const sorted = currentCorrections
			.map( ( c, i ) => ( { correction: c, index: i } ) )
			.sort( ( a, b ) => b.correction.startIndex - a.correction.startIndex );

		sorted.forEach( ( entry ) => {
			replaceTextAtPosition(
				articleContent,
				entry.correction.startIndex,
				entry.correction.endIndex,
				entry.correction.suggestion || ''
			);
		} );

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

	/**
	 * Replaces text at a specific position by walking DOM text nodes.
	 * This preserves HTML structure while replacing text content.
	 *
	 * @param {HTMLElement} container The container element.
	 * @param {number} startIndex The start index in the text content.
	 * @param {number} endIndex The end index in the text content.
	 * @param {string} replacement The replacement text.
	 */
	function replaceTextAtPosition( container, startIndex, endIndex, replacement ) {
		const textNodes = [];
		const walker    = document.createTreeWalker( container, NodeFilter.SHOW_TEXT, null );

		while ( walker.nextNode() ) {
			textNodes.push( walker.currentNode );
		}

		let offset = 0;

		for ( let i = 0; i < textNodes.length; i++ ) {
			const node       = textNodes[i];
			const nodeLength = node.nodeValue.length;
			const nodeStart  = offset;
			const nodeEnd    = offset + nodeLength;

			// Check if this text node overlaps with the correction range.
			if ( nodeEnd > startIndex && nodeStart < endIndex ) {
				const replaceStart = Math.max( startIndex - nodeStart, 0 );
				const replaceEnd   = Math.min( endIndex - nodeStart, nodeLength );
				const before       = node.nodeValue.substring( 0, replaceStart );
				const after        = node.nodeValue.substring( replaceEnd );

				// Only include the replacement text in the first overlapping node.
				if ( nodeStart <= startIndex ) {
					node.nodeValue = before + replacement + after;
				} else {
					node.nodeValue = after;
				}

				return; // Correction applied.
			}

			offset += nodeLength;
		}
	}

} );
