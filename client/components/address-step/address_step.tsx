import React from 'react';
import { isEmpty } from 'lodash';

import { Button, Flex, FlexItem, Modal } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { dispatch, useSelect } from '@wordpress/data';
import { Form } from '@woocommerce/components';

import { AddressFields } from './fields';
import { AddressSuggestion } from './suggestion';
import { AddressVerifiedIcon } from '../address-verified-icon';
import {
	createLocalErrors,
	isMailAndPhoneRequired,
	validateCountryAndState,
	validateDestinationPhone,
	validateEmail,
	validatePhone,
	validatePostalCode,
	validateRequiredFields,
} from 'utils';
import { AddressContextProvider } from './context';
import { ADDRESS_TYPES } from 'data/constants';
import {
	AddressTypes,
	CamelCaseType,
	Destination,
	LocationResponse,
	OriginAddress,
} from 'types';
import { addressStore } from 'data/address';
import { withBoundary } from 'components/HOC';

interface AddressStepProps< T = Destination > {
	type: AddressTypes;
	address: T;
	onCompleteCallback: ( address: T ) => void;
	onCancelCallback?: () => void;
	orderId?: string; // order id is only needed when dealing with destination address
	isAdd: boolean; // if the form is used to add an address
	originCountry?: string; // origin country is only needed for destination address for validations
}

export const AddressStep = withBoundary(
	< T extends CamelCaseType< LocationResponse > >( {
		type,
		address,
		onCompleteCallback,
		onCancelCallback,
		isAdd = false,
		orderId,
		originCountry,
	}: AddressStepProps< T > ) => {
		const [ isSuggestionModalOpen, setIsSuggestionModalOpen ] =
			useState( false );
		const [ isUpdating, setIsUpdating ] = useState( false );
		const [ isConfirming, setIsConfirming ] = useState( false );
		const [ isComplete, setIsComplete ] = useState( false );
		const [ warningMessage, setWarningMessage ] = useState(
			__( 'Unvalidated address', 'woocommerce-shipping' )
		);

		// Assert that order id is provided for destination address
		if ( type === ADDRESS_TYPES.DESTINATION && ! orderId ) {
			throw new Error( 'Order id is required for destination address' );
		}

		if ( isAdd && type === ADDRESS_TYPES.DESTINATION ) {
			throw new Error( 'Destination address cannot be added' );
		}

		const validateAddressSection = ( values: T ) => {
			const validatables = [
				{
					values,
					errors: createLocalErrors(),
					type,
				},
			]
				.map( ( validatable ) =>
					validateRequiredFields(
						isMailAndPhoneRequired( {
							type,
							originCountry,
							destinationCountry: validatable.values.country,
						} )
					)< T >( validatable )
				)
				.map( validateCountryAndState )
				.map( validateEmail )
				.map( validatePostalCode )
				.map( ( validatable ) => {
					if ( type === ADDRESS_TYPES.DESTINATION && originCountry ) {
						return validateDestinationPhone( originCountry )(
							validatable
						);
					}
					return [ validatable ]
						.map( validateEmail )
						.map( validatePhone )[ 0 ];
				} );

			return validatables[ 0 ].errors;
		};

		const validationErrors = useSelect(
			( select ) => select( addressStore ).getFormErrors( type ),
			[ type ]
		);
		const submittedAddress = useSelect(
			( select ) => select( addressStore ).getSubmittedAddress( type ),
			[ type ]
		);
		const isVerified = useSelect(
			( select ) => select( addressStore ).getIsAddressVerified( type ),
			[ type ]
		);
		const normalizedAddress = useSelect(
			( select ) => select( addressStore ).getNormalizedAddress( type ),
			[ type ]
		);

		const needsConfirmation = useSelect(
			( select ) =>
				select( addressStore ).getAddressNeedsConfirmation( type ),
			[ type ]
		);

		const normalizeAddress = async ( values: T ) => {
			setIsUpdating( true );
			await dispatch( addressStore ).normalizeAddress(
				{
					address: {
						...values,
						address1: values.address ?? '',
						address2: '',
					},
				},
				type
			);
			setIsUpdating( false );
		};

		const updateAddress = async ( isNormalizedAddress: boolean ) => {
			setIsSuggestionModalOpen( false );
			setIsUpdating( true );

			if ( normalizedAddress && submittedAddress ) {
				normalizedAddress.email = submittedAddress.email;
				normalizedAddress.phone = submittedAddress.phone;
			}

			const selectedAddress = isNormalizedAddress
				? normalizedAddress
				: submittedAddress;
			if ( ! selectedAddress ) {
				// eslint-disable-next-line no-console
				console.warn(
					`No address to update for ${ type }, address: ${ selectedAddress }`
				);
				return;
			}

			if ( isAdd ) {
				await dispatch( addressStore ).addOriginAddress(
					selectedAddress as OriginAddress // Only origin address can be added
				);
			} else {
				await dispatch( addressStore ).updateShipmentAddress(
					{
						orderId: orderId ?? '',
						address: selectedAddress,
						isVerified: true, // Either the address is verified or the normalized address is selected
					},
					type
				);
			}

			setIsUpdating( false );
			setIsConfirming( false );
			setIsComplete( true );
		};

		const returnFromSuggestion = () => {
			setIsSuggestionModalOpen( false );
			setIsConfirming( false );
		};

		useEffect( () => {
			if ( needsConfirmation && ! isConfirming ) {
				setIsConfirming( true );
				setIsSuggestionModalOpen( true );
				dispatch( addressStore ).resetAddressNormalizationResponse(
					type
				);
			}
		}, [ needsConfirmation, isConfirming, type ] );

		useEffect( () => {
			if ( isComplete && isEmpty( validationErrors ) ) {
				onCompleteCallback( address );
			}

			if ( ! isEmpty( validationErrors ) ) {
				setIsComplete( false );
			}
		}, [ address, isComplete, validationErrors, onCompleteCallback ] );

		const isSubmitButtonDisabled = ( {
			isDirty,
			isValidForm,
		}: {
			isValidForm: boolean;
			isDirty: boolean;
		} ): boolean => {
			/**
			 * We should always allow unverified addresses to be submitted.
			 * We allow it so the user can always get feedback about what they need to do next to complete address
			 * verification.
			 */
			if ( ! isVerified ) {
				return false;
			}

			/**
			 * Disallow incomplete forms from being submitted since our inline error messages will inform users about
			 * what they need to do as next steps before sending a request.
			 */
			if ( ! isValidForm ) {
				return true;
			}

			/**
			 * We should allow the form to be submitted if there are any changes to the form.
			 */
			return ! isDirty;
		};

		return (
			<div>
				<Form< T >
					validate={ validateAddressSection }
					initialValues={ address }
					onSubmit={ normalizeAddress }
				>
					{
						// @ts-ignore - function as child is not recognized by the Form component typings
						( {
							isValidForm,
							handleSubmit,
							isDirty,
						}: {
							isValidForm: boolean;
							handleSubmit: () => void;
							isDirty: boolean;
						} ) => (
							<>
								<AddressContextProvider
									initialValue={ {
										isUpdating,
										validationErrors,
									} }
								>
									<p>
										{ __(
											"Please complete all required fields and click the 'Validate and save' button below to confirm and validate your address details.",
											'woocommerce-shipping'
										) }
									</p>
									<AddressFields
										group={ type }
										errorCallback={ setWarningMessage }
										originCountry={ originCountry }
									/>
								</AddressContextProvider>
								<Flex justify="space-between" as="footer">
									<AddressVerifiedIcon
										isVerified={ isVerified }
										isFormChanged={ isDirty }
										isFormValid={ isValidForm }
										errorMessage={ warningMessage }
										addressType={ ADDRESS_TYPES.ORIGIN }
									/>
									<FlexItem>
										<Flex gap={ 2 }>
											<Button
												onClick={ onCancelCallback }
												isBusy={ isUpdating }
												variant="tertiary"
											>
												{ __(
													'Cancel',
													'woocommerce-shipping'
												) }
											</Button>
											<Button
												onClick={ handleSubmit }
												disabled={ isSubmitButtonDisabled(
													{
														isValidForm,
														isDirty,
													}
												) }
												isBusy={ isUpdating }
												variant="primary"
											>
												{ __(
													'Validate and save',
													'woocommerce-shipping'
												) }
											</Button>
										</Flex>
									</FlexItem>
								</Flex>
							</>
						)
					}
				</Form>
				{ isSuggestionModalOpen &&
					submittedAddress &&
					normalizedAddress && (
						<Modal
							className="address-suggestion-modal"
							onRequestClose={ returnFromSuggestion }
							focusOnMount
							shouldCloseOnClickOutside={ false }
							title={ __( 'Confirm address' ) }
						>
							<AddressSuggestion
								originalAddress={ submittedAddress }
								normalizedAddress={ normalizedAddress }
								editAddress={ returnFromSuggestion }
								confirmAddress={ updateAddress }
								errors={ validationErrors }
							></AddressSuggestion>
						</Modal>
					) }
			</div>
		);
	}
)( 'AddressStep' );
