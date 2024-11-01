import { __, sprintf } from '@wordpress/i18n';
import type { FormErrors } from '@woocommerce/components';
import { isEmpty, isNil } from 'lodash';
import { CustomsItem, CustomsValidationInput, Destination } from 'types';
import {
	isCountryInEU,
	isHSTariffNumberValid,
	USPS_ITN_REQUIRED_DESTINATIONS,
} from 'utils';
import { getCurrentOrderItems } from 'utils/order';
import { itnMatchingRegex } from './constants';

export const createLocalErrors = (
	items: CustomsItem[]
): CustomsValidationInput[ 'errors' ] => ( {
	items: Array( items.length )
		.fill( 0 )
		.map( () => ( {} as FormErrors< CustomsItem > ) ),
} );
export const validateContentTypes = ( {
	values: { contentsType, contentsExplanation, items, ...rest },
	errors,
}: CustomsValidationInput ): CustomsValidationInput => {
	const localErrors = createLocalErrors( items );
	if ( contentsType === 'other' ) {
		if ( ! contentsExplanation || contentsExplanation.length < 3 ) {
			localErrors.contentsExplanation = __(
				'Please describe what kind of goods this package contains.',
				'woocommerce-shipping'
			);
		}
	}

	return {
		errors: {
			...errors,
			...localErrors,
		},
		values: { contentsType, contentsExplanation, items, ...rest },
	};
};

export const validateRestrictionType = ( {
	values: { restrictionType, restrictionComments, items, ...rest },
	errors,
}: CustomsValidationInput ): CustomsValidationInput => {
	const localErrors = createLocalErrors( items );
	if ( restrictionType === 'other' ) {
		if ( ! restrictionComments || restrictionComments.length < 3 ) {
			localErrors.restrictionComments = __(
				'Please describe what kind of restrictions this package must have.',
				'woocommerce-shipping'
			);
		}
	}

	return {
		errors: {
			...errors,
			...localErrors,
		},
		values: { restrictionType, restrictionComments, items, ...rest },
	};
};

export const validateITN =
	( {
		country,
		countryName,
	}: {
		country: Destination[ 'country' ];
		countryName: string;
	} ) =>
	( {
		values: { itn, items, ...rest },
		errors,
	}: CustomsValidationInput ): CustomsValidationInput => {
		const localErrors = createLocalErrors( items );

		const orderItems = getCurrentOrderItems();
		const totalPrice = orderItems.reduce(
			( accu, curr ) => accu + parseFloat( curr.total ),
			0
		);

		if ( ! itn && totalPrice > 2500 ) {
			localErrors.itn = __(
				'For shipments exceeding $2,500, obtaining a 14-digit AES ITN is required for U.S. export reporting.',
				'woocommerce-shipping'
			);
		}

		if (
			itn &&
			! /^(?:(?:AES X\d{14})|(?:NOEEI 30\.\d{1,2}(?:\([a-z]\)(?:\(\d\))?)?))$/.test(
				itn
			)
		) {
			localErrors.itn = __(
				'Please enter a valid ITN.',
				'woocommerce-shipping'
			);
		}

		const valuesByProductId = items.reduce(
			( acc, { product_id, price, quantity } ) => {
				acc[ product_id ] = parseFloat( `${ price }` ) * quantity;
				return acc;
			},
			{} as Record< number, number >
		);

		const valuesByTariffNumber = items.reduce(
			( acc, { product_id, hsTariffNumber } ) => {
				if ( hsTariffNumber && hsTariffNumber.length === 6 ) {
					if ( ! acc[ hsTariffNumber ] ) {
						acc[ hsTariffNumber ] = 0;
					}
					acc[ hsTariffNumber ] += valuesByProductId[ product_id ];
				}
				return acc;
			},
			{} as Record< string, number >
		);

		const classesAbove2500usd = items.reduce( ( acc, { product_id } ) => {
			const { hsTariffNumber } = items.find(
				( { product_id: id } ) => id === product_id
			) ?? { hsTariffNumber: '' };
			if (
				hsTariffNumber !== '' &&
				valuesByTariffNumber[ hsTariffNumber ] > 2500
			) {
				acc.add( hsTariffNumber );
			}
			return acc;
		}, new Set() );

		if ( itn && itn.length > 0 ) {
			if ( ! new RegExp( itnMatchingRegex ).test( itn ) ) {
				localErrors.itn = __(
					'Please enter a valid ITN.',
					'woocommerce-shipping'
				);
			}
		} else if ( country !== 'CA' ) {
			if ( ! isEmpty( classesAbove2500usd ) ) {
				localErrors.itn = sprintf(
					// translators: %s is the tariff number
					__(
						'International Transaction Number is required for shipping items valued over $2,500 per tariff number. ' +
							'Products with tariff number %s add up to more than $2,500.',
						'woocommerce-shipping'
					),
					classesAbove2500usd.values().next().value // Just pick the first code
				);
			} else if ( USPS_ITN_REQUIRED_DESTINATIONS.includes( country ) ) {
				localErrors.itn = sprintf(
					// translators: %s is the country name
					__(
						'International Transaction Number is required for shipments to %s'
					),
					countryName
				);
			}
		}

		return {
			errors: {
				...errors,
				...localErrors,
			},
			values: { itn, items, ...rest },
		};
	};

export const validateItems =
	( { country }: Pick< Destination, 'country' > ) =>
	( {
		values: { items, ...rest },
		errors,
	}: CustomsValidationInput ): CustomsValidationInput => {
		const localErrors = createLocalErrors( items );
		items.forEach(
			( { description, weight, hsTariffNumber, price }, index ) => {
				if ( ! description ) {
					localErrors.items[ index ].description = __(
						'This field is required',
						'woocommerce-shipping'
					);
				}
				if ( isNil( weight ) || weight === '' ) {
					localErrors.items[ index ].weight = __(
						'This field is required',
						'woocommerce-shipping'
					);
				} else if ( ! ( parseFloat( weight ) > 0 ) ) {
					localErrors.items[ index ].weight = __(
						'Weight must be greater than zero',
						'woocommerce-shipping'
					);
				}
				if ( isNil( price ) || price === '' ) {
					localErrors.items[ index ].price = __(
						'This field is required',
						'woocommerce-shipping'
					);
				} else if ( ! ( parseFloat( price ) > 0 ) ) {
					localErrors.items[ index ].price = __(
						'Declared value must be greater than zero',
						'woocommerce-shipping'
					);
				}

				const shouldValidateHSTariffNumber = isCountryInEU( country )
					? true
					: Boolean( hsTariffNumber );
				if (
					shouldValidateHSTariffNumber &&
					! isHSTariffNumberValid( hsTariffNumber ) &&
					localErrors?.items?.[ index ]
				) {
					localErrors.items[ index ].hsTariffNumber = __(
						'The tariff number must be between 6 and 12 digits long',
						'woocommerce-shipping'
					);
				}
				return errors;
			}
		);

		return {
			errors: {
				...errors,
				...localErrors,
			},
			values: { items, ...rest },
		};
	};
