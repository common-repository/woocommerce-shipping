<?php
namespace Automattic\WCShipping\LabelPurchase;

use Automattic\WCShipping\Connect\WC_Connect_API_Client;
use Automattic\WCShipping\Connect\WC_Connect_Logger;
use Automattic\WCShipping\Connect\WC_Connect_Service_Settings_Store;
use Automattic\WCShipping\WCShippingRESTController;
use WP_Error;
use WP_REST_Server;

class LabelPrintController extends WCShippingRESTController {
	protected $rest_base = 'label/print';

	/**
	 * @var WC_Connect_Service_Settings_Store
	 */
	protected $settings_store;

	/**
	 * @var WC_Connect_API_Client
	 */
	protected $api_client;

	/**
	 * @var WC_Connect_Logger
	 */
	protected $logger;
	public function __construct( WC_Connect_Service_Settings_Store $settings_store, WC_Connect_API_Client $api_client, WC_Connect_Logger $logger ) {
		$this->settings_store = $settings_store;
		$this->api_client     = $api_client;
		$this->logger         = $logger;
	}

	/**
	 * Register API routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'print_label' ),
					'permission_callback' => array( $this, 'ensure_rest_permission' ),
				),
			)
		);
	}

	public function print_label( $request ) {
		list( $label_id, $paper_size ) = $this->get_and_check_request_params( $request, array( 'label_id_csv', 'paper_size' ) );
		$this->settings_store->set_preferred_paper_size( $paper_size );

		if ( ! $label_id ) {
			$message = __( 'Invalid PDF request.', 'woocommerce-shipping' );
			$error   = new WP_Error(
				'invalid_pdf_request',
				$message,
				array(
					'message' => $message,
					'status'  => 400,
				)
			);
			$this->logger->log( $error, __CLASS__ );
			return $error;
		}
		$request_params               = array();
		$request_params['paper_size'] = $paper_size;
		$request_params['labels']     = array(
			array(
				'label_id' => (int) $label_id,
			),
		);

		$raw_response = $this->api_client->get_labels_print_pdf( $request_params );
		if ( is_wp_error( $raw_response ) ) {
			$this->logger->log( $raw_response, __CLASS__ );
			return $raw_response;
		}

		return array(
			'mimeType'   => $raw_response['headers']['content-type'],
			'b64Content' => base64_encode( $raw_response['body'] ),
			'success'    => true,
		);
	}
}
