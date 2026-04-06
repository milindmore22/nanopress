<?php

declare( strict_types=1 );

namespace NanoPress;

use NanoPress\Admin\Proofreader;
use NanoPress\Frontend\Frontend;
use NanoPress\Settings\Settings;

/**
 * Coordinates the NanoPress plugin services.
 */
class Plugin {

	/**
	 * Initializes the plugin services.
	 */
	public function init(): void {
		( new Settings() )->init();
		( new Frontend() )->init();
		( new Proofreader() )->init();
	}
}
