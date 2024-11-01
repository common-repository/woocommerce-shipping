<?php
/**
 * Class AddressNormalizationService
 *
 * @package Automattic\WCShipping
 */

namespace Automattic\WCShipping\LabelPurchase;

use Automattic\WCShipping\Connect\WC_Connect_Service_Settings_Store;
use Automattic\WCShipping\Connect\WC_Connect_API_Client;
use Automattic\WCShipping\Connect\WC_Connect_Logger;
use Automattic\WCShipping\OriginAddresses\OriginAddressService;
use WP_Error;

/**
 * Class to handle address normalization requests.
 */
class AddressNormalizationService {

	/**
	 * Connect Server settings store.
	 *
	 * @var WC_Connect_Service_Settings_Store
	 */
	private $settings_store;

	/**
	 * Connect Server API client.
	 *
	 * @var WC_Connect_API_Client
	 */
	private $api_client;

	/**
	 * Logging utility.
	 *
	 * @var WC_Connect_Logger
	 */
	private $logger;

	/**
	 * Origin address service.
	 *
	 * @var OriginAddressService
	 */
	private $origin_address_service;

	/**
	 * Class constructor.
	 *
	 * @param WC_Connect_Service_Settings_Store $settings_store Server settings store instance.
	 * @param WC_Connect_API_Client             $api_client     Server API client instance.
	 * @param WC_Connect_Logger                 $logger         Logging utility.
	 */
	public function __construct( WC_Connect_Service_Settings_Store $settings_store, WC_Connect_API_Client $api_client, WC_Connect_Logger $logger, OriginAddressService $origin_address_service ) {
		$this->settings_store         = $settings_store;
		$this->api_client             = $api_client;
		$this->logger                 = $logger;
		$this->origin_address_service = $origin_address_service;
	}

	/**
	 * Confirm and update origin address in store.
	 *
	 * @param array $address Origin shipping address.
	 *
	 * @return array|WP_Error REST response body.
	 */
	public function update_origin_address( $address ) {
		$formatted_address = $this->format_address_for_client( $address );
		$address           = $this->origin_address_service->update_origin_addresses( $formatted_address );

		if ( empty( $address ) ) {
			return new WP_Error(
				'origin_address_update_failed',
				'Address could not be updated',
				array(
					'message' => 'Address could not be updated',
					'address' => $address,
				)
			);
		}

		return array(
			'success'    => true,
			'address'    => $this->format_address_for_client( $address ),
			'isVerified' => true, // only verified addresses are allowed to be set as origin
		);
	}

	/**
	 * Confirm and update shipping destination in store.
	 *
	 * @param int|string $order_id    WC order ID.
	 * @param array      $address     Destination shipping address.
	 * @param bool       $is_verified Is destination address normalized/verified.
	 *
	 * @return array REST response body.
	 */
	public function update_destination_address( $order_id, $address, $is_verified ) {
		$formatted_address = $this->format_address_for_client( $address );
		$result            = $this->settings_store->update_destination_address( $order_id, $formatted_address );
		if ( $result ) {
			$this->settings_store->set_is_destination_address_normalized( $order_id, (bool) $is_verified );
		}

		return array(
			'success'    => $result,
			'address'    => $formatted_address,
			'isVerified' => (bool) $is_verified && $result,
		);
	}

	/**
	 * Checks whether destination address has already been verified/normalized.
	 *
	 * @param int|string $order_id WC order ID.
	 *
	 * @return array|WP_Error REST response body.
	 */
	public function is_destination_address_verified( $order_id ) {
		$order       = wc_get_order( $order_id );
		$address     = $order->get_address( 'shipping' );
		$is_verified = $this->settings_store->is_destination_address_normalized( $order_id );
		if ( true === $is_verified ) {
			return array(
				'success'           => true,
				'normalizedAddress' => $address,
				'isVerified'        => true,
			);
		}

		$response = $this->normalize_address( $address );
		if ( is_wp_error( $response ) ) {
			$error = new WP_Error(
				$response->get_error_code(),
				$response->get_error_message(),
				array( 'message' => $response->get_error_message() )
			);
			$this->logger->log( $error, __CLASS__ );

			return $error;
		}

		if ( isset( $response->field_errors ) ) {
			$error = new WP_Error(
				'address_normalization_failed',
				$response->field_errors->general,
				$response->field_errors
			);
			$this->logger->log( $error, __CLASS__ );

			return array(
				'success'    => false,
				'errors'     => $response->field_errors,
				'isVerified' => false,
			);
		}

		return array(
			'success'                => true,
			'normalizedAddress'      => $response->normalized,
			'isTrivialNormalization' => isset( $response->is_trivial_normalization ) ? $response->is_trivial_normalization : false,
			'isVerified'             => false,
		);
	}

	/**
	 * Requests server to normalize address.
	 *
	 * @param array $address Address to normalize.
	 *
	 * @return array|WP_Error REST response body.
	 */
	public function get_normalization_response( $address ) {
		$response = $this->normalize_address( $address );
		if ( is_wp_error( $response ) ) {
			$error = new WP_Error(
				$response->get_error_code(),
				$response->get_error_message(),
				array( 'message' => $response->get_error_message() )
			);
			$this->logger->log( $error, __CLASS__ );

			return $error;
		}

		if ( isset( $response->field_errors ) ) {
			$error_message = __( 'Address normalization failed', 'woocommerce-shipping' );

			// If there is a general error message, use that.
			if ( isset( $response->field_errors->general ) ) {
				$error_message = $response->field_errors->general;
			// If there is an address error message, use that.
			} elseif ( isset( $response->field_errors->address ) ) {
				$error_message = $response->field_errors->address;
			}

			$this->logger->log( $error_message, __CLASS__ );

			return array(
				'success'                => false,
				'errors'                 => $response->field_errors,
				'isTrivialNormalization' => false,
				'address'                => $address,
			);
		}

		return array(
			'success'                => true,
			'normalizedAddress'      => $response->normalized,
			'isTrivialNormalization' => isset( $response->is_trivial_normalization ) ? $response->is_trivial_normalization : false,
			'address'                => $address,
		);
	}

	/**
	 * Returns normalization response for address from server.
	 *
	 * @param array $address Address to normalize.
	 *
	 * @return object|WP_Error REST reponse object.
	 */
	private function normalize_address( $address ) {
		$request_body = $this->format_address_for_connect_server( $address );

		$response = $this->api_client->send_address_normalization_request( array( 'destination' => $request_body ) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( isset( $response->normalized ) ) {
			$response->normalized = $this->format_address_for_client( $response->normalized, $address );
		}

		return $response;
	}

	/**
	 * Formats address request body to support required server validation.
	 *
	 * @param array $address Input address.
	 *
	 * @return array Formatted request body.
	 */
	private function format_address_for_connect_server( $address ) {
		$request_body = $address;

		if ( isset( $request_body['address_1'] ) && empty( $request_body['address'] ) ) {
			$request_body['address'] = wc_clean( $request_body['address_1'] );
		}

		if ( isset( $request_body['address_1'] ) ) {
			unset( $request_body['address_1'] );
		}

		if ( ! isset( $request_body['address_2'] ) ) {
			$request_body['address_2'] = '';
		}

		if ( isset( $request_body['first_name'] ) && isset( $request_body['last_name'] ) && empty( $request_body['name'] ) ) {
			$request_body['name'] = wc_clean( $request_body['first_name'] . ' ' . $request_body['last_name'] );
			unset( $request_body['first_name'], $request_body['last_name'] );
		}

		if ( ! isset( $request_body['name'] ) ) {
			$request_body['name'] = '';
		}

		if ( isset( $request_body['first_name'] ) ) {
			unset( $request_body['first_name'] );
		}

		if ( isset( $request_body['last_name'] ) ) {
			unset( $request_body['last_name'] );
		}

		if ( isset( $request_body['phone'] ) ) {
			unset( $request_body['phone'] );
		}

		if ( isset( $request_body['email'] ) ) {
			unset( $request_body['email'] );
		}

		if ( isset( $request_body['id'] ) ) {
			unset( $request_body['id'] );
		}

		if ( isset( $request_body['default_address'] ) ) {
			unset( $request_body['default_address'] );
		}

		if ( isset( $request_body['is_verified'] ) ) {
			unset( $request_body['is_verified'] );
		}

		return $request_body;
	}

	/**
	 * Formats address response to reflect expected WC address format.
	 *
	 * @param array $address Server address.
	 *
	 * @return array Formatted response body.
	 */
	private function format_address_for_client( $address, $original_address = array() ) {
		$response_body = (array) $address;
		if ( isset( $response_body['address'] ) ) {
			$response_body['address_1'] = wc_clean( $response_body['address'] );
			unset( $response_body['address'] );
		}

		if ( isset( $response_body['name'] ) ) {
			list( $first_name, $last_name ) = explode( ' ', $response_body['name'], 2 );
			$response_body['first_name']    = wc_clean( $first_name );
			$response_body['last_name']     = wc_clean( $last_name );
			unset( $response_body['name'] );
		}

		if ( isset( $original_address['phone'] ) ) {
			$response_body['phone'] = wc_clean( $original_address['phone'] );
		}

		if ( isset( $original_address['email'] ) ) {
			$response_body['email'] = sanitize_email( $original_address['email'] );
		}

		if ( isset( $original_address['id'] ) ) {
			$response_body['id'] = wc_clean( $original_address['id'] );
		}

		if ( isset( $original_address['default_address'] ) ) {
			$response_body['default_address'] = (bool) wc_clean( $original_address['default_address'] );
		}

		return $response_body;
	}
}
