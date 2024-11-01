<?php

namespace Automattic\WCShipping\Shipments;

use Automattic\WCShipping\Connect\WC_Connect_Service_Settings_Store;
use WC_Order;
use Automattic\WCShipping\Exceptions\RESTRequestException;

class ShipmentsService {

	const META_KEY = '_wcshipping-shipments';

	/**
	 * @var WC_Connect_Service_Settings_Store
	 */
	protected $settings_store;

	public function __construct( WC_Connect_Service_Settings_Store $settings_store ) {
		$this->settings_store = $settings_store;
	}

	/**
	 * Update shipments on an order.
	 *
	 * @param int   $order_id The WC order ID.
	 * @param array $shipments The shipments.
	 * @param array $shipment_ids_to_update The shipment ID map to update.
	 * @return RESTRequestException|int
	 *
	 * @throws RESTRequestException Will throw an error if the order is not found.
	 */
	public function update_order_shipments( int $order_id, array $shipments, array $shipment_ids_to_update = array() ) {
		/**
		 * @var WC_Order $order
		 */
		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			/*
			 * We have to escape an exceptions output in case it's not caught internally.
			 *
			 * @link https://github.com/WordPress/WordPress-Coding-Standards/issues/884
			 */
			throw new RESTRequestException( esc_html__( 'Order not found when updating order shipments ', 'woocommerce-shipping' ) );
		}

		$order->update_meta_data( self::META_KEY, $shipments );

		if ( ! empty( $shipment_ids_to_update ) ) {
			$order_labels = $this->settings_store->get_label_order_meta_data( $order_id );
			foreach ( $order_labels as &$label ) {
				if ( isset( $shipment_ids_to_update[ $label['id'] ] ) ) {
					$label['id'] = $shipment_ids_to_update[ $label['id'] ];
				}
			}
			$order->update_meta_data( 'wcshipping_labels', $order_labels );
		}

		return $order->save();
	}

	public function get_order_shipments_json( $order_id ) {
		/**
		 * @var WC_Order $order
		 */
		$order = wc_get_order( $order_id );
		if ( $order instanceof WC_Order ) {
			$value = $order->get_meta( self::META_KEY );

			return wp_json_encode( ! empty( $value ) ? $value : array() );
		}

		return wp_json_encode( array() );
	}
}
