<?php

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/../' );
}

if ( ! defined( 'NANOPRESS_DIR' ) ) {
	define( 'NANOPRESS_DIR', dirname( __DIR__ ) . '/' );
}

if ( ! defined( 'NANOPRESS_PLUGIN_FILE' ) ) {
	define( 'NANOPRESS_PLUGIN_FILE', NANOPRESS_DIR . 'nanopress.php' );
}

if ( ! defined( 'NANOPRESS_PLUGIN_DIR' ) ) {
	define( 'NANOPRESS_PLUGIN_DIR', NANOPRESS_DIR );
}

if ( ! defined( 'NANOPRESS_PLUGIN_URL' ) ) {
	define( 'NANOPRESS_PLUGIN_URL', 'http://example.org/wp-content/plugins/nanopress/' );
}
