<?php
/**
 * Class LabelRateRESTController
 *
 * @package Automattic\WCShipping
 */

namespace Automattic\WCShipping\LabelPurchase;

use Automattic\WCShipping\Connect\WC_Connect_Logger;
use Automattic\WCShipping\WCShippingRESTController;
use WP_REST_Request;
use WP_REST_Server;

/**
 * REST controller for label preview.
 */
class LabelPreviewRESTController extends WCShippingRESTController {
	/**
	 * Route
	 *
	 * @var string
	 */
	protected $rest_base = 'label/preview';

	/**
	 * LabelPrintService class.
	 *
	 * @var LabelPrintService
	 */
	protected $label_print_service;

	/**
	 * Logger for the connect server.
	 *
	 * @var WC_Connect_Logger
	 */
	protected $logger;

	/**
	 * Class constructor.
	 *
	 * @param LabelPrintService $label_print_service Service that has logic to print labels.
	 * @param WC_Connect_Logger $logger Logger class.
	 */
	public function __construct( LabelPrintService $label_print_service, WC_Connect_Logger $logger ) {
		$this->logger              = $logger;
		$this->label_print_service = $label_print_service;
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
					'callback'            => array( $this, 'label_preview' ),
					'permission_callback' => array( $this, 'ensure_rest_permission' ),
				),
			)
		);
	}

	/**
	 * Retrieve the test label and returns it as a base64 encoded content.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function label_preview( WP_REST_Request $request ) {
		$raw_params = $request->get_params();

		// TODO: Validate data. Missing papersize, throw bad request before passing to service.
		$pdf_b64 = $this->label_print_service->get_label_preview_content( $raw_params['paper_size'] );

		if ( is_wp_error( $pdf_b64 ) ) {
			$this->logger->log( $pdf_b64, __CLASS__ );
			return $pdf_b64;
		}

		return array(
			'mimeType'   => 'application/pdf',
			'b64Content' => $pdf_b64,
			'success'    => true,
		);
	}
}
