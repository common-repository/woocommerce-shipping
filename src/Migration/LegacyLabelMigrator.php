<?php

namespace Automattic\WCShipping\Migration;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once WCSHIPPING_PLUGIN_DIR . '/classes/class-wc-connect-service-settings-store.php';

use Automattic\WCShipping\Connect\WC_Connect_Service_Settings_Store;
use Automattic\WCShipping\Shipments\ShipmentsService;
use Automattic\WooCommerce\Internal\BatchProcessing\BatchProcessingController;
use Automattic\WooCommerce\Internal\BatchProcessing\BatchProcessorInterface;
use Automattic\WooCommerce\Internal\Traits\AccessiblePrivateMethods;
use Automattic\WooCommerce\Utilities\OrderUtil;
use Automattic\WooCommerce\Utilities\StringUtil;
use Exception;
use WC_Order;
use WC_Order_Factory;

/**
 * Class LegacyLabelMigrator
 *
 * This service will migrate label data from WCS&T to the WC Shipping.
 *
 * @package Automattic\WCShipping\Migration
 */
class LegacyLabelMigrator implements BatchProcessorInterface {

	use AccessiblePrivateMethods;

	const LEGACY_LABEL_META_KEY     = 'wc_connect_labels';
	const WCSHIPPING_LABEL_META_KEY = 'wcshipping_labels';

	const DESTINATION_NORMALIZED = array(
		'legacy'     => '_wc_connect_destination_normalized',
		'wcshipping' => WC_Connect_Service_Settings_Store::IS_DESTINATION_NORMALIZED_KEY,
	);

	/**
	 * @var WC_Connect_Service_Settings_Store $settings_store
	 */
	private $settings_store;

	/**
	 * @var int $total_pending_count
	 */
	private $total_pending_count;

	/**
	 * @var int $total_count
	 */
	private $total_count;

	/**
	 * @var int $total_processed_count
	 */
	private $total_processed_count = 0;

	public function __construct( WC_Connect_Service_Settings_Store $settings_store ) {
		$this->settings_store = $settings_store;

		self::mark_method_as_accessible( 'convert_item_and_copy_label_data' );
	}

	public function get_name(): string {
		return 'WooCommerce Shipping label migrator';
	}

	public function get_description(): string {
		return 'Migrates labels from legacy extension to WooCommerce Shipping';
	}

	public function get_total_count(): int {
		if ( $this->total_count ) {
			return $this->total_count;
		}

		global $wpdb;
		$table_name  = OrderUtil::get_table_for_order_meta();

		$this->total_count = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT COUNT(*) FROM %i WHERE meta_key=%s',
				$table_name,
				self::LEGACY_LABEL_META_KEY
			)
		);

		return $this->total_count;
	}

	public function get_total_pending_count(): int {
		if ( $this->total_pending_count ) {
			return $this->total_pending_count;
		}

		global $wpdb;
		$table_name  = OrderUtil::get_table_for_order_meta();
		$column_name = OrderUtil::custom_orders_table_usage_is_enabled() ? 'order_id' : 'post_id';

		$this->total_pending_count = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT COUNT(*) FROM %i WHERE meta_key=%s AND %i NOT IN ( SELECT %i FROM %i WHERE meta_key=%s )',
				$table_name,
				self::LEGACY_LABEL_META_KEY,
				$column_name,
				$column_name,
				$table_name,
				self::WCSHIPPING_LABEL_META_KEY
			)
		);

		return $this->total_pending_count;
	}

	public function get_next_batch_to_process( int $size ): array {
		global $wpdb;
		$table_name  = OrderUtil::get_table_for_order_meta();
		$column_name = OrderUtil::custom_orders_table_usage_is_enabled() ? 'order_id' : 'post_id';
		$next_batch  = $wpdb->get_col(
			$wpdb->prepare(
				'SELECT %i FROM %i WHERE meta_key=%s AND %i NOT IN ( SELECT %i FROM %i WHERE meta_key=%s ) LIMIT %d ',
				$column_name,
				$table_name,
				self::LEGACY_LABEL_META_KEY,
				$column_name,
				$column_name,
				$table_name,
				self::WCSHIPPING_LABEL_META_KEY,
				$size
			)
		);

		if ( empty( $next_batch ) ) {
			do_action( 'wcshipping_labels_migration_completed', array( 'orders_migrated' => $this->total_processed_count ) );
		}

		return $next_batch;
	}

	public function process_batch( array $order_ids ): void {
		/** @var WC_Order[] $orders */
		$orders = WC_Order_Factory::get_orders( $order_ids, true );
		foreach ( $orders as $order ) {
			try {
				$this->convert_item_and_copy_label_data( $order );
				++$this->total_processed_count;
				--$this->total_pending_count;
			} catch ( Exception $ex ) {
				wc_get_logger()->error( '%s: when migrating meta row with id %d: %s', StringUtil::class_name_without_namespace( self::class ), $order->get_id(), $ex->getMessage() );
			}
		}
	}

	public function get_default_batch_size(): int {
		return 100;
	}

	public function start(): void {
		do_action( 'wcshipping_labels_migration_started', array( 'orders_to_migrate' => $this->get_total_pending_count() ) );
		$controller = wc_get_container()->get( BatchProcessingController::class );

		if ( ! $controller->is_enqueued( self::class ) ) {
			$controller->enqueue_processor( self::class );
		}
	}

	public function stop(): void {
		$controller = wc_get_container()->get( BatchProcessingController::class );
		if ( $controller->is_enqueued( self::class ) ) {
			$controller->remove_processor( self::class );
		}
	}

	/**
	 * Check if there are any orders that need to be migrated.
	 *
	 * @return bool
	 */
	public function needs_migration(): bool {
		return $this->get_total_pending_count() > 0;
	}

	/**
	 * Check if the migration is currently queued.
	 *
	 * @return bool
	 */
	public function migration_queued(): bool {
		$controller = wc_get_container()->get( BatchProcessingController::class );
		return $controller->is_enqueued( self::class );
	}

	/**
	 * Add internal shipment id which is the index of the WCS shipment
	 * Internal ids as representation of shipment id see LabelPurchaseService::get_labels_meta_from_response
	 */
	private function add_internal_shipment_id( array $label, int $label_index ): array {
			return array_merge(
				$label,
				array(
					'id' => $label_index,
				)
			);
	}

	/**
	 * @param int[]           $product_ids
	 * @param array<int, int> $product_id_to_item_map A map of product id to item id
	 *
	 * @return array
	 */
	private function get_order_shipments( array $product_ids, array $product_id_to_item_map ): array {
		$shipments = array();
		foreach ( $product_ids as $key => $product_id ) {
			$found_index = null;
			foreach ( $shipments as $shipment_index => $shipment ) {
				if ( $shipment['id'] === $product_id_to_item_map[ $product_id ] ) {
					$found_index = $shipment_index;
					break;
				}
			}

			if ( $found_index !== null ) {
				$shipments[ $found_index ]['id'] = $product_id_to_item_map[ $product_id ];
				if ( empty( $shipments[ $found_index ]['subItems'] ) ) {
					$shipments[ $found_index ]['subItems'] = array(
						sprintf(
							'%s-sub-%s',
							$product_id_to_item_map[ $product_id ],
							0
						),
					);
				}

				$shipments[ $found_index ]['subItems'] = array_merge(
					$shipments[ $found_index ]['subItems'],
					array(
						sprintf(
							'%s-sub-%s',
							$product_id_to_item_map[ $product_id ],
							count( $shipments[ $found_index ]['subItems'] )
						),
					)
				);
			} else {
				$shipments[ $key ] = array(
					'id'       => $product_id_to_item_map[ $product_id ],
					'subItems' => array(),
				);
			}
		}

		return array_values( $shipments ); // reset array keys;
	}

	private function convert_item_and_copy_label_data( WC_Order $order ): void {
		$labels_data = $this->settings_store->get_label_order_meta_data( $order->get_id(), true );

		$converted_label_data   = array();
		$shipments              = array();
		$order_items            = $order->get_items();
		$product_id_to_item_map = array();

		foreach ( $order_items as $item ) {
			// ViewService::get_order_data expects variant_id as `product_id` if variant_id is not falsy.
			$key                            = method_exists( $item, 'get_variation_id' ) && $item->get_variation_id( 'edit' )
				? $item->get_variation_id( 'edit' )
				: $item->get_product_id( 'edit' );
			$product_id_to_item_map[ $key ] = $item->get_id();
		}

		foreach ( $labels_data as $index => $label ) {
			$converted_label_data[] = array_merge(
				$this->add_internal_shipment_id( $label, $index ),
				array(
					'is_legacy' => true,
				)
			);

			$shipments[ $index ] = ! empty( $label['product_ids'] ) && is_array( $label['product_ids'] ) ?
				$this->get_order_shipments( $label['product_ids'], $product_id_to_item_map )
				: array();
		}

		$order->update_meta_data( ShipmentsService::META_KEY, $shipments );

		$order->add_meta_data( self::WCSHIPPING_LABEL_META_KEY, $converted_label_data, true );

		$legacy_destination_normalized = $order->get_meta( self::DESTINATION_NORMALIZED['legacy'], true );
		$order->add_meta_data( self::DESTINATION_NORMALIZED['wcshipping'], $legacy_destination_normalized, true );

		$order->save();
	}
}
