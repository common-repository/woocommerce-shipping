import {
	CamelCaseType,
	Carrier,
	CustomPackageResponse,
	CustomsState,
	HazmatState,
	Label,
	LabelPurchaseError,
	Rate,
	RequestAddress,
	ShipmentRecord,
} from 'types';
import { getPreparedDestination } from '../address/selectors';

export interface LabelPurchaseState extends object {
	rates?: Record<
		string,
		{
			default: Record< Carrier, Rate[] >;
			signature_required: Record< Carrier, Rate[] >;
			adult_signature_required: Record< Carrier, Rate[] >;
		}
	>;
	labels: Record< string, Label[] > | null;
	purchaseAPIErrors: Record< string, LabelPurchaseError >;
	selectedRates:
		| ShipmentRecord< {
				rate: Rate;
				parent: Rate | null;
		  } >
		| '';
	selectedHazmatConfig: HazmatState | '';
	selectedOrigins: Record< string, CamelCaseType< RequestAddress > > | null;
	selectedDestinations: Record<
		string,
		ReturnType< typeof getPreparedDestination >
	> | null;
	customsInformation: ShipmentRecord< CustomsState > | '';
	packages: {
		custom: CamelCaseType< CustomPackageResponse >[];
		predefined: Record< string, string[] >;
		errors: Record< string, string >;
	};
	order?: {
		status?: string;
		error?: string;
	};
}
