<?php
/**
 * NanoPress Plugin Settings Class.
 *
 * @package NanoPress
 */

namespace NanoPress;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings Class.
 */
class Settings {

	/**
	 * The single array of options stored in the wp_options table.
	 *
	 * @var array
	 */
	private $options;

	/**
	 * The unique identifier for the settings page.
	 *
	 * @var string
	 */
	private $page_slug = 'nanopress-settings';

	/**
	 * The option name as stored in the database.
	 *
	 * @var string
	 */
	private $option_name = 'nanopress_options';

	/**
	 * The option group used for settings_fields().
	 *
	 * @var string
	 */
	private $option_group = 'nanopress_option_group';

	/**
	 * The boolean variable to check if the site is using SSL.
	 *
	 * @var bool
	 */
	private $is_ssl;

	/**
	 * Constructor. Hooks into WordPress actions.
	 */
	public function __construct() {
		// Hook into the admin menu creation process.
		add_action( 'admin_menu', array( $this, 'add_plugin_page' ) );

		// Hook into the admin initialization process to register our settings.
		add_action( 'admin_init', array( $this, 'page_init' ) );

		// Check if the site is using SSL.
		$this->is_ssl = is_ssl() ? true : false;
	}

	/**
	 * Provides the list of languages supported by Google Translate.
	 *
	 * @return array An associative array of language codes and names.
	 */
	public static function get_supported_languages(): array {
		// A comprehensive list of languages supported by Google Translate API.
		// Key is the ISO 639-1 code, value is the language name.
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
	 * Provides the default values for all settings.
	 *
	 * @return array The default settings.
	 */
	private static function get_default_settings(): array {
		return array(
			'target_language' => array( 'en' => 'English' ), // Default is now an array.
		);
	}

	/**
	 * Adds the settings page to the WordPress admin menu (under "Settings").
	 */
	public function add_plugin_page() {
		add_options_page(
			'NanoPress Settings',      // Page title.
			'NanoPress',               // Menu title.
			'manage_options',              // Capability required.
			$this->page_slug,              // Menu slug.
			array( $this, 'create_admin_page' ) // Callback function to render the page.
		);
	}

	/**
	 * Renders the HTML for the settings page.
	 */
	public function create_admin_page() {
		// Retrieve the options from the database, with defaults if they don't exist.
		$this->options = get_option( $this->option_name, self::get_default_settings() );
		?>
		<div class="wrap">
			<h1>NanoPress Settings</h1>
			<form method="post" action="options.php">
				<?php
				// This function outputs the necessary hidden fields (nonce, etc.).
				settings_fields( $this->option_group );

				// This function prints all settings sections and fields for the page.
				do_settings_sections( $this->page_slug );

				// This function prints the submit button.
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Registers the settings, sections, and fields with the Settings API.
	 */
	public function page_init() {
		// Register the setting itself. This tells WordPress to handle saving.
		register_setting(
			$this->option_group,                // Option group.
			$this->option_name,                 // Option name.
		);

		// Add a settings section for Translation API.
		add_settings_section(
			'main_settings_section',       // ID.
			'Translation Settings',        // Title.
			null,                          // Callback (optional description).
			$this->page_slug               // Page slug.
		);

		// Add each settings field.
		add_settings_field( 'enable_translation', 'Enable Translation', array( $this, 'render_enable_translation_field' ), $this->page_slug, 'main_settings_section' );
		add_settings_field( 'target_language', 'Default Target Language(s)', array( $this, 'render_language_field' ), $this->page_slug, 'main_settings_section' );

		// Add setting section for Summarizer API.
		add_settings_section(
			'summarizer_settings_section', // ID.
			'Summarizer Settings',          // Title.
			null,                           // Callback (optional description).
			$this->page_slug                // Page slug.
		);

		\add_settings_field( 'enable_summarizer', 'Enable Summarizer', array( $this, 'render_enable_summarizer_field' ), $this->page_slug, 'summarizer_settings_section' );
		\add_settings_field( 'prompt', 'Prompt', array( $this, 'render_prompt_field' ), $this->page_slug, 'summarizer_settings_section' );
		\add_settings_field( 'summary_type', 'Summary Type', array( $this, 'render_summary_type_field' ), $this->page_slug, 'summarizer_settings_section' );
		\add_settings_field( 'summary_length', 'Summary Length', array( $this, 'render_summary_length_field' ), $this->page_slug, 'summarizer_settings_section' );
		\add_settings_field( 'summary_format', 'Summary Format', array( $this, 'render_summary_format_field' ), $this->page_slug, 'summarizer_settings_section' );
	}

	/**
	 * Sanitizes and validates the input array before saving to the database.
	 *
	 * @param array $input The array of settings from the form submission.
	 * @return array The sanitized array of settings.
	 */
	public function sanitize( $input ): array {
		$sanitized_input     = array();
		$defaults            = self::get_default_settings();
		$current_options     = get_option( $this->option_name, $defaults );
		$supported_languages = self::get_supported_languages();

		// Sanitize the 'target_language' field - now handles multiple selections.
		if ( isset( $input['target_language'] ) && is_array( $input['target_language'] ) ) {
			$sanitized_input['target_language'] = array();
			foreach ( $input['target_language'] as $language_code ) {
				if ( array_key_exists( $language_code, $supported_languages ) ) {
					$sanitized_input['target_language'][] = $language_code;
				}
			}
			// If no valid languages selected, use current options or default.
			if ( empty( $sanitized_input['target_language'] ) ) {
				$sanitized_input['target_language'] = $current_options['target_language'] ?? $defaults['target_language'];
			}
		} else {
			// Fallback to current or default if input is not a valid array.
			$sanitized_input['target_language'] = $current_options['target_language'] ?? $defaults['target_language'];
		}

		// Sanitize the 'enable_translation' field.
		if ( isset( $input['enable_translation'] ) && $input['enable_translation'] ) {
			$sanitized_input['enable_translation'] = true; // Checkbox is checked.
		} else {
			$sanitized_input['enable_translation'] = false; // Checkbox is unchecked.
		}

		return $sanitized_input;
	}

	/**
	 * Renders the HTML for the 'target_language' multiselect field.
	 */
	public function render_language_field() {
		$saved_languages = $this->options['target_language'] ?? self::get_default_settings()['target_language'];
		// Ensure it's always an array for the in_array() check.
		$saved_languages = (array) $saved_languages;

		// The name attribute must be an array to capture multiple values.
		echo '<select name="' . esc_attr( $this->option_name ) . '[target_language][]" multiple size="10" style="width: 100%; max-width: 400px;">';
		foreach ( self::get_supported_languages() as $code => $name ) {
			// Check if the current language code is in the array of saved languages.
			$is_selected = in_array( $code, $saved_languages, true );
			echo '<option value="' . esc_attr( $code ) . '" ' . selected( $is_selected, true, false ) . '>' . esc_html( $name ) . '</option>';
		}
		echo '</select>';
		echo '<p class="description">Hold down the Ctrl (Windows) or Command (Mac) button to select multiple languages.</p>';
		echo '<p class="description"><b>Not all languages are supported for translation yet.</b></p>';
	}

	/**
	 * Renders the HTML for the 'enable_translation' checkbox field.
	 */
	public function render_enable_translation_field() {
		$checked  = isset( $this->options['enable_translation'] ) && $this->options['enable_translation'] ? '1' : '0';
		$disabled = $this->is_ssl ? '' : 'disabled="disabled"'; // Disable if not using SSL.
		$checked  = $this->is_ssl ? $checked : '0'; // Ensure $checked is always '0' or '1'.

		echo '<input type="checkbox" id="' . esc_attr( $this->option_name ) . '[enable_translation]" name="' . esc_attr( $this->option_name ) . '[enable_translation]" value="1" ' . checked( '1', $checked, false ) . ' ' . esc_attr( $disabled ) . ' />';
		echo '<label for="' . esc_attr( $this->option_name ) . '[enable_translation]"> Enable Translation</label>';
		echo '<p class="description">Check this box to enable floating translation control.</p>';
	}

	/**
	 * Renders the HTML for the 'enable_summarizer' checkbox field.
	 */
	public function render_enable_summarizer_field() {
		// Check if the summarizer option is set and enabled.
		$checked  = isset( $this->options['enable_summarizer'] ) && $this->options['enable_summarizer'] ? '1' : '0';
		$disabled = $this->is_ssl ? '' : 'disabled="disabled"'; // Disable if not using SSL.
		$checked  = $this->is_ssl ? $checked : '0'; // Ensure $checked is always '0' or '1'.

		// Render the checkbox input.
		echo '<input type="checkbox" id="' . esc_attr( $this->option_name ) . '[enable_summarizer]" name="' . esc_attr( $this->option_name ) . '[enable_summarizer]" value="1" ' . checked( '1', $checked, false ) . ' ' . esc_attr( $disabled ) . ' />';
		echo '<label for="' . esc_attr( $this->option_name ) . '[enable_summarizer]"> Enable Summarizer</label>';
		echo '<p class="description">Check this box to enable the summarizer feature.</p>';
	}

	/**
	 * Renders the HTML for the 'prompt' text field.
	 */
	public function render_prompt_field() {
		// Default prompt if not set.
		$prompt = isset( $this->options['prompt'] ) ? esc_textarea( $this->options['prompt'] ) : 'Summarize the key points of the following article in a concise paragraph.';

		// Render the textarea input for the prompt.
		echo '<textarea id="' . esc_attr( $this->option_name ) . '[prompt]" name="' . esc_attr( $this->option_name ) . '[prompt]" rows="5" style="width: 100%; max-width: 400px;" placeholder="Summarize the key points of the following article in a concise paragraph.">' . \esc_textarea( $prompt ) . '</textarea>';
		echo '<p class="description">Enter the prompt to be used for summarization. This will be sent to the AI service.</p>';
	}

	/**
	 * Renders the HTML for the 'summary_type' select field.
	 */
	public function render_summary_type_field() {
		// Default to 'key-points' if not set.
		$summary_type = isset( $this->options['summary_type'] ) ? $this->options['summary_type'] : 'key-points';

		// Define the available types.
		$types = array(
			'key-points' => 'Key Points',
			'tldr'       => 'TL;DR',
			'teaser'     => 'Teaser',
			'headline'   => 'Headline',
		);

		// Render the select field.
		echo '<select id="' . esc_attr( $this->option_name ) . '[summary_type]" name="' . esc_attr( $this->option_name ) . '[summary_type]" style="width: 100%; max-width: 400px;">';
		foreach ( $types as $value => $label ) {
			echo '<option value="' . esc_attr( $value ) . '" ' . selected( $summary_type, $value, false ) . '>' . esc_html( $label ) . '</option>';
		}
		echo '</select>';
		echo '<p class="description">Select the type of summary to generate.</p>';
	}

	/**
	 * Renders the HTML for the 'summary_length' select field.
	 */
	public function render_summary_length_field() {
		// Default to 'medium' if not set.
		$summary_length = isset( $this->options['summary_length'] ) ? $this->options['summary_length'] : 'medium';

		// Define the available lengths.
		$lengths = array(
			'short'  => 'Short (1-2 sentences)',
			'medium' => 'Medium (3-5 sentences)',
			'long'   => 'Long (5+ sentences)',
		);

		// Render the select field.
		echo '<select id="' . esc_attr( $this->option_name ) . '[summary_length]" name="' . esc_attr( $this->option_name ) . '[summary_length]" style="width: 100%; max-width: 400px;">';
		foreach ( $lengths as $value => $label ) {
			echo '<option value="' . esc_attr( $value ) . '" ' . selected( $summary_length, $value, false ) . '>' . esc_html( $label ) . '</option>';
		}
		echo '</select>';
		echo '<p class="description">Select the desired length of the summary.</p>';
	}

	/**
	 * Renders the HTML for the 'summary_format' select field.
	 */
	public function render_summary_format_field() {
		// Default to 'text' if not set.
		$summary_format = isset( $this->options['summary_format'] ) ? $this->options['summary_format'] : 'text';

		// Define the available formats.
		$formats = array(
			'plain-text' => 'Plain Text',
			'markdown'   => 'Markdown',
		);

		// Render the select field.
		echo '<select id="' . esc_attr( $this->option_name ) . '[summary_format]" name="' . esc_attr( $this->option_name ) . '[summary_format]" style="width: 100%; max-width: 400px;">';
		foreach ( $formats as $value => $label ) {
			echo '<option value="' . esc_attr( $value ) . '" ' . selected( $summary_format, $value, false ) . '>' . esc_html( $label ) . '</option>';
		}
		echo '</select>';

		// Provide a description for the field.
		echo '<p class="description">Select the format for the summary output.</p>';
	}
}