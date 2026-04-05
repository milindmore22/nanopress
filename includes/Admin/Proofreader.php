<?php

declare( strict_types=1 );

namespace NanoPress\Admin;

use NanoPress\Asset_Loader;

/**
 * Registers the proofreader admin experience.
 */
class Proofreader {

	/**
	 * Hooks the proofreader feature into WordPress.
	 */
	public function init(): void {
		$options = get_option( 'nanopress_options', array( 'enable_proofreader' => false ) );

		if ( empty( $options['enable_proofreader'] ) ) {
			return;
		}

		add_action( 'add_meta_boxes', array( $this, 'add_meta_box' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Adds the proofreader meta box to supported post types.
	 */
	public function add_meta_box(): void {
		foreach ( array( 'post', 'page' ) as $post_type ) {
			add_meta_box(
				'nanopress-proofreader',
				__( 'NanoPress Proofreader', 'nanopress' ),
				array( $this, 'render_meta_box' ),
				$post_type,
				'side',
				'default'
			);
		}
	}

	/**
	 * Renders the proofreader meta box.
	 */
	public function render_meta_box(): void {
		?>
		<div id="nanopress-proofreader-container" class="nanopress-proofreader-container">
			<button id="nanopress-proofread-btn" type="button" class="button button-primary nanopress-proofread-btn">
				<?php esc_html_e( 'Proofread', 'nanopress' ); ?>
			</button>
			<div id="nanopress-proofread-status" class="nanopress-proofread-status"></div>
			<div id="nanopress-proofread-panel" class="nanopress-proofread-panel" hidden>
				<h4><?php esc_html_e( 'Proofreader Results', 'nanopress' ); ?></h4>
				<div id="nanopress-proofread-corrections"></div>
				<div id="nanopress-proofread-actions" class="nanopress-proofread-actions" hidden>
					<button id="nanopress-accept-all-btn" type="button" class="button nanopress-accept-all-btn">
						<?php esc_html_e( 'Accept All', 'nanopress' ); ?>
					</button>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Enqueues proofreader assets on block editor screens.
	 *
	 * @param string $hook_suffix Current admin page hook.
	 */
	public function enqueue_assets( string $hook_suffix ): void {
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		Asset_Loader::enqueue_style( 'proofreader', 'style-proofreader' );
		Asset_Loader::enqueue_script( 'proofreader', 'proofreader' );
	}
}
