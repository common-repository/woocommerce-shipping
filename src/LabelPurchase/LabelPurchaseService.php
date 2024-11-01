<?php
/**
 * Class LabelPurchaseService
 *
 * @package Automattic\WCShipping
 */

namespace Automattic\WCShipping\LabelPurchase;

use Automattic\WCShipping\Connect\WC_Connect_Service_Settings_Store;
use Automattic\WCShipping\Connect\WC_Connect_API_Client;
use Automattic\WCShipping\Connect\WC_Connect_Logger;
use Automattic\WCShipping\Connect\WC_Connect_Utils;
use WP_Error;

/**
 * Class to handle label purchase requests.
 */
class LabelPurchaseService {

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
	 * Connect Label Service.
	 *
	 * @var View
	 */
	private $connect_label_service;

	/**
	 * Logger utility.
	 *
	 * @var WC_Connect_Logger
	 */
	private $logger;

	/**
	 * Selected rates key used to store selected rates in order meta.
	 *
	 * @var string
	 */
	const SELECTED_RATES_KEY = '_wcshipping_selected_rates';
	/**
	 * Selected hazmat key used to store selected hazmat in order meta.
	 *
	 * @var string
	 */
	const SELECTED_HAZMAT_KEY = '_wcshipping_selected_hazmat';

	/**
	 * Selected hazmat key used to store selected hazmat in order meta.
	 *
	 * @var string
	 */
	const SELECTED_ORIGIN_KEY = '_wcshipping_selected_origin';

	/**
	 * Selected hazmat key used to store selected hazmat in order meta.
	 *
	 * @var string
	 */
	const SELECTED_DESTINATION_KEY = '_wcshipping_selected_destination';

	/**
	 * Key used to store customs information in order meta.
	 *
	 * @var string
	 */
	const CUSTOMS_INFORMATION = '_wcshipping_customs_information';


	/**
	 * Class constructor.
	 *
	 * @param WC_Connect_Service_Settings_Store $settings_store        Server settings store instance.
	 * @param WC_Connect_API_Client             $api_client            Server API client instance.
	 * @param View                              $connect_label_service Connect Label Service instance.
	 * @param WC_Connect_Logger                 $logger                Server API client instance.
	 */
	public function __construct(
		WC_Connect_Service_Settings_Store $settings_store,
		WC_Connect_API_Client $api_client,
		View $connect_label_service,
		WC_Connect_Logger $logger
	) {
		$this->settings_store        = $settings_store;
		$this->api_client            = $api_client;
		$this->connect_label_service = $connect_label_service;
		$this->logger                = $logger;
	}

	/**
	 * Get labels for order.
	 *
	 * @param int $order_id WC Order ID.
	 * @return array REST response body.
	 */
	public function get_labels( $order_id ) {
		$response = $this->connect_label_service->get_label_payload( $order_id );
		if ( ! $response ) {
			$message = __( 'Order not found', 'woocommerce-shipping' );
			return new WP_Error(
				401,
				$message,
				array(
					'success' => false,
					'message' => $message,
				),
			);
		}

		return array(
			'success' => true,
			'labels'  => $response['currentOrderLabels'],
		);
	}

	/**
	 * Purchase labels for order.
	 *
	 * @param array $origin      Origin address.
	 * @param array $destination Destination address.
	 * @param array $packages   Packages to purchase labels for.
	 * @param int   $order_id    WC Order ID.
	 * @param array $selected_rate Selected rate.
	 * @param array $hazmat Selected HAZMAT category and if shipment includes HAZMAT.
	 * @param array $customs Customs form information.
	 * @param array $user_meta User meta array.
	 * @return array|WP_Error REST response body.
	 */
	public function purchase_labels( $origin, $destination, $packages, $order_id, $selected_rate, $hazmat, $customs, $user_meta = array() ) {
		$settings         = $this->settings_store->get_account_settings();
		$service_names    = array_column( $packages, 'service_name' );
		$request_packages = $this->prepare_packages_for_purchase( $packages, $user_meta );

		if ( ! empty( $user_meta ) ) {
			$this->update_user_meta( $user_meta );
		}

		$origin_address_id = 'UNKNOWN_ORIGIN_ID';
		// Assuming only verified addresses are being used to purchase labels.
		$is_origin_address_verified = true;
		// Todo: To be updated via  woocommerce-shipping/issues/859
		if ( isset( $origin['id'] ) ) {
			$origin_address_id = $origin['id'];
			unset( $origin['id'] );
		}

		if ( isset( $origin['is_verified'] ) ) {
			$is_origin_address_verified = $origin['is_verified'];
			unset( $origin['is_verified'] );
		}

		$label_response = $this->api_client->send_shipping_label_request(
			array(
				'async'             => true,
				'email_receipt'     => $settings['email_receipts'] ?? false,
				'origin'            => $origin,
				'destination'       => $destination,
				'payment_method_id' => $this->settings_store->get_selected_payment_method_id(),
				'order_id'          => $order_id,
				'packages'          => $request_packages,
			)
		);

		if ( is_wp_error( $label_response ) ) {
			$error = new WP_Error(
				$label_response->get_error_code(),
				$label_response->get_error_message(),
				array(
					'success' => false,
					'message' => $label_response->get_error_message(),
				)
			);
			$this->logger->log( $error, __CLASS__ );
			return $error;
		}

		$purchased_labels_meta = $this->get_labels_meta_from_response( $label_response, $request_packages, $service_names );
		if ( is_wp_error( $purchased_labels_meta ) ) {
			$this->logger->log( $purchased_labels_meta, __CLASS__ );
			return $purchased_labels_meta;
		}

		$this->settings_store->add_labels_to_order( $order_id, $purchased_labels_meta );

		$shipment_key = array_keys( $selected_rate )[0];
		$origin       = array(
			$shipment_key => array_merge(
				$origin,
				array(
					'id'          => $origin_address_id,
					'is_verified' => $is_origin_address_verified,
				),
			),
		);
		$destination  = array(
			$shipment_key => $destination,
		);

		$selected_meta = $this->store_selected_meta(
			$order_id,
			array(
				self::SELECTED_RATES_KEY       => $selected_rate,
				self::SELECTED_HAZMAT_KEY      => $hazmat,
				self::SELECTED_ORIGIN_KEY      => $origin,
				self::SELECTED_DESTINATION_KEY => $destination,
				self::CUSTOMS_INFORMATION      => $customs,
			),
		);

		return array(
			'labels'               => $purchased_labels_meta,
			'selected_rates'       => $selected_meta[ self::SELECTED_RATES_KEY ],
			'selected_hazmat'      => $selected_meta[ self::SELECTED_HAZMAT_KEY ],
			'selected_origin'      => $selected_meta[ self::SELECTED_ORIGIN_KEY ],
			'selected_destination' => $selected_meta[ self::SELECTED_DESTINATION_KEY ],
			'customs_information'  => $selected_meta[ self::CUSTOMS_INFORMATION ],
			'success'              => true,
		);
	}

	/**
	 * Returns meta object for purchased labels to store with order.
	 *
	 * @param object $response      Purchase shipping label response from Connect Server.
	 * @param array  $packages     Packages for purchase label request body.
	 * @param array  $service_names List of service names for packages.
	 * @return array|WP_Error Meta for purchased labels.
	 */
	private function get_labels_meta_from_response( $response, $packages, $service_names ) {
		$label_ids             = array();
		$purchased_labels_meta = array();
		$package_lookup        = $this->settings_store->get_package_lookup();
		foreach ( $response->labels as $index => $label_data ) {
			if ( isset( $label_data->error ) ) {
				$error = new WP_Error(
					$label_data->error->code,
					$label_data->error->message,
					array(
						'success' => false,
						'message' => $label_data->error->message,
					)
				);
				return $error;
			}
			$label_ids[] = $label_data->label->label_id;

			$label_meta = array(
				'label_id'               => $label_data->label->label_id,
				'tracking'               => $label_data->label->tracking_id,
				'refundable_amount'      => $label_data->label->refundable_amount,
				'created'                => $label_data->label->created,
				'carrier_id'             => $label_data->label->carrier_id,
				'service_name'           => $service_names[ $index ],
				'status'                 => $label_data->label->status,
				'commercial_invoice_url' => $label_data->label->commercial_invoice_url ?? '',
				'is_commercial_invoice_submitted_electronically' => $label_data->label->is_commercial_invoice_submitted_electronically ?? '',
			);

			$package = $packages[ $index ];
			$box_id  = $package['box_id'];
			if ( 'custom_box' === $box_id ) {
				$label_meta['package_name'] = __( 'Individual packaging', 'woocommerce-shipping' );
			} elseif ( isset( $package_lookup[ $box_id ] ) ) {
				$label_meta['package_name'] = $package_lookup[ $box_id ]['name'];
			} else {
				$label_meta['package_name'] = __( 'Unknown package', 'woocommerce-shipping' );
			}

			$label_meta['is_letter'] = isset( $package['is_letter'] ) ? $package['is_letter'] : false;

			$product_names = array();
			$product_ids   = array();
			foreach ( $package['products'] as $product_id ) {
				$product       = wc_get_product( $product_id );
				$product_ids[] = $product_id;

				if ( $product ) {
					$product_names[] = $product->get_title();
				} else {
					$order           = wc_get_order( $product_id );
					$product_names[] = WC_Connect_Utils::get_product_name_from_order( $product_id, $order );
				}
			}

			$label_meta['product_names'] = $product_names;
			$label_meta['product_ids']   = $product_ids;
			$label_meta['id']            = $package['id']; // internal shipment id.

			array_unshift( $purchased_labels_meta, $label_meta );
		}
		return $purchased_labels_meta;
	}

	/**
	 * Prepares packages request for Connect Server.
	 *
	 * @param array $packages Packages from purchase request.
	 * @return array Prepared packages request payload.
	 */
	private function prepare_packages_for_purchase( $packages ) {
		$last_box_id     = '';
		$last_service_id = '';
		$last_carrier_id = '';
		foreach ( $packages as $index => $package ) {
			unset( $package['service_name'] );
			$packages[ $index ] = $package;

			if ( empty( $last_box_id ) && ! empty( $package['box_id'] ) ) {
				$last_box_id = $package['box_id'];
			}

			if ( empty( $last_service_id ) && ! empty( $package['service_id'] ) ) {
				$last_service_id = $package['service_id'];
			}

			if ( empty( $last_carrier_id ) && ! empty( $package['carrier_id'] ) ) {
				$last_carrier_id = $package['carrier_id'];
			}
		}

		// Store most recently used box/service/carrier.
		if ( ! empty( $last_box_id ) ) {
			update_user_meta( get_current_user_id(), 'wcshipping_last_box_id', $last_box_id );
		}

		if ( ! empty( $last_service_id ) && '' !== $last_service_id ) {
			update_user_meta( get_current_user_id(), 'wcshipping_last_service_id', $last_service_id );
		}

		if ( ! empty( $last_carrier_id ) && '' !== $last_carrier_id ) {
			update_user_meta( get_current_user_id(), 'wcshipping_last_carrier_id', $last_carrier_id );
		}

		return $packages;
	}

	/**
	 * Store user meta.
	 *
	 * @param array $user_meta User meta array.
	 */
	public function update_user_meta( $user_meta ) {
		if ( empty( $user_meta ) ) {
			return;
		}
		foreach ( $user_meta as $key => $value ) {
			update_user_meta( get_current_user_id(), 'wcshipping_' . $key, $value );
		}
	}

	public function get_status( $label_id ) {
		return $this->api_client->get_label_status( $label_id );
	}

	public function update_order_label( int $order_id, $label_data ) {
		return $this->settings_store->update_label_order_meta_data( $order_id, $label_data );
	}

	/**
	 *
	 * @param $order_id int
	 * @param $selected_meta [
	 *    'selected_rate' => [],
	 *   'hazmat' => []
	 *   'origin' => []
	 *   'destination' => []
	 * ]
	 *
	 * @return array
	 */
	private function store_selected_meta( $order_id, $selected_meta ): array {
		$order = wc_get_order( $order_id );
		foreach ( $selected_meta as $key => $value ) {
			$selected_state = $order->get_meta( $key );
			$selected_state = array_merge( empty( $selected_state ) ? array() : $selected_state, $value );
			$order->update_meta_data( $key, $selected_state );
		}
		$order->save();

		return $selected_meta;
	}

	/**
	 * @return object|WP_Error
	 */
	public function refund_label( int $order_id, int $label_id ) {
		$response = $this->api_client->send_shipping_label_refund_request( $label_id );

		if ( isset( $response->error ) ) {
			$response = new WP_Error(
				property_exists( $response->error, 'code' ) ? $response->error->code : 'refund_error',
				property_exists( $response->error, 'message' ) ? $response->error->message : ''
			);
		}

		if ( is_wp_error( $response ) ) {
			$this->logger->log( $response, __CLASS__ );
			return $response;
		}

		$label_refund = (object) array(
			'label_id' => (int) $response->label->id,
			'refund'   => $response->refund,
		);

		$this->settings_store->update_label_order_meta_data( $order_id, $label_refund );

		return $response;
	}
}
