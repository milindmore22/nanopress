<?php

declare( strict_types=1 );

/**
 * Cleans up NanoPress data on uninstall.
 *
 * @package nanopress
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'nanopress_options' );
