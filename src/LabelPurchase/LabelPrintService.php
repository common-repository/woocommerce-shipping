<?php
/**
 * Class LabelPrintService
 *
 * @package Automattic\WCShipping
 */

namespace Automattic\WCShipping\LabelPurchase;

use Automattic\WCShipping\Connect\WC_Connect_API_Client;
use Automattic\WCShipping\Connect\WC_Connect_Logger;
use WP_Error;

/**
 * Class to handle logics around printing labels.
 */
class LabelPrintService {
	/**
	 * Connect Server API client.
	 *
	 * @var WC_Connect_API_Client
	 */
	private $api_client;

	/**
	 * Logger utility.
	 *
	 * @var WC_Connect_Logger
	 */
	private $logger;


	/**
	 * Class constructor.
	 *
	 * @param WC_Connect_API_Client $api_client            Server API client instance.
	 * @param WC_Connect_Logger     $logger                Logger.
	 */
	public function __construct(
		WC_Connect_API_Client $api_client,
		WC_Connect_Logger $logger
	) {
		$this->api_client = $api_client;
		$this->logger     = $logger;
	}

	/**
	 * This function retrieve the test label PDF binary from the connect server.
	 *
	 * @param string $paper_size The size of the paper. Check connect server for the valid inputs.
	 * @return array|WP_Error
	 */
	public function get_label_preview_content( $paper_size ) {
		$params['paper_size'] = $paper_size;
		$params['carrier']    = 'usps';
		$params['labels']     = array(
			array( 'caption' => 'Test label 1' ),
			array( 'caption' => 'Test label 2' ),
		);

		// Note: Setting label_id_csv to null triggers a sample PDF. Do not pass label_id to the API.
		$response = $this->api_client->get_labels_preview_pdf( $params );

		if ( is_wp_error( $response ) ) {
			$error = new WP_Error(
				$response->get_error_code(),
				$response->get_error_message(),
				array( 'message' => $response->get_error_message() )
			);
			$this->logger->log( $error, __CLASS__ );

			return $error;
		}

		// Return the binaries of the PDF.
		return base64_encode( $response['body'] ); //phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}
}
