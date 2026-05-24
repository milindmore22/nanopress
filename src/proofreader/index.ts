import './style.scss';

/* Simple type for block attributes — we don't know the exact shape, so keep it flexible. */
type BlockAttributes = Record<string, unknown>;

/* A single block in the editor: has an ID, optional attributes, and optional nested children. */
interface Block {
	clientId: string;
	attributes?: BlockAttributes;
	innerBlocks?: Block[];
}

/* The parts of the block-editor store we actually use. */
interface BlockEditorSelect {
	getBlocks: () => Block[];
}

interface EditorSelect {
	getEditedPostContent: () => string;
}

interface BlockEditorDispatch {
	updateBlockAttributes: (
		clientId: string,
		attributes: Record<string, string>
	) => void;
}

/* The wp.data object that gives us access to the editor stores. */
interface WpData {
	select: ((
		storeName: 'core/block-editor'
	) => BlockEditorSelect | undefined) &
		((storeName: 'core/editor') => EditorSelect | undefined);
	dispatch: (
		storeName: 'core/block-editor'
	) => BlockEditorDispatch | undefined;
}

declare const wp:
	| {
			data?: WpData;
			domReady?: (callback: () => void) => void;
	  }
	| undefined;

/* These are the attribute keys we look through when searching a block's content. */
const CONTENT_KEYS = ['content', 'citation', 'value', 'text'] as const;

/* Make sure we don't accidentally inject HTML — escape special characters. */
const escapeHtml = (text: string): string =>
	text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');

/* The API uses different names for the replacement text, so try them all. */
const getSuggestionText = (correction: ProofreaderCorrection): string =>
	correction.correction ??
	correction.suggestion ??
	correction.replacement ??
	'';

/* Strip HTML tags and just get the readable text out. */
const extractPlainText = (html: string): string => {
	const parser = new DOMParser();
	const documentNode = parser.parseFromString(html, 'text/html');

	return documentNode.body.textContent ?? '';
};

/*
 * Block attributes can be strings, RichText objects, or objects with a value prop.
 * This function tries to pull an HTML string out of any of those shapes.
 */
const getAttributeHtml = (rawValue: unknown): string | null => {
	if (typeof rawValue === 'string') {
		return rawValue;
	}

	if (rawValue && typeof rawValue === 'object') {
		if (typeof (rawValue as any).toString === 'function') {
			try {
				const stringValue = (rawValue as any).toString();
				if (typeof stringValue === 'string' && stringValue.trim()) {
					return stringValue;
				}
			} catch {
				/* toString() can throw for some objects — just move on. */
			}
		}

		if ('value' in rawValue && typeof rawValue.value === 'string') {
			return rawValue.value;
		}
	}

	return null;
};

/*
 * Walk through all blocks (and their children) and grab the text content.
 * Joins everything together with newlines so the proofreader can work on it.
 */
const extractTextFromBlocks = (blocks: Block[]): string =>
	blocks
		.flatMap((block) => {
			const parts: string[] = [];

			for (const key of CONTENT_KEYS) {
				const rawValue = getAttributeHtml(block.attributes?.[key]);
				if (rawValue?.trim()) {
					parts.push(extractPlainText(rawValue));
				}
			}

			if (
				Array.isArray(block.innerBlocks) &&
				block.innerBlocks.length > 0
			) {
				const innerText = extractTextFromBlocks(block.innerBlocks);
				if (innerText.trim()) {
					parts.push(innerText);
				}
			}

			return parts;
		})
		.join('\n');

/*
 * Get all the text from the editor — tries the block editor first, falls back to the classic editor.
 */
const getEditorText = (): string => {
	if (!wp?.data) {
		return '';
	}

	const blockEditor = wp.data.select('core/block-editor');
	if (blockEditor) {
		const blocks = blockEditor.getBlocks();
		if (blocks.length > 0) {
			return extractTextFromBlocks(blocks);
		}
	}

	const editor = wp.data.select('core/editor');
	if (!editor) {
		return '';
	}

	const postContent = editor.getEditedPostContent();
	return extractPlainText(postContent);
};

/*
 * Find an exact string inside HTML and replace it. Works on raw text nodes,
 * so it doesn't mess up HTML tags or attributes.
 */
const replaceTextInHtml = (
	html: string,
	originalSegment: string,
	replacement: string
): string | null => {
	if (html.includes(originalSegment)) {
		return html.replace(originalSegment, replacement);
	}

	const parser = new DOMParser();
	const documentNode = parser.parseFromString(html, 'text/html');
	const walker = documentNode.createTreeWalker(
		documentNode.body,
		NodeFilter.SHOW_TEXT
	);

	while (walker.nextNode()) {
		const currentNode = walker.currentNode;
		const currentValue = currentNode.nodeValue ?? '';
		const matchIndex = currentValue.indexOf(originalSegment);

		if (matchIndex === -1) {
			continue;
		}

		currentNode.nodeValue =
			currentValue.slice(0, matchIndex) +
			replacement +
			currentValue.slice(matchIndex + originalSegment.length);

		return documentNode.body.innerHTML;
	}

	return null;
};

/*
 * Walk through all blocks and swap out the old text for the new one.
 * Returns true once it finds and replaces something.
 */
const updateBlocksText = (
	blocks: Block[],
	originalSegment: string,
	replacement: string,
	dispatch: BlockEditorDispatch
): boolean => {
	for (const block of blocks) {
		for (const key of CONTENT_KEYS) {
			const rawValue = getAttributeHtml(block.attributes?.[key]);
			if (!rawValue) {
				continue;
			}

			const updatedValue = replaceTextInHtml(
				rawValue,
				originalSegment,
				replacement
			);
			if (updatedValue === null) {
				continue;
			}

			dispatch.updateBlockAttributes(block.clientId, {
				[key]: updatedValue,
			});
			return true;
		}

		if (
			Array.isArray(block.innerBlocks) &&
			updateBlocksText(
				block.innerBlocks,
				originalSegment,
				replacement,
				dispatch
			)
		) {
			return true;
		}
	}

	return false;
};

/* Find the text in the editor and replace it with the corrected version. */
const applyCorrection = (
	originalSegment: string,
	replacement: string
): void => {
	if (!wp?.data) {
		return;
	}

	const blockEditor = wp.data.select('core/block-editor');
	const dispatch = wp.data.dispatch('core/block-editor');

	if (!blockEditor || !dispatch) {
		return;
	}

	updateBlocksText(
		blockEditor.getBlocks(),
		originalSegment,
		replacement,
		dispatch
	);
};

/*
 * Wire up the proofreader UI: the proofread button, status messages, the panel
 * showing corrections, and the accept-all button. This is the main entry point.
 */
const initProofreader = (): void => {
	const proofreadButton = document.getElementById(
		'nanopress-proofread-btn'
	) as HTMLButtonElement | null;
	const statusElement = document.getElementById('nanopress-proofread-status');
	const panelElement = document.getElementById(
		'nanopress-proofread-panel'
	) as HTMLElement | null;
	const correctionsElement = document.getElementById(
		'nanopress-proofread-corrections'
	);
	const actionsElement = document.getElementById(
		'nanopress-proofread-actions'
	) as HTMLElement | null;
	const acceptAllButton = document.getElementById(
		'nanopress-accept-all-btn'
	) as HTMLButtonElement | null;

	if (
		!proofreadButton ||
		!statusElement ||
		!panelElement ||
		!correctionsElement ||
		!actionsElement
	) {
		return;
	}

	let currentCorrections: ProofreaderCorrection[] = [];
	let originalText = '';

	const setStatusHtml = (html: string): void => {
		statusElement.innerHTML = html;
	};

	const updateResolvedState = (): void => {
		const items = correctionsElement.querySelectorAll(
			'.nanopress-correction-item'
		);
		const resolved = correctionsElement.querySelectorAll(
			'.nanopress-correction-resolved'
		);

		if (items.length !== resolved.length) {
			return;
		}

		setStatusHtml(
			'<p class="nanopress-proofread-success">All corrections reviewed!</p>'
		);
		actionsElement.hidden = true;
	};

	const handleIgnore = (itemElement: HTMLElement): void => {
		itemElement.classList.add('nanopress-correction-resolved');
		const buttonsElement = itemElement.querySelector(
			'.nanopress-correction-buttons'
		);
		if (buttonsElement) {
			buttonsElement.innerHTML =
				'<span class="nanopress-correction-ignored">Ignored</span>';
		}

		updateResolvedState();
	};

	const handleAcceptSingle = (
		index: number,
		itemElement: HTMLElement
	): void => {
		const correction = currentCorrections[index];
		if (!correction) {
			return;
		}

		const originalSegment = originalText.slice(
			correction.startIndex,
			correction.endIndex
		);
		const suggestion = getSuggestionText(correction);

		applyCorrection(originalSegment, suggestion);
		itemElement.classList.add('nanopress-correction-resolved');

		const buttonsElement = itemElement.querySelector(
			'.nanopress-correction-buttons'
		);
		if (buttonsElement) {
			buttonsElement.innerHTML =
				'<span class="nanopress-correction-accepted">Accepted</span>';
		}

		updateResolvedState();
	};

	const renderCorrections = (): void => {
		correctionsElement.innerHTML = '';

		currentCorrections.forEach((correction, index) => {
			const originalSegment = originalText.slice(
				correction.startIndex,
				correction.endIndex
			);
			if (originalSegment.includes(' ')) {
				return;
			}

			const itemElement = document.createElement('div');
			itemElement.className = 'nanopress-correction-item';

			itemElement.innerHTML = `
				<div class="nanopress-correction-details">
					<span class="nanopress-correction-original"></span>
					<span class="nanopress-correction-arrow"> -> </span>
					<span class="nanopress-correction-suggestion"></span>
				</div>
				<div class="nanopress-correction-buttons"></div>
			`;

			const originalElement = itemElement.querySelector(
				'.nanopress-correction-original'
			);
			const suggestionElement = itemElement.querySelector(
				'.nanopress-correction-suggestion'
			);
			const buttonsElement = itemElement.querySelector(
				'.nanopress-correction-buttons'
			);

			if (!originalElement || !suggestionElement || !buttonsElement) {
				return;
			}

			originalElement.textContent = originalSegment;
			suggestionElement.textContent = getSuggestionText(correction);

			const acceptButton = document.createElement('button');
			acceptButton.className = 'button nanopress-correction-accept';
			acceptButton.type = 'button';
			acceptButton.textContent = 'Accept';
			acceptButton.addEventListener('click', () =>
				handleAcceptSingle(index, itemElement)
			);

			const ignoreButton = document.createElement('button');
			ignoreButton.className = 'button nanopress-correction-ignore';
			ignoreButton.type = 'button';
			ignoreButton.textContent = 'Ignore';
			ignoreButton.addEventListener('click', () =>
				handleIgnore(itemElement)
			);

			buttonsElement.append(acceptButton, ignoreButton);
			correctionsElement.appendChild(itemElement);
		});
	};

	const applyAllCorrections = (): void => {
		for (const correction of currentCorrections) {
			const originalSegment = originalText.slice(
				correction.startIndex,
				correction.endIndex
			);
			if (originalSegment.includes(' ')) {
				continue;
			}

			applyCorrection(originalSegment, getSuggestionText(correction));
		}
	};

	const handleProofread = async (): Promise<void> => {
		if (!window.Proofreader) {
			setStatusHtml(
				'<p class="nanopress-proofread-error">The Proofreader API is not available in this browser.</p>'
			);
			return;
		}

		proofreadButton.disabled = true;
		proofreadButton.classList.add('nanopress-btn-disabled');

		try {
			setStatusHtml('<p>Checking proofreader availability...</p>');
			const availability = await window.Proofreader.availability();

			if (availability === 'unavailable') {
				setStatusHtml(
					'<p class="nanopress-proofread-error">The Proofreader API is not supported in your current browser configuration.</p>'
				);
				return;
			}

			if (
				availability === 'downloadable' ||
				availability === 'downloading'
			) {
				setStatusHtml(
					'<p>Downloading the proofreader model. This may take a moment...</p>'
				);
			}

			const proofreader = await window.Proofreader.create({
				expectedInputLanguages: ['en'],
			});

			originalText = getEditorText();
			if (!originalText.trim()) {
				setStatusHtml(
					'<p class="nanopress-proofread-error">No content found to proofread.</p>'
				);
				return;
			}

			setStatusHtml('<p>Proofreading content...</p>');
			const result = await proofreader.proofread(originalText);
			currentCorrections = result.corrections ?? [];

			if (currentCorrections.length === 0) {
				panelElement.hidden = true;
				actionsElement.hidden = true;
				setStatusHtml(
					'<p class="nanopress-proofread-success">No grammar or spelling issues found.</p>'
				);
				return;
			}

			renderCorrections();
			panelElement.hidden = false;
			actionsElement.hidden = false;
			setStatusHtml(
				`<p>Found ${currentCorrections.length} suggestion(s).</p>`
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unknown error';
			setStatusHtml(
				`<p class="nanopress-proofread-error">An error occurred while proofreading: ${escapeHtml(message)}</p>`
			);
		} finally {
			proofreadButton.disabled = false;
			proofreadButton.classList.remove('nanopress-btn-disabled');
		}
	};

	/* Click the proofread button to start checking the content. */
	proofreadButton.addEventListener('click', () => {
		void handleProofread();
	});

	/* Accept every suggestion at once — batch-apply all corrections. */
	acceptAllButton?.addEventListener('click', () => {
		applyAllCorrections();
		correctionsElement
			.querySelectorAll<HTMLElement>('.nanopress-correction-item')
			.forEach((itemElement) => {
				itemElement.classList.add('nanopress-correction-resolved');
				const buttonsElement = itemElement.querySelector(
					'.nanopress-correction-buttons'
				);
				if (buttonsElement) {
					buttonsElement.innerHTML =
						'<span class="nanopress-correction-accepted">Accepted</span>';
				}
			});
		actionsElement.hidden = true;
		setStatusHtml(
			'<p class="nanopress-proofread-success">All corrections applied.</p>'
		);
	});
};

/* Start as soon as the DOM is ready, whether through wp.domReady or the native event. */
if (wp?.domReady) {
	wp.domReady(initProofreader);
} else {
	document.addEventListener('DOMContentLoaded', initProofreader);
}
