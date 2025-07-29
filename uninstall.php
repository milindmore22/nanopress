<?php
/**
 * Uninstall the AI Translator plugin.
 *
 * This file is called when the plugin is uninstalled.
 * It removes any stored data associated with the plugin.
 *
 * @package AI_Translator
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
