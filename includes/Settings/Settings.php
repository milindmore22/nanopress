<?php

declare( strict_types=1 );

namespace NanoPress\Settings;

/**
 * Registers NanoPress settings.
 */
class Settings {

	/**
	 * Settings page slug.
	 *
	 * @var string
	 */
	private $page_slug = 'nanopress-settings';

	/**
	 * Settings option name.
	 *
	 * @var string
	 */
	private $option_name = 'nanopress_options';

	/**
	 * Settings option group.
	 *
	 * @var string
	 */
	private $option_group = 'nanopress_option_group';

	/**
	 * Current option values.
	 *
	 * @var array<string, mixed>
	 */
	private $options = array();

	/**
	 * Whether the current site is served over SSL.
	 *
	 * @var bool
	 */
	private $is_ssl;

	/**
	 * Hooks the settings UI into WordPress.
	 */
	public function init(): void {
		$this->is_ssl = is_ssl();

		add_action( 'admin_menu', array( $this, 'add_plugin_page' ) );
		add_action( 'admin_init', array( $this, 'page_init' ) );
	}

	/**
	 * Returns supported translation languages.
	 *
	 * @return array<string, string>
	 */
	public static function get_supported_languages(): array {
		return array(
			'af'    => 'Afrikaans',
			'sq'    => 'Albanian',
			'am'    => 'Amharic',
			'ar'    => 'Arabic',
			'hy'    => 'Armenian',
			'az'    => 'Azerbaijani',
			'eu'    => 'Basque',
			'be'    => 'Belarusian',
			'bn'    => 'Bengali',
			'bs'    => 'Bosnian',
			'bg'    => 'Bulgarian',
			'ca'    => 'Catalan',
			'ceb'   => 'Cebuano',
			'ny'    => 'Chichewa',
			'zh-CN' => 'Chinese (Simplified)',
			'zh-TW' => 'Chinese (Traditional)',
			'co'    => 'Corsican',
			'hr'    => 'Croatian',
			'cs'    => 'Czech',
			'da'    => 'Danish',
			'nl'    => 'Dutch',
			'en'    => 'English',
			'eo'    => 'Esperanto',
			'et'    => 'Estonian',
			'tl'    => 'Filipino',
			'fi'    => 'Finnish',
			'fr'    => 'French',
			'fy'    => 'Frisian',
			'gl'    => 'Galician',
			'ka'    => 'Georgian',
			'de'    => 'German',
			'el'    => 'Greek',
			'gu'    => 'Gujarati',
			'ht'    => 'Haitian Creole',
			'ha'    => 'Hausa',
			'haw'   => 'Hawaiian',
			'iw'    => 'Hebrew',
			'hi'    => 'Hindi',
			'hmn'   => 'Hmong',
			'hu'    => 'Hungarian',
			'is'    => 'Icelandic',
			'ig'    => 'Igbo',
			'id'    => 'Indonesian',
			'ga'    => 'Irish',
			'it'    => 'Italian',
			'ja'    => 'Japanese',
			'jw'    => 'Javanese',
			'kn'    => 'Kannada',
			'kk'    => 'Kazakh',
			'km'    => 'Khmer',
			'ko'    => 'Korean',
			'ku'    => 'Kurdish (Kurmanji)',
			'ky'    => 'Kyrgyz',
			'lo'    => 'Lao',
			'la'    => 'Latin',
			'lv'    => 'Latvian',
			'lt'    => 'Lithuanian',
			'lb'    => 'Luxembourgish',
			'mk'    => 'Macedonian',
			'mg'    => 'Malagasy',
			'ms'    => 'Malay',
			'ml'    => 'Malayalam',
			'mt'    => 'Maltese',
			'mi'    => 'Maori',
			'mr'    => 'Marathi',
			'mn'    => 'Mongolian',
			'my'    => 'Myanmar (Burmese)',
			'ne'    => 'Nepali',
			'no'    => 'Norwegian',
			'ps'    => 'Pashto',
			'fa'    => 'Persian',
			'pl'    => 'Polish',
			'pt'    => 'Portuguese',
			'pa'    => 'Punjabi',
			'ro'    => 'Romanian',
			'ru'    => 'Russian',
			'sm'    => 'Samoan',
			'gd'    => 'Scots Gaelic',
			'sr'    => 'Serbian',
			'st'    => 'Sesotho',
			'sn'    => 'Shona',
			'sd'    => 'Sindhi',
			'si'    => 'Sinhala',
			'sk'    => 'Slovak',
			'sl'    => 'Slovenian',
			'so'    => 'Somali',
			'es'    => 'Spanish',
			'su'    => 'Sundanese',
			'sw'    => 'Swahili',
			'sv'    => 'Swedish',
			'tg'    => 'Tajik',
			'ta'    => 'Tamil',
			'te'    => 'Telugu',
			'th'    => 'Thai',
			'tr'    => 'Turkish',
			'uk'    => 'Ukrainian',
			'ur'    => 'Urdu',
			'uz'    => 'Uzbek',
			'vi'    => 'Vietnamese',
			'cy'    => 'Welsh',
			'xh'    => 'Xhosa',
			'yi'    => 'Yiddish',
			'yo'    => 'Yoruba',
			'zu'    => 'Zulu',
		);
	}

	/**
	 * Returns default settings.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_default_settings(): array {
		return array(
			'target_language'     => array( 'en' ),
			'enable_translation'  => false,
			'enable_summarizer'   => false,
			'enable_proofreader'  => false,
		);
	}

	/**
	 * Adds the settings page.
	 */
	public function add_plugin_page(): void {
		add_options_page(
			__( 'NanoPress Settings', 'nanopress' ),
			__( 'NanoPress', 'nanopress' ),
			'manage_options',
			$this->page_slug,
			array( $this, 'create_admin_page' )
		);
	}

	/**
	 * Renders the settings page.
	 */
	public function create_admin_page(): void {
		$this->options = get_option( $this->option_name, self::get_default_settings() );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'NanoPress Settings', 'nanopress' ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( $this->option_group );
				do_settings_sections( $this->page_slug );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Registers settings sections and fields.
	 */
	public function page_init(): void {
		register_setting(
			$this->option_group,
			$this->option_name,
			array(
				'sanitize_callback' => array( $this, 'sanitize' ),
				'default'           => self::get_default_settings(),
				'type'              => 'array',
			)
		);

		add_settings_section( 'main_settings_section', __( 'Translation Settings', 'nanopress' ), '__return_false', $this->page_slug );
		add_settings_field( 'enable_translation', __( 'Enable Translation', 'nanopress' ), array( $this, 'render_enable_translation_field' ), $this->page_slug, 'main_settings_section' );
		add_settings_field( 'target_language', __( 'Default Target Language(s)', 'nanopress' ), array( $this, 'render_language_field' ), $this->page_slug, 'main_settings_section' );

		add_settings_section( 'summarizer_settings_section', __( 'Summarizer Settings', 'nanopress' ), '__return_false', $this->page_slug );
		add_settings_field( 'enable_summarizer', __( 'Enable Summarizer', 'nanopress' ), array( $this, 'render_enable_summarizer_field' ), $this->page_slug, 'summarizer_settings_section' );

		add_settings_section( 'proofreader_settings_section', __( 'Proofreader Settings', 'nanopress' ), '__return_false', $this->page_slug );
		add_settings_field( 'enable_proofreader', __( 'Enable Proofreader', 'nanopress' ), array( $this, 'render_enable_proofreader_field' ), $this->page_slug, 'proofreader_settings_section' );
	}

	/**
	 * Sanitizes option values.
	 *
	 * @param array<string, mixed> $input Submitted values.
	 * @return array<string, mixed>
	 */
	public function sanitize( $input ): array {
		$sanitized           = self::get_default_settings();
		$supported_languages = self::get_supported_languages();

		if ( isset( $input['target_language'] ) && is_array( $input['target_language'] ) ) {
			$sanitized['target_language'] = array_values(
				array_filter(
					array_map( 'sanitize_text_field', $input['target_language'] ),
					static function ( string $language_code ) use ( $supported_languages ): bool {
						return array_key_exists( $language_code, $supported_languages );
					}
				)
			);
		}

		if ( empty( $sanitized['target_language'] ) ) {
			$sanitized['target_language'] = self::get_default_settings()['target_language'];
		}

		$sanitized['enable_translation'] = ! empty( $input['enable_translation'] ) && $this->is_ssl;
		$sanitized['enable_summarizer']  = ! empty( $input['enable_summarizer'] ) && $this->is_ssl;
		$sanitized['enable_proofreader'] = ! empty( $input['enable_proofreader'] ) && $this->is_ssl;

		return $sanitized;
	}

	/**
	 * Renders the language multiselect.
	 */
	public function render_language_field(): void {
		$saved_languages = (array) ( $this->options['target_language'] ?? self::get_default_settings()['target_language'] );

		printf(
			'<select name="%1$s[target_language][]" multiple size="10" style="width: 100%%; max-width: 400px;">',
			esc_attr( $this->option_name )
		);

		foreach ( self::get_supported_languages() as $code => $name ) {
			printf(
				'<option value="%1$s" %2$s>%3$s</option>',
				esc_attr( $code ),
				selected( in_array( $code, $saved_languages, true ), true, false ),
				esc_html( $name )
			);
		}

		echo '</select>';
		echo '<p class="description">' . esc_html__( 'Hold Command or Ctrl to select multiple languages.', 'nanopress' ) . '</p>';
	}

	/**
	 * Renders the translation checkbox.
	 */
	public function render_enable_translation_field(): void {
		$this->render_checkbox_field( 'enable_translation', __( 'Enable Translation', 'nanopress' ), __( 'Check this box to enable the floating translation control.', 'nanopress' ) );
	}

	/**
	 * Renders the summarizer checkbox.
	 */
	public function render_enable_summarizer_field(): void {
		$this->render_checkbox_field( 'enable_summarizer', __( 'Enable Summarizer', 'nanopress' ), __( 'Check this box to enable the summarizer feature.', 'nanopress' ) );
	}

	/**
	 * Renders the proofreader checkbox.
	 */
	public function render_enable_proofreader_field(): void {
		$this->render_checkbox_field( 'enable_proofreader', __( 'Enable Proofreader', 'nanopress' ), __( 'Check this box to enable grammar and spelling checks in the editor.', 'nanopress' ) );
	}

	/**
	 * Renders a checkbox field.
	 *
	 * @param string $key         Option key.
	 * @param string $label       Input label.
	 * @param string $description Field description.
	 */
	private function render_checkbox_field( string $key, string $label, string $description ): void {
		$checked  = ! empty( $this->options[ $key ] ) && $this->is_ssl;
		$disabled = $this->is_ssl ? '' : 'disabled="disabled"';

		printf(
			'<input type="checkbox" id="%1$s[%2$s]" name="%1$s[%2$s]" value="1" %3$s %4$s />',
			esc_attr( $this->option_name ),
			esc_attr( $key ),
			checked( $checked, true, false ),
			$disabled // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);

		printf(
			'<label for="%1$s[%2$s]"> %3$s</label>',
			esc_attr( $this->option_name ),
			esc_attr( $key ),
			esc_html( $label )
		);

		echo '<p class="description">' . esc_html( $description ) . '</p>';

		if ( $this->is_ssl ) {
			return;
		}

		echo '<p class="description">' . esc_html__( 'This feature requires HTTPS.', 'nanopress' ) . '</p>';
	}
}
