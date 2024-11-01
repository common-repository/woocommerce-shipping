import { groupBy, memoize, isEmpty } from 'lodash';
import { __ } from '@wordpress/i18n';
import { camelCaseKeys } from './common';

const groupByServiceId = memoize( ( rates ) => groupBy( rates, 'serviceId' ) );
export const getSignatureRate = (
	serviceId,
	signatureRates,
	baseCost,
	type = 'signatureRequired'
) => {
	const serviceRates = groupByServiceId( signatureRates )[ serviceId ];

	// Skip if there was no rate for this service type.
	if ( ! serviceRates || serviceRates.length === 0 ) {
		return null;
	}

	const serviceRate = serviceRates[ 0 ];

	/**
	 * USPS returns signature rates that are not valid. These can be identified
	 * by the fact that the price with signature required is the same as the
	 * base cost. Priority Express service is the exception because signature
	 * can be required free-of-charge.
	 */
	if ( serviceRate.rate === baseCost && serviceId !== 'Express' ) {
		return null;
	}
	return {
		...serviceRate,
		type,
	};
};

export const groupRatesByCarrier = ( allRates ) =>
	Object.entries( allRates ).reduce(
		( acc, [ shipmentId, shipmentRates ] ) => ( {
			[ shipmentId ]: Object.entries( shipmentRates ).reduce(
				( ratesAcc, [ key, { rates } ] ) => ( {
					...ratesAcc,
					[ key ]: {
						...( ratesAcc[ key ] || {} ),
						...groupBy( rates.map( camelCaseKeys ), 'carrierId' ),
					},
				} ),
				{}
			),
		} ),
		{}
	);

export const applyShipmentHazmat = ( shipmentPackage, shipmentHazmat ) => {
	if ( shipmentHazmat?.isHazmat && ! isEmpty( shipmentHazmat.category ) ) {
		return {
			...shipmentPackage,
			hazmat: shipmentHazmat.category,
		};
	}

	return shipmentPackage;
};

export const signatureTypeToTitle = ( signatureType ) => {
	return {
		signatureRequired: __( 'Signature Required', 'woocommerce-shipping' ),
		adultSignatureRequired: __(
			'Adult Signature Required',
			'woocommerce-shipping'
		),
	}[ signatureType ];
};
