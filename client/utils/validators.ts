import { __ } from '@wordpress/i18n';
import {
	ACCEPTED_USPS_ORIGIN_COUNTRIES,
	createLocalErrors,
	createValidationResult,
	hasStates,
	US_MILITARY_STATES,
} from 'utils';
import {
	AddressValidationInput,
	CamelCaseType,
	LocationResponse,
	OriginAddress,
} from 'types';
import { isEmail } from '@wordpress/url';

/**
 * Validates required fields for an address, but leaves email and phone validation to other validators.
 */

export const validateRequiredFields =
	( isCrossBorderShipment: boolean ) =>
	< T extends CamelCaseType< LocationResponse > >( {
		values,
		errors,
	}: AddressValidationInput< T > ): AddressValidationInput< T > => {
		const localErrors = createLocalErrors();

		const errorMessages: Partial< {
			[ K in keyof AddressValidationInput< T >[ 'errors' ] ]: string;
		} > = {
			address: __(
				'Please provide a valid address.',
				'woocommerce-shipping'
			),
			city: __( 'Please provide a valid city.', 'woocommerce-shipping' ),
			postcode: __(
				'Please provide a valid postal code.',
				'woocommerce-shipping'
			),
			country: __(
				'Please provide a valid country.',
				'woocommerce-shipping'
			),
		};

		if ( isCrossBorderShipment ) {
			errorMessages.email = __(
				"Email address can't be empty for this address.",
				'woocommerce-shipping'
			);

			errorMessages.phone = __(
				"Phone number can't be empty for this address.",
				'woocommerce-shipping'
			);
		}

		Object.entries( values ).forEach( ( [ key, value ] ) => {
			const errorMessage = errorMessages[ key as keyof OriginAddress ];
			if ( ! value && errorMessage ) {
				localErrors[ key as keyof OriginAddress ] = errorMessage;
			}
		} );

		// Either name or company is required.
		if ( ! values.name && ! values.company ) {
			localErrors.name = localErrors.company = __(
				'Please provide a valid name or company name.',
				'woocommerce-shipping'
			);
		}

		return createValidationResult( values, errors, localErrors );
	};

export const validatePostalCode = ( {
	values,
	errors,
}: AddressValidationInput ) => {
	const localErrors = createLocalErrors();

	const { postcode, country } = values;
	if (
		ACCEPTED_USPS_ORIGIN_COUNTRIES.includes( country ) &&
		! /^\d{5}(?:-\d{4})?$/.test( postcode )
	) {
		localErrors.postcode = __(
			'Invalid postal code format',
			'woocommerce-shipping'
		);
	}
	return createValidationResult( values, errors, localErrors );
};

export const validateCountryAndState = ( {
	values,
	errors,
}: AddressValidationInput ) => {
	const localErrors = createLocalErrors();

	const { country, state } = values;
	if ( ! state && hasStates( country ) ) {
		localErrors.state = __(
			'Please provide a valid state.',
			'woocommerce-shipping'
		);
	}

	return createValidationResult( values, errors, localErrors );
};

export const validateDestinationPhone =
	( originCountry: string ) =>
	( { values, errors }: AddressValidationInput ) => {
		const localErrors = createLocalErrors();
		const { phone, country, state } = values;
		const shouldValidateUSPhone =
			originCountry === country &&
			country === 'US' &&
			US_MILITARY_STATES.includes( state );

		if ( shouldValidateUSPhone && ! phone ) {
			localErrors.phone = __(
				'A destination address phone number is required for this shipment.',
				'woocommerce-shipping'
			);
		} else if (
			shouldValidateUSPhone &&
			phone.split( /\D+/g ).join( '' ).replace( /^1/, '' ).length !== 10
		) {
			localErrors.phone = __(
				'Customs forms require a 10-digit phone number. ' +
					'Please edit your phone number so it has at most 10 digits.',
				'woocommerce-shipping'
			);
		}
		return createValidationResult( values, errors, localErrors );
	};

export const validatePhone = ( {
	values,
	errors,
}: AddressValidationInput ): AddressValidationInput => {
	const localErrors = createLocalErrors();

	const { phone } = values;

	if (
		! phone ||
		phone.split( /\D+/g ).join( '' ).replace( /^1/, '' ).length !== 10
	) {
		localErrors.phone = __(
			'Please provide a valid phone number.',
			'woocommerce-shipping'
		);
	}
	return createValidationResult( values, errors, localErrors );
};

export const validateEmail = ( {
	values,
	errors,
}: AddressValidationInput ): AddressValidationInput => {
	const localErrors = createLocalErrors();
	if ( values.email && ! isEmail( values.email ) ) {
		localErrors.email = __(
			'Please, enter a valid email address.',
			'woocommerce-shipping'
		);
	}

	return createValidationResult( values, errors, localErrors );
};
