/**
 * NanoPress Proofreader Script
 * This script handles grammar and spelling checks using the browser's Proofreader API.
 * Runs in the WordPress admin post editor and integrates with the Gutenberg block editor.
 *
 * @package
 * @since 1.0.0
 */

/* global Proofreader */

( function() {
	/**
	 * Initialize the proofreader once the editor is ready.
	 */
	function initProofreader() {
		const proofreadBtn = document.getElementById( 'nanopress-proofread-btn' );

		if ( ! proofreadBtn ) {
			return;
		}

		const statusEl = document.getElementById( 'nanopress-proofread-status' );
		const panelEl = document.getElementById( 'nanopress-proofread-panel' );
		const correctionsEl = document.getElementById( 'nanopress-proofread-corrections' );
		const actionsEl = document.getElementById( 'nanopress-proofread-actions' );
		const acceptAllBtn = document.getElementById( 'nanopress-accept-all-btn' );

		let currentCorrections = [];
		let originalText = '';

		proofreadBtn.addEventListener( 'click', handleProofread );

		if ( acceptAllBtn ) {
			acceptAllBtn.addEventListener( 'click', handleAcceptAll );
		}

		/**
		 * Extracts the suggestion text from a correction object.
		 * The Chrome Proofreader API may use different property names
		 * depending on the browser version.
		 *
		 * @param {Object} correction The correction object from the API.
		 * @return {string} The suggested replacement text.
		 */
		function getSuggestionText( correction ) {
			return correction.correction || correction.suggestion || correction.replacement || '';
		}

		/**
		 * Extracts plain text from all blocks in the Gutenberg editor.
		 *
		 * @return {string} The concatenated plain text content.
		 */
		function getEditorText() {
			if ( typeof wp === 'undefined' || ! wp.data ) {
				return '';
			}

			// Try to get blocks from the block editor store.
			const blockEditor = wp.data.select( 'core/block-editor' );
			if ( blockEditor ) {
				const blocks = blockEditor.getBlocks();
				if ( blocks && blocks.length > 0 ) {
					return extractTextFromBlocks( blocks );
				}
			}

			// Fallback: try getting serialized content from the editor store.
			const editor = wp.data.select( 'core/editor' );
			if ( editor ) {
				const content = editor.getEditedPostContent();
				if ( content ) {
					const parser = new DOMParser();
					const doc = parser.parseFromString( content, 'text/html' );
					return doc.body.textContent || '';
				}
			}

			return '';
		}

		/**
		 * Recursively extracts plain text from an array of blocks.
		 *
		 * @param {Array} blocks The array of block objects.
		 * @return {string} The plain text content.
		 */
		function extractTextFromBlocks( blocks ) {
			const parts = [];

			blocks.forEach( ( block ) => {
				// Extract text from common content attributes.
				if ( block.attributes ) {
					const attrs = block.attributes;
					const html = attrs.content || attrs.citation || attrs.value || attrs.text || '';

					if ( html ) {
						const parser = new DOMParser();
						const doc = parser.parseFromString( html, 'text/html' );
						const text = doc.body.textContent || '';
						if ( text.trim() ) {
							parts.push( text );
						}
					}
				}

				// Process inner blocks recursively.
				if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
					const innerText = extractTextFromBlocks( block.innerBlocks );
					if ( innerText.trim() ) {
						parts.push( innerText );
					}
				}
			} );

			return parts.join( '\n' );
		}

		/**
		 * Applies text corrections to the editor blocks.
		 * Replaces matching text segments within block attributes.
		 *
		 * @param {string} originalSegment The original text to find.
		 * @param {string} replacement     The replacement text.
		 */
		function applyCorrection( originalSegment, replacement ) {
			if ( typeof wp === 'undefined' || ! wp.data ) {
				return;
			}

			const blockEditor = wp.data.select( 'core/block-editor' );
			const dispatch = wp.data.dispatch( 'core/block-editor' );

			if ( ! blockEditor || ! dispatch ) {
				return;
			}

			const blocks = blockEditor.getBlocks();
			updateBlocksText( blocks, originalSegment, replacement, dispatch );
		}

		/**
		 * Replaces a plain-text segment inside an HTML string, preserving markup.
		 * Walks the DOM text nodes to find and replace the matching text.
		 *
		 * @param {string} html            The HTML string to search in.
		 * @param {string} originalSegment The plain text to find.
		 * @param {string} replacement     The replacement plain text.
		 * @return {string|null} The updated HTML string, or null if not found.
		 */
		function replaceTextInHtml( html, originalSegment, replacement ) {
			// If the HTML contains the segment directly (no markup in the way), do a simple replace.
			if ( html.includes( originalSegment ) ) {
				return html.replace( originalSegment, replacement );
			}

			// Otherwise, walk text nodes in the parsed HTML to handle inline markup.
			const parser = new DOMParser();
			const doc = parser.parseFromString( html, 'text/html' );
			const walker = doc.createTreeWalker( doc.body, NodeFilter.SHOW_TEXT );

			let found = false;
			while ( walker.nextNode() ) {
				const node = walker.currentNode;
				const idx = node.nodeValue.indexOf( originalSegment );
				if ( idx !== -1 ) {
					node.nodeValue = node.nodeValue.substring( 0, idx ) + replacement + node.nodeValue.substring( idx + originalSegment.length );
					found = true;
					break;
				}
			}

			if ( found ) {
				return doc.body.innerHTML;
			}

			return null;
		}

		/**
		 * Recursively walks blocks and updates the first matching text occurrence.
		 *
		 * @param {Array}  blocks          The blocks to search.
		 * @param {string} originalSegment The text to find.
		 * @param {string} replacement     The replacement text.
		 * @param {Object} dispatch        The block editor dispatch object.
		 * @return {boolean} True if a replacement was made.
		 */
		function updateBlocksText( blocks, originalSegment, replacement, dispatch ) {
			for ( let i = 0; i < blocks.length; i++ ) {
				const block = blocks[ i ];

				// Check common content attributes - must match the extraction logic.
				const contentKeys = [ 'content', 'citation', 'value', 'text' ];
				for ( const key of contentKeys ) {
					if ( block.attributes && block.attributes[ key ] ) {
						const attrValue = ( typeof block.attributes[ key ] === 'object' ) ? ( block.attributes[ key ].value || block.attributes[ key ] ) : block.attributes[ key ];
						const result = replaceTextInHtml( attrValue, originalSegment, replacement );
						if ( result !== null ) {
							const newAttributes = {};
							newAttributes[ key ] = result;
							dispatch.updateBlockAttributes( block.clientId, newAttributes );
							return true;
						}
					}
				}

				// Recurse into inner blocks.
				if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
					if ( updateBlocksText( block.innerBlocks, originalSegment, replacement, dispatch ) ) {
						return true;
					}
				}
			}
			return false;
		}

		/**
		 * Applies all corrections to the editor blocks.
		 *
		 * @param {Array}  corrections The corrections to apply.
		 * @param {string} sourceText  The original text that was proofread.
		 */
		function applyAllCorrections( corrections, sourceText ) {
			// Sort corrections in reverse order by startIndex to preserve positions.
			const sorted = corrections
				.slice()
				.sort( ( a, b ) => b.startIndex - a.startIndex );

			sorted.forEach( ( correction ) => {
				// if sourceText contains any spaces then we should skip applying this correction because it is likely a false positive or an issue with the API's text segmentation. We only want to apply corrections for single words or phrases without spaces.
				const originalSegment = sourceText.substring( correction.startIndex, correction.endIndex );
				if ( originalSegment.includes( ' ' ) ) {
					return;
				}
				const suggestion = getSuggestionText( correction );
				applyCorrection( originalSegment, suggestion );
			} );
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
			if ( ! ( 'Proofreader' in self ) ) {
				statusEl.innerHTML = '<p class="nanopress-proofread-error">The built-in Proofreader API is not available in your browser. Please use a <a href="https://developer.chrome.com/docs/ai/proofreader-api" target="_blank">supported browser</a> with the Proofreader API enabled.</p>';
				proofreadBtn.disabled = false;
				proofreadBtn.classList.remove( 'nanopress-btn-disabled' );
				return;
			}

			try {
				statusEl.innerHTML = '<p>Checking proofreader availability...</p>';

				const availability = await Proofreader.availability();

				if ( 'unavailable' === availability ) {
					statusEl.innerHTML = '<p class="nanopress-proofread-error">The Proofreader API is not supported in your current browser configuration. Please check <a href="https://developer.chrome.com/docs/ai/proofreader-api" target="_blank">the setup instructions</a>.</p>';
					proofreadBtn.disabled = false;
					proofreadBtn.classList.remove( 'nanopress-btn-disabled' );
					return;
				}

				if ( 'downloadable' === availability || 'downloading' === availability ) {
					statusEl.innerHTML = '<p>Downloading the proofreader model. This may take a moment...</p>';
				} else {
					statusEl.innerHTML = '<p>Proofreading content...</p>';
				}

				const proofreader = await Proofreader.create( {
					expectedInputLanguages: [ 'en' ],
				} );

				originalText = getEditorText();

				if ( ! originalText.trim() ) {
					statusEl.innerHTML = '<p class="nanopress-proofread-error">No content found to proofread. Please add some text to your post first.</p>';
					proofreadBtn.disabled = false;
					proofreadBtn.classList.remove( 'nanopress-btn-disabled' );
					return;
				}

				statusEl.innerHTML = '<p>Proofreading content...</p>';
				const result = await proofreader.proofread( originalText );

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
			} catch ( error ) {
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

				// if sourceText contains any spaces then we should skip rendering this correction because it is likely a false positive or an issue with the API's text segmentation. We only want to show corrections for single words or phrases without spaces.
				if ( originalSegment.includes( ' ' ) ) {
					return;
				}

				const suggestion = getSuggestionText( correction );

				const itemEl = document.createElement( 'div' );
				itemEl.className = 'nanopress-correction-item';
				itemEl.setAttribute( 'data-index', index );

				const detailsEl = document.createElement( 'div' );
				detailsEl.className = 'nanopress-correction-details';

				const originalEl = document.createElement( 'span' );
				originalEl.className = 'nanopress-correction-original';
				originalEl.textContent = originalSegment;

				const arrowEl = document.createElement( 'span' );
				arrowEl.className = 'nanopress-correction-arrow';
				arrowEl.textContent = ' → ';

				const suggestionEl = document.createElement( 'span' );
				suggestionEl.className = 'nanopress-correction-suggestion';
				suggestionEl.textContent = suggestion;

				detailsEl.appendChild( originalEl );
				detailsEl.appendChild( arrowEl );
				detailsEl.appendChild( suggestionEl );

				const buttonsEl = document.createElement( 'div' );
				buttonsEl.className = 'nanopress-correction-buttons';

				const acceptBtn = document.createElement( 'button' );
				acceptBtn.className = 'button nanopress-correction-accept';
				acceptBtn.type = 'button';
				acceptBtn.textContent = 'Accept';
				acceptBtn.addEventListener( 'click', () => handleAcceptSingle( index, itemEl ) );

				const ignoreBtn = document.createElement( 'button' );
				ignoreBtn.className = 'button nanopress-correction-ignore';
				ignoreBtn.type = 'button';
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
		 * Handles accepting a single correction.
		 *
		 * @param {number}      index  The index of the correction.
		 * @param {HTMLElement} itemEl The correction item element.
		 */
		function handleAcceptSingle( index, itemEl ) {
			const correction = currentCorrections[ index ];

			if ( ! correction ) {
				return;
			}

			const originalSegment = originalText.substring( correction.startIndex, correction.endIndex );
			const suggestion = getSuggestionText( correction );

			applyCorrection( originalSegment, suggestion );

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
		 */
		function handleAcceptAll() {
			applyAllCorrections( currentCorrections, originalText );

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
			const items = correctionsEl.querySelectorAll( '.nanopress-correction-item' );
			const resolved = correctionsEl.querySelectorAll( '.nanopress-correction-resolved' );

			if ( items.length === resolved.length ) {
				statusEl.innerHTML = '<p class="nanopress-proofread-success">All corrections reviewed! ✅</p>';
				actionsEl.style.display = 'none';
			}
		}
	}

	// Use wp.domReady to ensure the editor is fully loaded before initializing.
	if ( typeof wp !== 'undefined' && wp.domReady ) {
		wp.domReady( initProofreader );
	} else {
		document.addEventListener( 'DOMContentLoaded', initProofreader );
	}
}() );
