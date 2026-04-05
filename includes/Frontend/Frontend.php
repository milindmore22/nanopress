<?php

declare( strict_types=1 );

namespace NanoPress\Frontend;

use NanoPress\Asset_Loader;
use NanoPress\Settings\Settings;

/**
 * Handles NanoPress frontend features.
 */
class Frontend {

	/**
	 * Boots frontend hooks.
	 */
	public function init(): void {
		if ( $this->is_translation_enabled() ) {
			add_action( 'wp_footer', array( $this, 'render_language_selector' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_translation_assets' ) );
		}

		if ( ! $this->is_summarizer_enabled() ) {
			return;
		}

		add_filter( 'the_content', array( $this, 'render_summarizer_placeholder' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_summarizer_assets' ) );
	}

	/**
	 * Enqueues translation styles and scripts.
	 */
	public function enqueue_translation_assets(): void {
		Asset_Loader::enqueue_style( 'translation', 'style-translation' );
		Asset_Loader::enqueue_script( 'translation', 'translation' );
	}

	/**
	 * Enqueues summarizer scripts.
	 */
	public function enqueue_summarizer_assets(): void {
		Asset_Loader::enqueue_script( 'summarizer', 'summarizer' );
	}

	/**
	 * Renders the language switcher.
	 */
	public function render_language_selector(): void {
		$options            = get_option( 'nanopress_options', Settings::get_default_settings() );
		$selected_languages = (array) ( $options['target_language'] ?? array( 'en' ) );
		$site_language      = explode( '_', get_locale() )[0];
		?>
		<div id="ai-translator-language-selector">
			<label class="screen-reader-text" for="language-dropdown">
				<?php esc_html_e( 'Translate this page', 'nanopress' ); ?>
			</label>
			<select id="language-dropdown">
				<option value=""><?php esc_html_e( 'Translate page', 'nanopress' ); ?></option>
				<?php foreach ( Settings::get_supported_languages() as $code => $name ) : ?>
					<?php if ( in_array( $code, $selected_languages, true ) ) : ?>
						<option value="<?php echo esc_attr( $code ); ?>" <?php selected( $code, $site_language ); ?>>
							<?php echo esc_html( $name ); ?>
						</option>
					<?php endif; ?>
				<?php endforeach; ?>
			</select>
			<div id="status" aria-live="polite"></div>
		</div>
		<?php
	}

	/**
	 * Determines whether translation is enabled.
	 */
	private function is_translation_enabled(): bool {
		$options = get_option( 'nanopress_options', array( 'enable_translation' => false ) );

		return ! empty( $options['enable_translation'] );
	}

	/**
	 * Determines whether summarizer is enabled.
	 */
	private function is_summarizer_enabled(): bool {
		$options = get_option( 'nanopress_options', array( 'enable_summarizer' => false ) );

		return ! empty( $options['enable_summarizer'] );
	}

	/**
	 * Prepends the summarizer container to post content.
	 *
	 * @param string $content Post content.
	 */
	public function render_summarizer_placeholder( string $content ): string {
		if ( ! is_single() ) {
			return $content;
		}

		return '<fieldset class="nanopress-ai-summary-container"><legend>' .
			esc_html__( 'AI Summary', 'nanopress' ) .
			'</legend><div id="summary-result"><p>' .
			esc_html__( 'Generating summary...', 'nanopress' ) .
			'</p></div></fieldset>' . $content;
	}
}
