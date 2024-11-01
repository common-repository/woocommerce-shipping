import { mapValues } from 'lodash';
import { useCallback, useState } from '@wordpress/element';
import { dispatch, select, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { CustomPackage, Package, Rate, RequestPackage } from 'types';
import { getAccountSettings, getCurrentOrder } from 'utils';
import { labelPurchaseStore } from 'data/label-purchase';
import { CUSTOM_BOX_ID_PREFIX, PACKAGE_TYPES } from '../packages';
import type { usePackageState } from './packages';
import { useHazmatState } from './hazmat';
import { useCustomsState } from './customs';
import { useShipmentState } from './shipment';
import { RATES_FETCH_FAILED } from 'data/label-purchase/action-types';
import { WPErrorRESTResponse } from 'types';

interface UseRatesStateProps {
	currentShipmentId: string;
	currentPackageTab: string;
	getPackageForRequest: ReturnType<
		typeof usePackageState
	>[ 'getPackageForRequest' ];
	applyHazmatToPackage: ReturnType<
		typeof useHazmatState
	>[ 'applyHazmatToPackage' ];
	totalWeight: number;
	customs: ReturnType< typeof useCustomsState >;
	getShipmentOrigin: ReturnType<
		typeof useShipmentState
	>[ 'getShipmentOrigin' ];
}

/**
 * This regexp is intended to catch field errors in the format of "%1$s must be greater than %2$d."
 *
 * @see maybeReformatInvalidParamError
 * @see rest_validate_value_from_schema() in wp-includes/rest-api.php
 */
const restInvalidParamErrorMessageRegexp = /^([^\s]+) (.+)$/;

/**
 * Mapping of section name as extracted using `restInvalidParamErrorMessageRegexp` to a human-readable name.
 */
const ratesEndpointArgToSectionNameMap: Record< string, string > = {
	origin: __( 'Origin address', 'woocommerce-shipping' ),
	destination: __( 'Destination address', 'woocommerce-shipping' ),
};

/**
 * Mapping of field name as extracted using `restInvalidParamErrorMessageRegexp` to a human-readable name.
 */
const ratesEndpointArgToFieldDescriptionMap: Record< string, string > = {
	'packages[0][length]': __( 'Package length', 'woocommerce-shipping' ),
	'packages[0][width]': __( 'Package width', 'woocommerce-shipping' ),
	'packages[0][height]': __( 'Package height', 'woocommerce-shipping' ),
	'packages[0][weight]': __( 'Package weight', 'woocommerce-shipping' ),
};

const maybePrependSectionName = (
	errorMessage: string,
	sectionName?: string
) => {
	if ( sectionName ) {
		return sprintf(
			// translators: %1$s The name of the form section containing the erroneous form field, %2$s is the error message.
			__( '%1$s: %2$s', 'woocommerce-shipping' ),
			sectionName,
			errorMessage
		);
	}

	return errorMessage;
};

/**
 * Parses REST endpoint errors with the code `rest_invalid_param` matching `restInvalidParamErrorMessageRegexp`.
 *
 * When detected, these will be reformatted to use human-readable field names, as defined in
 * `ratesEndpointArgToFieldDescriptionMap`.
 *
 * @param payload
 */
const maybeReformatInvalidParamError = ( payload: WPErrorRESTResponse ) => {
	if ( payload.code !== 'rest_invalid_param' ) {
		return null;
	}

	return Object.entries( payload.data.params )
		.map( ( [ erroneousSection, paramErrorMessage ] ) => {
			const sectionName =
				ratesEndpointArgToSectionNameMap[ erroneousSection ] ?? '';

			const regexpMatch = paramErrorMessage.match(
				restInvalidParamErrorMessageRegexp
			);

			if ( regexpMatch === null ) {
				return maybePrependSectionName(
					paramErrorMessage,
					sectionName
				);
			}

			const [ , fieldName, fieldError ] = regexpMatch;
			const mappedFieldName =
				ratesEndpointArgToFieldDescriptionMap[ fieldName ] ?? fieldName;

			return maybePrependSectionName(
				sprintf(
					// translators: %1$s The name of the form field that has an error (origin address or destination), %2$s is the error message, e.g. "must be greater than 0".
					__( '%1$s %2$s.', 'woocommerce-shipping' ),
					mappedFieldName,
					fieldError
				),
				sectionName
			);
		} )
		.join( '\n' );
};

export function useRatesState( {
	currentShipmentId,
	getPackageForRequest,
	applyHazmatToPackage,
	totalWeight,
	customs: { maybeApplyCustomsToPackage },
	getShipmentOrigin,
}: UseRatesStateProps ) {
	const accountSettings = getAccountSettings();
	const currentShipmentRates =
		select( labelPurchaseStore ).getSelectedRates();
	const [ selectedRates, selectRates ] = useState<
		Record<
			string,
			| {
					rate: Rate;
					parent: null | Rate;
			  }
			| null
			| undefined
		>
	>(
		currentShipmentRates ?? {
			0: null,
		}
	);

	const [ isFetching, setIsFetching ] = useState( false );
	const [ errors, setErrors ] = useState<
		Record<
			string | 'endpoint',
			| boolean
			| null
			| Record< string | 'rates' | 'message', string | string[] >
		>
	>( {} );

	const availableRates = useSelect(
		( selector ) => {
			return selector( labelPurchaseStore ).getRatesForShipment(
				currentShipmentId
			);
		},
		[ currentShipmentId ]
	);
	const selectRate = useCallback(
		( rate: Rate, parent?: Rate ) =>
			selectRates( ( prev ) => ( {
				...prev,
				[ currentShipmentId ]: {
					rate,
					parent: parent ?? null,
				},
			} ) ),
		[ currentShipmentId ]
	);

	const getSelectedRate = useCallback(
		() => selectedRates[ currentShipmentId ],
		[ currentShipmentId, selectedRates ]
	);

	/**
	 * Remove the currently selected shipment rate.
	 *
	 * This could be useful e.g. after a label has been refunded, and we want
	 * to remove the current selection.
	 */
	const removeSelectedRate = useCallback( () => {
		selectRates( {
			...selectedRates,
			[ currentShipmentId ]: null,
		} );
	}, [ currentShipmentId, selectedRates ] );

	const preselectRateBasedOnLastSelections = useCallback( () => {
		if ( ! accountSettings.purchaseSettings.use_last_service ) {
			return;
		}
		const { last_carrier_id, last_service_id } = accountSettings.userMeta;
		const rates =
			select( labelPurchaseStore ).getRatesForShipment(
				currentShipmentId
			);

		if ( rates?.[ last_carrier_id ] ) {
			const ratesForService = rates[ last_carrier_id ];
			const selectableRate = ratesForService.find(
				( rate ) => rate.serviceId === last_service_id
			);

			if ( selectableRate ) {
				selectRate( selectableRate );
			}
		}
	}, [ currentShipmentId, selectRate, accountSettings ] );

	const fetchRates = useCallback(
		async (
			pkg: ( Package | CustomPackage ) & {
				isLetter?: boolean;
			}
		) => {
			setIsFetching( true );
			setErrors( { ...errors, endpoint: null } );
			selectRates( {
				0: null,
			} );

			const {
				type,
				isLetter,
				id = CUSTOM_BOX_ID_PREFIX,
				length,
				width,
				height,
			} = pkg;

			const dimensions = mapValues(
				{ length, width, height },
				parseFloat
			);
			const requestPackage: RequestPackage = {
				id: currentShipmentId,
				box_id: id,
				...dimensions,
				weight: totalWeight,
				is_letter: type
					? type === PACKAGE_TYPES.ENVELOPE
					: isLetter ?? false,
			};

			// @ts-ignore TODO: Convert getRates to TypeScript
			const { payload, type: responseType } = await dispatch(
				labelPurchaseStore
			).getRates( {
				packages: [
					maybeApplyCustomsToPackage(
						applyHazmatToPackage( requestPackage )
					),
				],
				orderId: getCurrentOrder().id,
				origin: getShipmentOrigin(),
			} );

			if ( responseType === RATES_FETCH_FAILED ) {
				setErrors( ( prev ) => ( {
					...prev,
					endpoint: {
						rates:
							maybeReformatInvalidParamError( payload ) ??
							payload?.message ??
							__(
								'There was an issue getting rates for this package, please try again.',
								'woocommerce-shipping'
							),
					},
				} ) );
			}

			const endpointErrors: {
				message: string;
			}[] = payload?.[ 0 ]?.default?.errors ?? [];

			if ( endpointErrors.length ) {
				setErrors( ( prev ) => ( {
					...prev,
					endpoint: {
						rates: endpointErrors.map( ( { message } ) => message ),
					},
				} ) );
			}

			setIsFetching( false );

			preselectRateBasedOnLastSelections();
		},
		[
			errors,
			currentShipmentId,
			totalWeight,
			applyHazmatToPackage,
			maybeApplyCustomsToPackage,
			getShipmentOrigin,
			preselectRateBasedOnLastSelections,
		]
	);

	/**
	 * Updates the rates based on the current package data
	 */
	const updateRates = useCallback( () => {
		// Not updating if last request hasn't had any rates or is still fetching
		if (
			! availableRates ||
			Object.keys( availableRates ).length < 1 ||
			isFetching
		) {
			return;
		}

		const pkg = getPackageForRequest();

		/**
		 * Excluding the boxWeight and name fields from the check boxWeight is
		 * not a mandatory field since it can be 0, and we always use totalWeight
		 * name is not a mandatory field since it's only used for custom packages
		 */
		if ( ! pkg ) {
			return;
		}
		// eslint-disable-next-line no-unused-vars
		const { name, boxWeight, isUserDefined, ...mandatoryFields } = pkg;
		const isAnyFieldEmpty = Object.values< string | boolean >(
			mandatoryFields
		).some( ( field ) => ! field && typeof field !== 'boolean' );
		if ( ! isAnyFieldEmpty ) {
			fetchRates( pkg );
		}
	}, [ fetchRates, availableRates, isFetching, getPackageForRequest ] );

	return {
		selectedRates,
		selectRates,
		selectRate,
		getSelectedRate,
		removeSelectedRate,
		isFetching,
		updateRates,
		fetchRates,
		errors,
		setErrors,
	};
}
