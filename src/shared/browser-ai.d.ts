/*
 * Type declarations for browser-native AI APIs (Language Detector, Summarizer,
 * Translator, Proofreader). These are built-in browser APIs, not something we
 * ship — we're just telling TypeScript what shape they have.
 */
declare global {
	interface Window {
		LanguageDetector?: LanguageDetectorConstructor;
		Proofreader?: ProofreaderConstructor;
		Summarizer?: SummarizerConstructor;
		Translator?: TranslatorConstructor;
	}

	/* A single correction the proofreader suggests — wrong word position + what to replace it with. */
	interface ProofreaderCorrection {
		startIndex: number;
		endIndex: number;
		correction?: string;
		suggestion?: string;
		replacement?: string;
	}

	/* The result you get back after proofreading some text — a list of corrections. */
	interface ProofreaderResult {
		corrections?: ProofreaderCorrection[];
	}

	interface ProofreaderInstance {
		proofread( text: string ): Promise<ProofreaderResult>;
	}

	interface ProofreaderConstructor {
		availability(): Promise<string>;
		create( options: { expectedInputLanguages: string[] } ): Promise<ProofreaderInstance>;
	}

	interface TranslatorInstance {
		translate( text: string ): Promise<string>;
	}

	interface TranslatorConstructor {
		availability( options: { sourceLanguage: string; targetLanguage: string } ): Promise<string>;
		create( options: { sourceLanguage: string; targetLanguage: string } ): Promise<TranslatorInstance>;
	}

	interface LanguageDetectorResult {
		detectedLanguage: string;
	}

	interface LanguageDetectorInstance {
		detect( text: string ): Promise<LanguageDetectorResult[]>;
	}

	interface LanguageDetectorConstructor {
		create(): Promise<LanguageDetectorInstance>;
	}

	interface SummarizerMonitor extends EventTarget {}

	/* Options you pass when creating a summarizer — tells it the type of summary, length, language, etc. */
	interface SummarizerOptions {
		sharedContext: string;
		type: string;
		format: string;
		length: string;
		expectedContextLanguages: string[];
		expectedInputLanguages: string[];
		outputLanguage: string;
		monitor?: ( monitor: SummarizerMonitor ) => void;
	}

	interface SummarizerInstance {
		summarize( text: string ): Promise<string>;
	}

	interface SummarizerConstructor {
		availability( options: {
			expectedInputLanguages: string[];
			outputLanguage: string;
			type: string;
			format: string;
			length: string;
		} ): Promise<string>;
		create( options: SummarizerOptions ): Promise<SummarizerInstance>;
	}

	/* These live at the global scope (not on window) per the spec. */
	const Proofreader: ProofreaderConstructor | undefined;
	const Translator: TranslatorConstructor | undefined;
	const LanguageDetector: LanguageDetectorConstructor | undefined;
	const Summarizer: SummarizerConstructor | undefined;
}

export {};
