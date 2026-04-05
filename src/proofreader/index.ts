import './style.scss';

type BlockAttributes = Record<string, unknown>;

interface Block {
	clientId: string;
	attributes?: BlockAttributes;
	innerBlocks?: Block[];
}

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

const CONTENT_KEYS = ['content', 'citation', 'value', 'text'] as const;

const getSuggestionText = (correction: ProofreaderCorrection): string =>
	correction.correction ??
	correction.suggestion ??
	correction.replacement ??
	'';

const extractPlainText = (html: string): string => {
	const parser = new DOMParser();
	const documentNode = parser.parseFromString(html, 'text/html');

	return documentNode.body.textContent ?? '';
};

const getAttributeHtml = (rawValue: unknown): string | null => {
	if (typeof rawValue === 'string') {
		return rawValue;
	}

	if (
		rawValue &&
		typeof rawValue === 'object'
	) {
		// Handle RichText objects or objects with a toString() method
		if (typeof (rawValue as any).toString === 'function') {
			try {
				const stringValue = (rawValue as any).toString();
				if (typeof stringValue === 'string' && stringValue.trim()) {
					return stringValue;
				}
			} catch {
				// If toString() fails, continue to next check
			}
		}

		// Handle objects with a value property
		if (
			'value' in rawValue &&
			typeof rawValue.value === 'string'
		) {
			return rawValue.value;
		}
	}

	return null;
};

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

const getEditorText = (): string => {
	if (!wp?.data) {
		console.debug('[Proofreader] wp.data is not available');
		return '';
	}

	const blockEditor = wp.data.select('core/block-editor');
	if (blockEditor) {
		const blocks = blockEditor.getBlocks();
		console.debug('[Proofreader] blocks:', blocks.length, blocks);
		if (blocks.length > 0) {
			const text = extractTextFromBlocks(blocks);
			console.debug('[Proofreader] extractTextFromBlocks result:', JSON.stringify(text));
			return text;
		}
		console.debug('[Proofreader] block editor found but no blocks');
	} else {
		console.debug('[Proofreader] core/block-editor not available');
	}

	const editor = wp.data.select('core/editor');
	if (!editor) {
		console.debug('[Proofreader] core/editor not available');
		return '';
	}

	const postContent = editor.getEditedPostContent();
	console.debug('[Proofreader] post content:', JSON.stringify(postContent));
	return extractPlainText(postContent);
};

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
			console.log(originalText);
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
				`<p class="nanopress-proofread-error">An error occurred while proofreading: ${message}</p>`
			);
		} finally {
			proofreadButton.disabled = false;
			proofreadButton.classList.remove('nanopress-btn-disabled');
		}
	};

	proofreadButton.addEventListener('click', () => {
		void handleProofread();
	});

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

if (wp?.domReady) {
	wp.domReady(initProofreader);
} else {
	document.addEventListener('DOMContentLoaded', initProofreader);
}
