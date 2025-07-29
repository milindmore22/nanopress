<?php
/**
 * AI Translator Plugin Frontend Class
 *
 * @package nano-press
 */

namespace NanoPress;

/**
 * Frontend class for the NanoPress plugin.
 */
class Frontend {

	/**
	 * Translation enabled
	 *
	 * @var bool
	 */
	private $translation_enabled;

	/**
	 * Summarizer enabled
	 *
	 * @var bool
	 */
	private $summarizer_enabled;

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Check if translation is enabled.
		$this->translation_enabled = $this->is_translation_enabled();

		if ( $this->translation_enabled ) {
			// Render the language selector in the footer.
			add_action( 'wp_footer', array( $this, 'render_language_selector' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_translation_scripts' ) );
		}

		// Check if summarizer is enabled.
		$this->summarizer_enabled = $this->is_summarizer_enabled();

		if ( $this->summarizer_enabled ) {
			// Render the summarizer placeholder in the content.
			add_action( 'the_content', array( $this, 'render_summarizer_placeholder' ) );
			// Enqueue scripts for summarizer.
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_summarizer_scripts' ) );
		}
	}

	/**
	 * Enqueue scripts and styles for the summarizer.
	 *
	 * @return void
	 */
	public function enqueue_summarizer_scripts() {
		wp_enqueue_script( 'markdown', 'https://cdn.jsdelivr.net/npm/marked/marked.min.js', array(), NANO_PRESS_VERSION, true );
		wp_enqueue_script( 'nanopress-summarizer-script', NANO_PRESS_PLUGIN_URL . 'public/js/nanopress-summarizer.js', array( 'markdown' ), NANO_PRESS_VERSION, true );
	}

	/**
	 * Enqueue translation scripts and styles.
	 *
	 * @return void
	 */
	public function enqueue_translation_scripts() {
		wp_enqueue_style( 'nanopress-translation-style', NANO_PRESS_PLUGIN_URL . 'public/css/nanopress-translation.css', array(), NANO_PRESS_VERSION );
		wp_enqueue_script( 'nanopress-translation-script', NANO_PRESS_PLUGIN_URL . 'public/js/nanopress-translation.js', array( 'jquery' ), NANO_PRESS_VERSION, true );
	}

	/**
	 * Render the language selector in the footer.
	 *
	 * @return void
	 */
	public function render_language_selector() {
		// Get the selected target languages and all supported languages.
		$selected_target_languages = get_option( 'nanopress_options', array( 'en' ) );
		$all_languages             = Settings::get_supported_languages();
		$site_language             = get_locale();
		// split en_US into en and US.
		$site_language_parts = explode( '_', $site_language );
		?>
		<div id="ai-translator-language-selector">
			<select id="language-dropdown">
				<?php foreach ( $all_languages as $code => $name ) : ?>
					<?php if ( in_array( $code, $selected_target_languages['target_language'], true ) ) : ?>
						<option value="<?php echo esc_attr( $code ); ?>" <?php selected( $code, $site_language_parts[0] ); ?>>
							<?php echo esc_html( $name ); ?>
						</option>
					<?php endif; ?>
				<?php endforeach; ?>
				<!-- Add more languages as needed -->
			</select>
			<div id="status"></div>
		</div>
		<?php
	}

	/**
	 * Check if translation is enabled.
	 *
	 * @return bool
	 */
	public function is_translation_enabled() {
		if ( ! isset( $this->translation_enabled ) ) {
			$options                   = get_option( 'nanopress_options', array( 'enable_translation' => '0' ) );
			$this->translation_enabled = ! empty( $options['enable_translation'] );
		}

		return $this->translation_enabled;
	}

	/**
	 * Check if summarizer is enabled.
	 *
	 * @return bool
	 */
	public function is_summarizer_enabled() {
		if ( ! isset( $this->summarizer_enabled ) ) {
			$options                  = get_option( 'nanopress_options', array( 'enable_summarizer' => '0' ) );
			$this->summarizer_enabled = ! empty( $options['enable_summarizer'] );
		}

		return $this->summarizer_enabled;
	}

	/**
	 * Render the summarizer placeholder before content.
	 *
	 * @param string $content The content to be displayed.
	 *
	 * @return string
	 */
	public function render_summarizer_placeholder( $content ) {
		if ( $this->summarizer_enabled ) {
			$content = '<fieldset class="nanopress-ai-summary-container"><legend>' . esc_html__( 'AI Summary', 'nano-press' ) . '</legend><div id="summary-result"><p>Generating summary...</p></div></fieldset>' . $content;
		}
		return $content;
	}
}
