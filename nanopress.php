<?php

declare(strict_types=1);

/**
 * Plugin Name: NanoPress
 * Description: A WordPress plugin that uses Translator API to translate content. Please check <a href="https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs#browser_compatibility">supported browsers</a> for compatibility.
 * Version: 1.0
 * Tested up to: 6.9
 * Stable tag: 1.0
 * Author: milindmore22
 * License: GPL2
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: nanopress
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.2
 *
 * @package nanopress
 */

namespace NanoPress;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Define plugin constants.
define( 'NANO_PRESS_VERSION', '1.0' );
define( 'NANO_PRESS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'NANO_PRESS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );


/**
 * Include the main plugin class
 */
require_once NANO_PRESS_PLUGIN_DIR . 'includes/class-nano-press.php';
/**
 * Initialize the plugin.
 *
 * @return void
 */
function nano_press_init() {
	Nano_Press::get_instance();
}
add_action( 'plugins_loaded', '\NanoPress\nano_press_init' );
