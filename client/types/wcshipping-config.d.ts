import {
	CustomPackageResponse,
	LocationResponse,
	ResponseLabel,
} from './connect-server';
import { StoreOptions } from './store-options';
import { Order } from './order';
import { HazmatState } from './hazmat-state';
import { Continent } from './continent';
import { Destination } from './destination';
import { SelectedRates } from './selected-rates';
import { SelectedOrigin } from './selected-origin';
import { SelectedDestination } from './selected-destination';
import { CustomsState } from './customs-state';
import { Carrier } from './carrier';
import { OriginAddress } from './origin-address';
import { Constants } from './constants';
import { ShipmentRecord } from './helpers';

// Todo: Gradually improve this type definition.
export interface WCShippingConfig {
	order: Order;
	accountSettings: {
		purchaseSettings: {
			email_receipts: boolean;
			enabled: boolean;
			paper_size: string;
			selected_payment_method_id: number;
			use_last_package: boolean;
			use_last_service: boolean;
		};
		purchaseMeta: {
			can_edit_settings: boolean;
			can_manage_payments: boolean;
			master_user_email: string;
			master_user_login: string;
			master_user_name: string;
			master_user_wpcom_login: string;
			add_payment_method_url: string;
			payment_methods: Array< {
				card_digits: string;
				card_type: string;
				expiry: string;
				name: string;
				payment_method_id: number;
			} >;
		};
		userMeta: {
			last_box_id: string;
			last_carrier_id: Carrier;
			last_service_id: string;
			last_order_completed: boolean;
		};
		storeOptions: StoreOptions;
	};
	context: string;
	continents: Continent[];
	is_destination_verified: boolean;
	is_origin_verified: boolean;
	items: number;
	packagesSettings: Record< string, unknown > & {
		packages: {
			custom: CustomPackageResponse[];
			predefined: Record< string, string[] >;
		};
		schema: Record< string, unknown >;
	};
	shipments: Record< string, unknown >[];
	shippingLabelData: Record< string, unknown > & {
		storeOptions: StoreOptions;
		currentOrderLabels: ResponseLabel[];
		storedData: {
			destination: LocationResponse;
			selected_rates: SelectedRates | '';
			selected_hazmat: HazmatState | '';
			selected_origin: SelectedOrigin | '';
			selected_destination: SelectedDestination | '';
			customs_information: ShipmentRecord< CustomsState > | '';
		};
	};
	origin_addresses: LocationResponse[];
	eu_countries: string[];
	constants: Constants;
}
