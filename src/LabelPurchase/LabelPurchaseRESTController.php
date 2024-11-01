<?php
/**
 * Class LabelPurchaseRESTController
 *
 * @package Automattic\WCShipping
 */

namespace Automattic\WCShipping\LabelPurchase;

use Automattic\WCShipping\Connect\WC_Connect_Functions;
use Automattic\WCShipping\WCShippingRESTController;
use Automattic\WCShipping\Exceptions\RESTRequestException;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * REST controller for purchasing labels for order.
 */
class LabelPurchaseRESTController extends WCShippingRESTController {

	/**
	 * API endpoint path.
	 *
	 * @var string
	 */
	protected $rest_base = 'label/purchase';

	/**
	 * Address normalization service.
	 *
	 * @var OrderService
	 */
	private $label_service;

	/**
	 * REST controller constructor.
	 *
	 * @param AddressNormalizationService $normalization_service Service to manage address normalization.
	 */
	public function __construct( LabelPurchaseService $label_service ) {
		$this->label_service = $label_service;
	}

	/**
	 * Register API routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<order_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_labels' ),
					'permission_callback' => array( WC_Connect_Functions::class, 'user_can_manage_labels' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<order_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'purchase_labels' ),
					'permission_callback' => array( WC_Connect_Functions::class, 'user_can_manage_labels' ),
				),
			)
		);
	}

	/**
	 * Get labels for order.
	 *
	 * @param WP_REST_Request $request REST request object.
	 * @return WP_REST_Response|WP_Error REST response or error.
	 */
	public function get_labels( WP_REST_Request $request ) {
		try {
			list( $order_id ) = $this->get_and_check_request_params( $request, array( 'order_id' ) );
		} catch ( RESTRequestException $error ) {
			return rest_ensure_response( $error->get_error_response() );
		}

		return rest_ensure_response( $this->label_service->get_labels( $order_id ) );
	}

	/**
	 * Purchase labels.
	 *
	 * @param WP_REST_Request $request REST request object.
	 * @return WP_REST_Response|WP_Error REST response or error.
	 */
	public function purchase_labels( WP_REST_Request $request ) {
		try {
			// TODO: Validate JSON request schema.
			list(
					$origin,
					$destination,
					$packages,
					$selected_rate,
					$hazmat,
					$customs,
				)             = $this->get_and_check_body_params(
					$request,
					array( 'origin', 'destination', 'packages', 'selected_rate', 'hazmat', 'customs' )
				);
			list( $order_id ) = $this->get_and_check_request_params( $request, array( 'order_id' ) );
		} catch ( RESTRequestException $error ) {
			return rest_ensure_response( $error->get_error_response() );
		}

		// Optional parameter for user meta.
		$user_meta = $request->get_json_params()['user_meta'] ?? array();

		return rest_ensure_response(
			$this->label_service->purchase_labels(
				$origin,
				$destination,
				$packages,
				$order_id,
				$selected_rate,
				$hazmat,
				$customs,
				$user_meta
			)
		);
	}
}
