<?php

declare( strict_types=1 );

namespace NanoPress;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'NANOPRESS_VERSION' ) ) {
	define( 'NANOPRESS_VERSION', '1.0.0' );
}

if ( ! defined( 'NANOPRESS_PLUGIN_FILE' ) ) {
	define( 'NANOPRESS_PLUGIN_FILE', defined( 'NANOPRESS_DIR' ) ? NANOPRESS_DIR . 'nanopress.php' : '' );
}

if ( ! defined( 'NANOPRESS_PLUGIN_DIR' ) ) {
	define( 'NANOPRESS_PLUGIN_DIR', defined( 'NANOPRESS_DIR' ) ? NANOPRESS_DIR : '' );
}

if ( ! defined( 'NANOPRESS_PLUGIN_URL' ) ) {
	define( 'NANOPRESS_PLUGIN_URL', plugin_dir_url( NANOPRESS_PLUGIN_FILE ) );
}

/**
 * Loads the plugin classes and boots the plugin.
 */
function load(): void {
	static $loaded = false;

	if ( $loaded ) {
		return;
	}

	require_once NANOPRESS_PLUGIN_DIR . 'includes/autoload.php';

	( new Plugin() )->init();

	$loaded = true;
}

add_action( 'plugins_loaded', __NAMESPACE__ . '\load' );
