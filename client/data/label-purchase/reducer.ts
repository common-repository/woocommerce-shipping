import { mapKeys, mapValues } from 'lodash';
import {
	camelCasePackageResponse,
	createReducer,
	getConfig,
	getCustomsInformation,
	getLabelDestinations,
	getLabelOrigins,
	getPurchasedLabels,
	getSelectedHazmat,
	getSelectedRates,
	groupRatesByCarrier,
} from 'utils';
import {
	RATES_FETCHED,
	ORDER_STATUS_UPDATED,
	ORDER_STATUS_UPDATE_FAILED,
} from './action-types';
import { LabelPurchaseState } from '../types';
import {
	LabelPurchaseActions,
	LabelPurchaseSuccessAction,
	LabelStatusResolvedAction,
	PackageUpdateAction,
	PackageUpdateFailedAction,
	RatesFetchedAction,
	StageLabelsNewShipmentIdsAction,
	OrderStatusUpdatedAction,
	OrderStatusUpdatedFailedAction,
} from './types.d';
import {
	PACKAGES_UPDATE,
	PACKAGES_UPDATE_ERROR,
} from './packages/action-types';
import {
	LABEL_PURCHASE_SUCCESS,
	LABEL_STAGE_NEW_SHIPMENT_IDS,
	LABEL_STATUS_RESOLVED,
} from './label/action-types';

const {
	packagesSettings: { packages },
} = getConfig();

const defaultState: LabelPurchaseState = {
	packages: {
		...camelCasePackageResponse( packages ),
		errors: {},
	},
	rates: {},
	labels: getPurchasedLabels(),
	selectedRates: getSelectedRates(),
	selectedHazmatConfig: getSelectedHazmat(),
	selectedDestinations: getLabelDestinations(),
	selectedOrigins: getLabelOrigins(),
	purchaseAPIErrors: {},
	customsInformation: getCustomsInformation(),
} as const;

export const labelPurchaseReducer = createReducer( defaultState )
	.on( PACKAGES_UPDATE, ( state, { payload }: PackageUpdateAction ) => ( {
		...state,
		packages: {
			...state.packages,
			...payload,
		},
	} ) )
	.on(
		PACKAGES_UPDATE_ERROR,
		( state, { payload }: PackageUpdateFailedAction ) => {
			return {
				...state,
				packages: {
					...state.packages,
					errors: payload,
				},
			};
		}
	)
	.on( RATES_FETCHED, ( state, { payload }: RatesFetchedAction ) => ( {
		...state,
		rates: {
			...state.rates,
			...groupRatesByCarrier( payload ),
		},
	} ) )
	.on(
		LABEL_STATUS_RESOLVED,
		( state, { payload }: LabelStatusResolvedAction ) => ( {
			...state,
			labels: payload?.labelId
				? mapValues( state.labels, ( shipmentLabels ) => {
						return shipmentLabels.map( ( label ) => {
							if ( label.labelId === payload.labelId ) {
								return payload;
							}
							return label;
						} );
				  } )
				: state.labels,
		} )
	)
	.on(
		LABEL_PURCHASE_SUCCESS,
		(
			state,
			{
				payload: {
					label,
					selectedRates,
					selectedHazmat,
					selectedDestinations,
					selectedOrigins,
				},
			}: LabelPurchaseSuccessAction
		) => ( {
			...state,
			labels: {
				...state.labels,
				...label,
			},
			selectedRates: {
				...state.selectedRates,
				...selectedRates,
			},
			selectedHazmatConfig: {
				...state.selectedHazmatConfig,
				...selectedHazmat,
			},
			selectedDestinations: {
				...state.selectedDestinations,
				...selectedDestinations,
			},
			selectedOrigins: {
				...state.selectedOrigins,
				...selectedOrigins,
			},
		} )
	)
	.on(
		LABEL_STAGE_NEW_SHIPMENT_IDS,
		(
			state,
			{ payload: shipmentIdsToUpdate }: StageLabelsNewShipmentIdsAction
		) => ( {
			...state,
			labels: mapKeys(
				mapValues( state.labels, ( label, key ) =>
					key === shipmentIdsToUpdate[ key ]
						? {
								...label,
								id: shipmentIdsToUpdate[ key ],
						  }
						: label
				),
				( _, key ) => shipmentIdsToUpdate[ key ] ?? key
			),
		} )
	)
	.on(
		ORDER_STATUS_UPDATED,
		( state, { payload }: OrderStatusUpdatedAction ) => {
			return {
				...state,
				order: {
					...state.order,
					status: payload.status,
				},
			};
		}
	)
	.on(
		ORDER_STATUS_UPDATE_FAILED,
		( state, { payload }: OrderStatusUpdatedFailedAction ) => {
			return {
				...state,
				order: {
					...state.order,
					status: '',
					error: payload.error,
				},
			};
		}
	)
	.bind< LabelPurchaseActions >();
