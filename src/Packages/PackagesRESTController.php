<?php

namespace Automattic\WCShipping\Packages;

use Automattic\WCShipping\Connect\WC_Connect_Service_Settings_Store;
use Automattic\WCShipping\Connect\WC_Connect_Package_Settings;
use Automattic\WCShipping\Exceptions\RESTRequestException;
use Automattic\WCShipping\WCShippingRESTController;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class PackagesRESTController extends WCShippingRESTController {
	protected $rest_base = 'packages';

	private $settings_store;

	/**
	 * @var WC_Connect_Package_Settings
	 */
	protected $package_settings;

	public function __construct( WC_Connect_Service_Settings_Store $settings_store, WC_Connect_Package_Settings $package_settings ) {
		$this->settings_store   = $settings_store;
		$this->package_settings = $package_settings;
	}

	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'post' ),
					'permission_callback' => array( $this, 'ensure_rest_permission' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'put' ),
					'permission_callback' => array( $this, 'ensure_rest_permission' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			// Accepts alphanumeric, underscores, hyphens, and digits.
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9_-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete' ),
					'permission_callback' => array( $this, 'ensure_rest_permission' ),
				),
			)
		);
	}

	/**
	 * Update the existing custom and predefined packages.
	 *
	 * @param  WP_REST_Request $request The request body contains the custom/predefined packages to replace.
	 * @return WP_REST_Response
	 */
	public function put( $request ) {
		$packages = $request->get_json_params();

		if ( isset( $packages['custom'] ) ) {
			$this->settings_store->update_packages( $packages['custom'] );
		}

		if ( isset( $packages['predefined'] ) ) {
			$this->settings_store->update_predefined_packages( $packages['predefined'] );
		}

		return rest_ensure_response(
			array(
				'predefined' => $this->settings_store->get_predefined_packages(),
				'custom'     => $this->settings_store->get_packages(),
			)
		);
	}

	/**
	 * Create custom and/or predefined packages.
	 *
	 * @param  WP_REST_Request $request The request body contains the custom/predefined packages to create.
	 * @return WP_Error|WP_REST_Response
	 */
	public function post( $request ) {
		$packages = $request->get_json_params();

		$custom_packages     = isset( $packages['custom'] ) ? $packages['custom'] : array();
		$predefined_packages = isset( $packages['predefined'] ) ? $packages['predefined'] : array();

		// Handle new custom packages. The custom packages are structured as an array of packages as dictionaries.
		if ( ! empty( $custom_packages ) ) {
			// Validate that the new custom packages have unique names.
			$map_package_name            = function ( $package ) {
				return $package['name'];
			};
			$custom_package_names        = array_map( $map_package_name, $custom_packages );
			$unique_custom_package_names = array_unique( $custom_package_names );

			if ( count( $unique_custom_package_names ) < count( $custom_package_names ) ) {
				$duplicate_package_names = array_diff_assoc( $custom_package_names, $unique_custom_package_names );
				$error                   = array(
					'code'    => 'duplicate_custom_package_names',
					'message' => __( 'The new custom package names are not unique.', 'woocommerce-shipping' ),
					'data'    => array( 'package_names' => array_values( $duplicate_package_names ) ),
				);
				return new WP_REST_Response( $error, 400 );
			}

			// Validate that the new custom packages do not have the same names as existing custom packages.
			$existing_custom_packages      = $this->settings_store->get_packages();
			$existing_custom_package_names = array_map( $map_package_name, $existing_custom_packages );
			$duplicate_package_names       = array_intersect( $existing_custom_package_names, $custom_package_names );

			if ( ! empty( $duplicate_package_names ) ) {
				$error = array(
					'code'    => 'duplicate_custom_package_names_of_existing_packages',
					'message' => __( 'At least one of the new custom packages has the same name as existing packages.', 'woocommerce-shipping' ),
					'data'    => array( 'package_names' => array_values( $duplicate_package_names ) ),
				);
				return new WP_REST_Response( $error, 400 );
			}

			// If no duplicate custom packages, create the given packages.
			$this->settings_store->create_packages( $custom_packages );
		}

		// Handle new predefined packages. The predefined packages are structured as a dictionary from carrier name to
		// an array of package names.
		if ( ! empty( $predefined_packages ) ) {
			$duplicate_package_names_by_carrier = array();

			// Validate that the new predefined packages have unique names for each carrier.
			foreach ( $predefined_packages as $carrier => $package_names ) {
				$unique_package_names = array_unique( $package_names );
				if ( count( $unique_package_names ) < count( $package_names ) ) {
					$duplicate_package_names                        = array_diff_assoc( $package_names, $unique_package_names );
					$duplicate_package_names_by_carrier[ $carrier ] = array_values( $duplicate_package_names );
				}
			}

			if ( ! empty( $duplicate_package_names_by_carrier ) ) {
				$error = array(
					'code'    => 'duplicate_predefined_package_names',
					'message' => __( 'At least one of the new carrier package names is not unique.', 'woocommerce-shipping' ),
					'data'    => array( 'package_names_by_carrier' => $duplicate_package_names_by_carrier ),
				);
				return new WP_REST_Response( $error, 400 );
			}

			// Validate that the new predefined packages for each carrier do not have the same names as existing predefined packages.
			$existing_predefined_packages = $this->settings_store->get_predefined_packages();
			if ( ! empty( $existing_predefined_packages ) ) {
				foreach ( $existing_predefined_packages as $carrier => $existing_package_names ) {
					$new_package_names       = isset( $predefined_packages[ $carrier ] ) ? $predefined_packages[ $carrier ] : array();
					$duplicate_package_names = array_intersect( $existing_package_names, $new_package_names );
					if ( ! empty( $duplicate_package_names ) ) {
						$duplicate_package_names_by_carrier[ $carrier ] = array_values( $duplicate_package_names );
					}
				}
			}

			if ( ! empty( $duplicate_package_names_by_carrier ) ) {
				$error = array(
					'code'    => 'duplicate_predefined_package_names_of_existing_packages',
					'message' => __( 'At least one of the new predefined packages has the same name as an existing package.', 'woocommerce-shipping' ),
					'data'    => array( 'package_names_by_carrier' => $duplicate_package_names_by_carrier ),
				);
				return new WP_REST_Response( $error, 400 );
			}

			// If no duplicate predefined packages, create the given packages.
			$this->settings_store->create_predefined_packages( $predefined_packages );
		}

		return rest_ensure_response(
			array(
				'predefined' => $this->settings_store->get_predefined_packages(),
				'custom'     => $this->settings_store->get_packages(),
			)
		);
	}

	/**
	 * Delete a saved template.
	 *
	 * @param  WP_REST_Request $request The request parameters contain the custom package id to delete.
	 * @return WP_Error|WP_REST_Response
	 */
	public function delete( WP_REST_Request $request ) {
		try {
			list( $id ) = $this->get_and_check_request_params( $request, array( 'id' ) );
		} catch ( RESTRequestException $error ) {
			return rest_ensure_response( $error->get_error_response() );
		}

		$packages = $this->settings_store->get_packages();

		foreach ( $packages as $key => $package ) {
			if ( $package['id'] === $id ) {
				unset( $packages[ $key ] );
			}
		}

		// Reindex the array since we've just plugged a hole.
		$packages = array_values( $packages );

		$this->settings_store->update_packages( $packages );
		return rest_ensure_response(
			array(
				'predefined' => $this->settings_store->get_predefined_packages(),
				'custom'     => $this->settings_store->get_packages(),
			)
		);
	}
}
