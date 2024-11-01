<?php

namespace Automattic\WCShipping\LabelPurchase;

use Automattic\WCShipping\Utils;
use WC_Order;
use WC_Order_Item_Product;

class ViewService {

	/**
	 * Remove shipment information stored along the label for labels with PURCHASE_ERROR status based on the shipment id.
	 *
	 * @param array $purchased_labels [
	 *    [ 'id' => {WCS shipment id}, 'status' => 'PURCHASED' ],
	 *    [ 'id' => {WCS shipment id}, 'status' => 'PURCHASE_ERROR' ]
	 *  ]
	 * @param array $shipment_meta [ 'shipment_0' => [...], 'shipment_1' => [...] ]
	 *
	 * @return array
	 */
	public function remove_meta_for_purchase_error( array $purchased_labels, array $shipment_meta ): array {
		foreach ( $purchased_labels as $purchased_label ) {
			$shipment_id = $purchased_label['id'];
			if (
				$purchased_label['status'] === 'PURCHASE_ERROR' &&
				isset( $shipment_meta[ "shipment_{$shipment_id}" ] )
			) {
				unset( $shipment_meta[ "shipment_{$shipment_id}" ] );
			}
		}

		return $shipment_meta;
	}

	/**
	 * Remove shipment information stored along refunded labels.
	 *
	 * The purchased label will still contain all refund related data (e.g. status), but we will no longer be using the
	 * selected rate itself, so we might as well filter it out immediately to make dependent logic simpler (e.g. React).
	 *
	 * @param array[] $purchased_labels {
	 *     @type int      $id The WCS shipment ID (read: not label ID).
	 *     @type int      $label_id The purchased label ID.
	 *     @type object   $refund A conditional object that will only exist if the label has a refund request.
	 *     ...
	 * }
	 * @param array[] $shipment_meta An array of shipment related meta-data. The key for these are "shipment_{id}".
	 * @return array
	 */
	public function remove_meta_for_refunds( array $purchased_labels, array $shipment_meta ): array {
		foreach ( $purchased_labels as $purchased_label ) {
			$shipment_key = sprintf( 'shipment_%d', $purchased_label['id'] );

			if (
				! empty( $purchased_label['refund'] ) &&
				isset( $shipment_meta[ $shipment_key ] )
			) {
				unset( $shipment_meta[ $shipment_key ] );
			}
		}

		return $shipment_meta;
	}

	/**
	 * Remove customs information snapshots for refunded shipments.
	 *
	 * @param array[] $purchased_labels {
	 *     @type int      $id The WCS shipment ID (read: not label ID).
	 *     @type object   $refund A conditional object that will only exist if the label has a refund request.
	 *     ...
	 * }
	 * @param array[] $customs_information An array of customs form snapshots. The key for these are "shipment_{id}".
	 * @return array
	 */
	public function remove_customs_information_for_refunds( array $purchased_labels, array $customs_information ): array {
		foreach ( $purchased_labels as $purchased_label ) {
			$shipment_key = sprintf( 'shipment_%d', $purchased_label['id'] );

			if (
				! empty( $purchased_label['refund'] ) &&
				isset( $customs_information[ $shipment_key ] )
			) {
				unset( $customs_information[ $shipment_key ] );
			}
		}

		return $customs_information;
	}

	/**
	 * This function transform the WC_Order object to a representational JSON form for the React app.
	 *
	 * This is based on WooCommerce v3's get_order API woocommerce/includes/legacy/api/v3/class-wc-api-orders.php.
	 *
	 * @param WC_Order $order The Woo Order we wish to prepare for the API.
	 * @return array
	 */
	public function get_order_data( WC_Order $order ): array {
		$decimal_point = 2;
		$order_data    = array(
			'id'                        => $order->get_id(),
			'order_number'              => $order->get_order_number(),
			'order_key'                 => $order->get_order_key(),
			'created_at'                => $order->get_date_created() ? $order->get_date_created()->getTimestamp() : 0,
			'updated_at'                => wc_format_datetime( $order->get_date_modified() ? $order->get_date_modified()->getTimestamp() : 0 ),
			'completed_at'              => wc_format_datetime( $order->get_date_completed() ? $order->get_date_completed()->getTimestamp() : 0 ),
			'status'                    => $order->get_status(),
			'currency'                  => $order->get_currency(),
			'total'                     => wc_format_decimal( $order->get_total(), $decimal_point ),
			'subtotal'                  => wc_format_decimal( $order->get_subtotal(), $decimal_point ),
			'total_line_items_quantity' => 0,
			'total_tax'                 => wc_format_decimal( $order->get_total_tax(), $decimal_point ),
			'total_shipping'            => wc_format_decimal( $order->get_shipping_total(), $decimal_point ),
			'cart_tax'                  => wc_format_decimal( $order->get_cart_tax(), $decimal_point ),
			'shipping_tax'              => wc_format_decimal( $order->get_shipping_tax(), $decimal_point ),
			'total_discount'            => wc_format_decimal( $order->get_total_discount(), $decimal_point ),
			'shipping_methods'          => html_entity_decode( $order->get_shipping_method(), ENT_QUOTES, get_bloginfo( 'charset' ) ),
			'payment_details'           => array(
				'method_id'    => $order->get_payment_method(),
				'method_title' => $order->get_payment_method_title(),
				'paid'         => ! is_null( $order->get_date_paid() ),
			),
			'billing_address'           => array(
				'first_name' => $order->get_billing_first_name(),
				'last_name'  => $order->get_billing_last_name(),
				'company'    => $order->get_billing_company(),
				'address_1'  => $order->get_billing_address_1(),
				'address_2'  => $order->get_billing_address_2(),
				'city'       => $order->get_billing_city(),
				'state'      => $order->get_billing_state(),
				'postcode'   => $order->get_billing_postcode(),
				'country'    => $order->get_billing_country(),
				'email'      => $order->get_billing_email(),
				'phone'      => $order->get_billing_phone(),
			),
			'shipping_address'          => array(
				'first_name' => $order->get_shipping_first_name(),
				'last_name'  => $order->get_shipping_last_name(),
				'company'    => $order->get_shipping_company(),
				'address_1'  => $order->get_shipping_address_1(),
				'address_2'  => $order->get_shipping_address_2(),
				'city'       => $order->get_shipping_city(),
				'state'      => $order->get_shipping_state(),
				'postcode'   => $order->get_shipping_postcode(),
				'country'    => $order->get_shipping_country(),
				'email'      => $order->get_billing_email(),
				'phone'      => $order->get_shipping_phone(),
			),
			'note'                      => $order->get_customer_note(),
			'customer_ip'               => $order->get_customer_ip_address(),
			'customer_user_agent'       => $order->get_customer_user_agent(),
			'customer_id'               => $order->get_user_id(),
			'view_order_url'            => $order->get_view_order_url(),
			'line_items'                => array(),
			'shipping_lines'            => array(),
			'tax_lines'                 => array(),
			'fee_lines'                 => array(),
			'coupon_lines'              => array(),
		);

		// Add line items.
		foreach ( $order->get_items() as $item_id => $item ) {
			/** @var WC_Order_Item_Product $item */
			$product = $item->get_product();

			if ( ! $product instanceof \WC_Product ) {
				continue;
			}

			if ( ! $product->needs_shipping() ) {
				continue;
			}

			$order_data['total_line_items_quantity'] += $item->get_quantity();
			$product_meta                             = array();

			$customs_info = Utils::get_product_customs_data( $product );
			if ( $customs_info ) {
				$product_meta['customs_info'] = $customs_info;
			}

			$line_item = array(
				'id'           => $item_id,
				'subtotal'     => wc_format_decimal( $order->get_line_subtotal( $item, false, false ), $decimal_point ),
				'subtotal_tax' => wc_format_decimal( $item->get_subtotal_tax(), $decimal_point ),
				'total'        => wc_format_decimal( $order->get_line_total( $item, false, false ), $decimal_point ),
				'total_tax'    => wc_format_decimal( $item->get_total_tax(), $decimal_point ),
				'price'        => wc_format_decimal( $order->get_item_total( $item, false, false ), $decimal_point ),
				'quantity'     => $item->get_quantity(),
				'tax_class'    => $item->get_tax_class(),
				'name'         => $item->get_name(),
				'product_id'   => $item->get_variation_id() ? $item->get_variation_id() : $item->get_product_id(),
				'sku'          => is_object( $product ) ? $product->get_sku() : null,
				'meta'         => (object) $product_meta,
				'image'        => wp_get_attachment_url( $product->get_image_id() ) ?: wc_placeholder_img_src(),
				'weight'       => $product->get_weight(),
				'dimensions'   => array(
					'length' => $product->get_length(),
					'width'  => $product->get_width(),
					'height' => $product->get_height(),
				),
				'variation'    => array_values( $item->get_all_formatted_meta_data() ),
			);

			$order_data['line_items'][] = $line_item;
		}

		// Add shipping.
		foreach ( $order->get_shipping_methods() as $shipping_item_id => $shipping_item ) {
			$order_data['shipping_lines'][] = array(
				'id'           => $shipping_item_id,
				'method_id'    => $shipping_item->get_method_id(),
				'method_title' => $shipping_item->get_name(),
				'total'        => wc_format_decimal( $shipping_item->get_total(), $decimal_point ),
			);
		}

		// Add taxes.
		foreach ( $order->get_tax_totals() as $tax_code => $tax ) {
			$tax_line = array(
				'id'       => $tax->id,
				'rate_id'  => $tax->rate_id,
				'code'     => $tax_code,
				'title'    => $tax->label,
				'total'    => wc_format_decimal( $tax->amount, $decimal_point ),
				'compound' => (bool) $tax->is_compound,
			);

			$order_data['tax_lines'][] = $tax_line;
		}

		// Add fees.
		foreach ( $order->get_fees() as $fee_item_id => $fee_item ) {
			$order_data['fee_lines'][] = array(
				'id'        => $fee_item_id,
				'title'     => $fee_item->get_name(),
				'tax_class' => $fee_item->get_tax_class(),
				'total'     => wc_format_decimal( $order->get_line_total( $fee_item ), $decimal_point ),
				'total_tax' => wc_format_decimal( $order->get_line_tax( $fee_item ), $decimal_point ),
			);
		}

		// Add coupons.
		foreach ( $order->get_items( 'coupon' ) as $coupon_item_id => $coupon_item ) {
			/** @var WC_Order_Item_Coupon $coupon_item */
			$coupon_line = array(
				'id'     => $coupon_item_id,
				'code'   => $coupon_item->get_code(),
				'amount' => wc_format_decimal( $coupon_item->get_discount(), $decimal_point ),
			);

			$order_data['coupon_lines'][] = $coupon_line;
		}

		return $order_data;
	}
}
