<?php

declare( strict_types=1 );

namespace NanoPress;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

spl_autoload_register(
	static function ( string $class_name ): void {
		$prefix   = 'NanoPress\\';
		$base_dir = __DIR__ . '/';
		$length   = strlen( $prefix );

		if ( strncmp( $class_name, $prefix, $length ) !== 0 ) {
			return;
		}

		$relative_class = substr( $class_name, $length );
		$file           = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

		if ( ! file_exists( $file ) ) {
			return;
		}

		require $file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
	}
);
