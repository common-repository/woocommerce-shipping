import { WCTracks } from './wc-tracks.d';
import { WCShippingConfig } from './wcshipping-config.d';
import { WCShippingSettings } from './wcshipping-settings.d';
import { WC } from './wc.d';

declare global {
	interface Window {
		WCShipping_Config: WCShippingConfig;
		MSStream: unknown;
		wcTracks: WCTracks;
		wcShippingSettings: WCShippingSettings;
		wc?: WC;
	}
}

export { WCShippingConfig };
export * from './helpers';
export * from './rate.d';
export * from './order-item.d';
export * from './package.d';
export * from './custom-package.d';
export * from './customs-item.d';
export * from './customs-state.d';
export * from './form-validation.d';
export * from './destination.d';
export * from './connect-server';
export * from './origin-address.d';
export * from './label.d';
export * from './store-options.d';
export * from './paper-size.d';
export * from './pdf-json.d';
export * from './hazmat.d';
export * from './hazmat-state.d';
export * from './selected-hazmat.d';
export * from './label-purchase-error.d';
export * from './order.d';
export * from './carrier.d';
export * from './address-normalization.d';
export * from './continent.d';
export * from './address-types.d';
export * from './selected-rates.d';
export * from './selected-origin.d';
export * from './selected-destination.d';
export * from './rate-with-parent.d';
export * from './reduxe-helpers.d';
export * from './available-packages.d';
export * from './wpcom-connection.d';
export * from './shipment-item.d';
export * from './label-shipment-id-map.d';
export * from './store-notice.d';
export * from './user-meta.d';
export * from './constants.d';
