<?php
/**
 * Class OriginAddressesRESTController
 *
 * This controller is responsible for handling requests to the origin-addresses endpoint.
 *
 * @package Automattic\WCShipping
 */

namespace Automattic\WCShipping\OriginAddresses;

use Automattic\WCShipping\Exceptions\RESTRequestException;
use Automattic\WCShipping\WCShippingRESTController;
use Automattic\WCShipping\LabelPurchase\AddressNormalizationService;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class OriginAddressesRESTController
 */
class OriginAddressesRESTController extends WCShippingRESTController {

	/**
	 * REST base for the origin addresses endpoint.
	 *
	 * @var string
	 */
	protected $rest_base = 'origin-addresses';

	/**
	 * Settings store.
	 *
	 * @var OriginAddressService
	 */
	private $origin_address_service;

	/**
	 * Address normalization service.
	 *
	 * @var AddressNormalizationService
	 */
	private $address_normalization_service;

	/**
	 * OriginAddressesRESTController constructor.
	 *
	 * @param OriginAddressService        $origin_address_service Origin address service.
	 * @param AddressNormalizationService $address_normalization_service Address normalization service.
	 */
	public function __construct( OriginAddressService $origin_address_service, AddressNormalizationService $address_normalization_service ) {
		$this->origin_address_service        = $origin_address_service;
		$this->address_normalization_service = $address_normalization_service;
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_or_update_address' ),
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
					'callback'            => array( $this, 'create_or_update_address' ),
					'permission_callback' => array( $this, 'ensure_rest_permission' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get' ),

					'permission_callback' => array( $this, 'ensure_rest_permission' ),
				),
			)
		);
	}

	/**
	 * Get the origin addresses.
	 *
	 * @param  WP_REST_Request $request The request body contains the origin address to delete.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get( $request ) {
		return rest_ensure_response( $this->origin_address_service->get_origin_addresses() );
	}

	/**
	 * Creates or updates an origin address. It also normalizes the address received.
	 *
	 * @param  WP_REST_Request $request The request body contains the origin address to create.
	 * @return WP_Error|WP_REST_Response
	 */
	public function create_or_update_address( $request ) {
		try {
			list( $origin_address, $ignore_normalization ) = $this->get_and_check_body_params( $request, array( 'address', 'ignoreNormalization' ) );
		} catch ( RESTRequestException $error ) {
			return rest_ensure_response( $error->get_error_response() );
		}

		$id = wc_clean( $origin_address['id'] );
		unset( $origin_address['id'] );

		$default_address = false;
		if ( isset( $origin_address['default_address'] ) ) {
			$default_address = wc_clean( $origin_address['default_address'] );
			unset( $origin_address['default_address'] );
		}

		$normalization = $this->address_normalization_service->get_normalization_response( $origin_address );

		if ( $normalization instanceof WP_Error ) {
			return $normalization;
		}

		$normalization['normalizedAddress']['id']              = wc_clean( $id ?? $normalization['normalizedAddress']['id'] );
		$normalization['address']['id']                        = $normalization['normalizedAddress']['id'];
		$normalization['address']['default_address']           = $default_address;
		$normalization['normalizedAddress']['phone']           = wc_sanitize_phone_number( $origin_address['phone'] );
		$normalization['normalizedAddress']['email']           = sanitize_email( $origin_address['email'] );
		$normalization['normalizedAddress']['default_address'] = $default_address;
		$normalization['isTrivialNormalization']               = $ignore_normalization ? false : $normalization['isTrivialNormalization'];
		$normalization['normalizedAddress']['isVerified']      = ( $normalization['success'] && $ignore_normalization )
																|| ( $normalization['success'] && ! $normalization['isTrivialNormalization'] );

		if ( $normalization['normalizedAddress']['isVerified'] ) {
			$this->origin_address_service->update_origin_addresses( $normalization['normalizedAddress'] );
		}

		return rest_ensure_response(
			$normalization
		);
	}
}
