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

define( 'NANOPRESS_DIR', plugin_dir_path( __FILE__ ) );

require_once NANOPRESS_DIR . 'includes/bootstrap.php';
