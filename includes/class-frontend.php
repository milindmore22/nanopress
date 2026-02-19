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
	 * Proofreader enabled
	 *
	 * @var bool
	 */
	private $proofreader_enabled;

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

		// Check if proofreader is enabled.
		$this->proofreader_enabled = $this->is_proofreader_enabled();

		if ( $this->proofreader_enabled ) {
			// Render the proofreader UI in the content.
			add_action( 'the_content', array( $this, 'render_proofreader_placeholder' ) );
			// Enqueue scripts and styles for proofreader.
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_proofreader_scripts' ) );
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
		if ( $this->summarizer_enabled && \is_single() ) {
			$content = '<fieldset class="nanopress-ai-summary-container"><legend>' . esc_html__( 'AI Summary', 'nano-press' ) . '</legend><div id="summary-result"><p>Generating summary...</p></div></fieldset>' . $content;
		}
		return $content;
	}

	/**
	 * Check if proofreader is enabled.
	 *
	 * @return bool
	 */
	public function is_proofreader_enabled() {
		if ( ! isset( $this->proofreader_enabled ) ) {
			$options                   = get_option( 'nanopress_options', array( 'enable_proofreader' => '0' ) );
			$this->proofreader_enabled = ! empty( $options['enable_proofreader'] );
		}

		return $this->proofreader_enabled;
	}

	/**
	 * Enqueue scripts and styles for the proofreader.
	 *
	 * @return void
	 */
	public function enqueue_proofreader_scripts() {
		wp_enqueue_style( 'nanopress-proofreader-style', NANO_PRESS_PLUGIN_URL . 'public/css/nanopress-proofreader.css', array(), NANO_PRESS_VERSION );
		wp_enqueue_script( 'nanopress-proofreader-script', NANO_PRESS_PLUGIN_URL . 'public/js/nanopress-proofreader.js', array(), NANO_PRESS_VERSION, true );
	}

	/**
	 * Render the proofreader button and review panel after content.
	 *
	 * @param string $content The content to be displayed.
	 *
	 * @return string
	 */
	public function render_proofreader_placeholder( $content ) {
		if ( $this->proofreader_enabled && \is_single() ) {
			$proofreader_html  = '<div id="nanopress-proofreader-container" class="nanopress-proofreader-container">';
			$proofreader_html .= '<button id="nanopress-proofread-btn" class="nanopress-proofread-btn">' . esc_html__( 'Proofread', 'nano-press' ) . '</button>';
			$proofreader_html .= '<div id="nanopress-proofread-status" class="nanopress-proofread-status"></div>';
			$proofreader_html .= '<div id="nanopress-proofread-panel" class="nanopress-proofread-panel" style="display:none;">';
			$proofreader_html .= '<h3>' . esc_html__( 'Proofreader Results', 'nano-press' ) . '</h3>';
			$proofreader_html .= '<div id="nanopress-proofread-corrections"></div>';
			$proofreader_html .= '<div id="nanopress-proofread-actions" class="nanopress-proofread-actions" style="display:none;">';
			$proofreader_html .= '<button id="nanopress-accept-all-btn" class="nanopress-accept-all-btn">' . esc_html__( 'Accept All', 'nano-press' ) . '</button>';
			$proofreader_html .= '</div>';
			$proofreader_html .= '</div>';
			$proofreader_html .= '</div>';

			$content .= $proofreader_html;
		}
		return $content;
	}
}
