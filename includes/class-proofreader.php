<?php
/**
 * NanoPress Proofreader Admin Class
 *
 * Adds a proofreader meta box to the WordPress post editor
 * using the Chrome Built-in Proofreader API.
 *
 * @package nano-press
 */

namespace NanoPress;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Proofreader class for the NanoPress plugin.
 */
class Proofreader {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$options = get_option( 'nanopress_options', array( 'enable_proofreader' => '0' ) );

		if ( empty( $options['enable_proofreader'] ) ) {
			return;
		}

		add_action( 'add_meta_boxes', array( $this, 'add_proofreader_meta_box' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_proofreader_scripts' ) );
	}

	/**
	 * Add the proofreader meta box to post and page editors.
	 *
	 * @return void
	 */
	public function add_proofreader_meta_box() {
		$post_types = array( 'post', 'page' );

		foreach ( $post_types as $post_type ) {
			add_meta_box(
				'nanopress-proofreader',
				__( 'NanoPress Proofreader', 'nano-press' ),
				array( $this, 'render_meta_box' ),
				$post_type,
				'side',
				'default'
			);
		}
	}

	/**
	 * Render the proofreader meta box content.
	 *
	 * @param \WP_Post $post The current post object.
	 *
	 * @return void
	 */
	public function render_meta_box( $post ) {
		?>
		<div id="nanopress-proofreader-container" class="nanopress-proofreader-container">
			<button id="nanopress-proofread-btn" type="button" class="button button-primary nanopress-proofread-btn">
				<?php esc_html_e( 'Proofread', 'nano-press' ); ?>
			</button>
			<div id="nanopress-proofread-status" class="nanopress-proofread-status"></div>
			<div id="nanopress-proofread-panel" class="nanopress-proofread-panel" style="display:none;">
				<h4><?php esc_html_e( 'Proofreader Results', 'nano-press' ); ?></h4>
				<div id="nanopress-proofread-corrections"></div>
				<div id="nanopress-proofread-actions" class="nanopress-proofread-actions" style="display:none;">
					<button id="nanopress-accept-all-btn" type="button" class="button nanopress-accept-all-btn">
						<?php esc_html_e( 'Accept All', 'nano-press' ); ?>
					</button>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Enqueue scripts and styles for the proofreader on post edit screens.
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 *
	 * @return void
	 */
	public function enqueue_proofreader_scripts( $hook_suffix ) {
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		wp_enqueue_style( 'nanopress-proofreader-style', NANO_PRESS_PLUGIN_URL . 'public/css/nanopress-proofreader.css', array(), NANO_PRESS_VERSION );
		wp_enqueue_script( 'nanopress-proofreader-script', NANO_PRESS_PLUGIN_URL . 'public/js/nanopress-proofreader.js', array( 'wp-data', 'wp-blocks', 'wp-element' ), NANO_PRESS_VERSION, true );
	}
}
