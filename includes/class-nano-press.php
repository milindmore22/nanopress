<?php
/**
 * Class for NanoPress Plugin
 *
 * @package NanoPress
 */

namespace NanoPress;

/**
 * Class Nano_Press
 *
 * This class is responsible for managing the core functionality of the NanoPress plugin,
 * including initializing the Translator API and handling language translations.
 */
class Nano_Press {

	/**
	 * The instance of the nanopress instance.
	 *
	 * @var Nano_Press
	 */
	private static $instance = null;

	/**
	 * Frontend instance.
	 *
	 * @var Frontend
	 */
	private $frontend;

	/**
	 * Settings instance.
	 *
	 * @var Nano_Press_Settings
	 */
	private $settings;

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Nano_Press
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->init();
		}
		return self::$instance;
	}

	/**
	 * Initialize the plugin.
	 *
	 * @return void
	 */
	private function init() {

		// Load Settings class.
		require_once NANO_PRESS_PLUGIN_DIR . 'includes/class-settings.php';
		$this->settings = new Settings();

		// Load the frontend class.
		require_once NANO_PRESS_PLUGIN_DIR . 'includes/class-frontend.php';
		$this->frontend = new Frontend();
	}
}
