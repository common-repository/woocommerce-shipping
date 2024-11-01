<?php

namespace Automattic\WCShipping;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\WCShipping\Exceptions\RESTRequestException;
use WC_REST_Controller;
use WP_REST_Request;

/**
 * WCShippingRESTController class.
 */
abstract class WCShippingRESTController extends WC_REST_Controller {

	/**
	 * WooCommerce Shipping namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wcshipping/v1';

	/**
	 * Receives array of required parameter keys,
	 * returns array of request parameters.
	 *
	 * @param WP_REST_Request $request    Incoming WP REST request.
	 * @param array           $param_keys Array of required body parameters.
	 *
	 * @throws RESTRequestException If parameter is missing.
	 * @return array Array of parsed body parameters.
	 */
	protected function get_and_check_body_params( $request, $param_keys ) {
		$data        = $request->get_json_params();
		$params_list = array();
		foreach ( $param_keys as $key ) {
			if ( ! isset( $data[ $key ] ) ) {
				$message = sprintf(
					// translators: %s: The missing query parameter.
					__( 'Required body parameter is missing: %s', 'woocommerce-shipping' ),
					$key
				);

				/*
				 * We have to escape an exceptions output in case it's not caught internally.
				 *
				 * @link https://github.com/WordPress/WordPress-Coding-Standards/issues/884
				 */
				throw new RESTRequestException( esc_html( $message ) );
			}
			$params_list[] = $data[ $key ];
		}
		return $params_list;
	}

	/**
	 * Receives array of required parameter keys,
	 * returns array of request parameters.
	 *
	 * @param WP_REST_Request $request    Incoming WP REST request.
	 * @param array           $param_keys Array of required request parameters.
	 *
	 * @throws RESTRequestException If parameter is missing.
	 * @return array Array of parsed request parameters.
	 */
	protected function get_and_check_request_params( $request, $param_keys ) {
		$params_list = array();
		foreach ( $param_keys as $key ) {
			$param = $request->get_param( $key );
			if ( is_null( $param ) ) {
				$message = sprintf(
					// translators: %s: The missing query parameter.
					__( 'Required parameter is missing: %s', 'woocommerce-shipping' ),
					$key
				);

				/*
				 * We have to escape an exceptions output in case it's not caught internally.
				 *
				 * @link https://github.com/WordPress/WordPress-Coding-Standards/issues/884
				 */
				throw new RESTRequestException( esc_html( $message ) );
			}
			$params_list[] = $param;
		}
		return $params_list;
	}


	/**
	 * @param WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function ensure_rest_permission( $request ) {
		return (
				wp_verify_nonce( $request->get_header( 'x_wp_nonce' ), 'wp_rest' )
				|| Rest_Authentication::init()->wp_rest_authenticate( false )
			) && apply_filters( 'wcshipping_user_can_manage_labels', current_user_can( 'manage_woocommerce' ) || current_user_can( 'wcshipping_manage_labels' ) );
	}

	/**
	 * Attach a hook to prevent API from being cached.
	 */
	public static function prevent_route_caching() {
		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true ); // Play nice with WP-Super-Cache
		}

		// Prevent our REST API endpoint responses from being added to browser cache
		add_filter( 'rest_post_dispatch', array( __CLASS__, 'exclude_namespace_from_cache' ), PHP_INT_MAX, 3 );
	}

	/**
	 * Send nocache_headers when any of the namespace endpoints are being accessed.
	 *
	 * This method is used as a callback for the 'rest_post_dispatch' filter.
	 * It checks if the requested route falls under our namespace and, if so,
	 * sends no-cache headers to prevent caching of the API response.
	 *
	 * @param mixed           $result  The result that will be sent to the client.
	 * @param WP_REST_Server  $server  The REST server instance.
	 * @param WP_REST_Request $request The request used to generate the response.
	 *
	 * @return mixed The unmodified $result.
	 */
	public static function exclude_namespace_from_cache( $result, $server, $request ) {
		$namespace = '/wcshipping/';

		// Check if the requested route falls under our namespace
		if ( strpos( $request->get_route(), $namespace ) === 0 ) {
			// Get no-cache headers
			$nocache_headers = wp_get_nocache_headers();

			// Set each no-cache header
			foreach ( $nocache_headers as $header => $value ) {
				$server->send_header( $header, $value );
			}
			$server->send_header( 'Pragma', 'no-cache' );
		}

		return $result;
	}
}
