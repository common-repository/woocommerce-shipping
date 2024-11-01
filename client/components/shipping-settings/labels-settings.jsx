import clsx from 'clsx';
import PaymentCard from './payment-card';
import ExternalInfo from './external-info';
import {
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Flex,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import { dispatch, select } from '@wordpress/data';
import { useSettings } from 'data/settings/hooks';
import { settingsStore } from 'data/settings';
import { getPaperSizes } from 'components/label-purchase/label';
import { getStoreOrigin } from 'utils/location';

export const LabelsSettingsComponent = () => {
	const [ isLoading, setIsLoading ] = useState( false );
	const paperSizes = getPaperSizes( getStoreOrigin().country );
	const {
		labelSize,
		emailReceiptEnabled,
		rememberServiceEnabled,
		rememberPackageEnabled,
		checkoutAddressValidation,
		storeOwnerUsername,
		storeOwnerLogin,
		storeOwnerEmail,
	} = useSettings();

	const updateFormData = async ( formInputKey, formInputvalue ) => {
		await dispatch( settingsStore ).updateFormData(
			formInputKey,
			formInputvalue
		);
		maybeConfirmExit( true );
	};

	const maybeConfirmExit = ( isChanged ) => {
		if ( isChanged ) {
			window.onbeforeunload = function () {
				return true;
			};
		} else {
			window.onbeforeunload = '';
		}
	};

	const getLabelSizeOptions = () => {
		const sizes = [];
		sizes.push( {
			disabled: true,
			label: __( 'Select an Option', 'woocommerce-shipping' ),
			value: '',
		} );

		paperSizes.map( ( size ) => {
			return sizes.push( {
				label: size.name,
				value: size.key,
			} );
		} );
		return sizes;
	};

	//TODO: These variables are the name in the redux store. Should these be hidden from the component and move into actions?
	const labelSizeSelectHandler = ( value ) => {
		updateFormData( 'paper_size', value );
	};
	const emailReceiptCheckboxHandler = ( value ) => {
		updateFormData( 'email_receipts', value );
	};
	const rememberServiceCheckboxHandler = ( value ) => {
		updateFormData( 'use_last_service', value );
	};
	const rememberPackageCheckboxHandler = ( value ) => {
		updateFormData( 'use_last_package', value );
	};
	const rememberCheckoutAddressValidationCheckboxHandler = ( value ) => {
		updateFormData( 'checkout_address_validation', value );
	};

	const saveButtonHandler = async () => {
		setIsLoading( true );
		const storeConfig = select( settingsStore ).getConfigSettings();
		const saveResult = await dispatch( settingsStore ).saveSettings( {
			payload: storeConfig,
		} );

		if ( saveResult.result.success ) {
			await dispatch( 'core/notices' ).createSuccessNotice(
				__(
					'WooCommerce Shipping settings have been saved.',
					'woocommerce-shipping'
				)
			);
		}

		setIsLoading( false );
		maybeConfirmExit( false );
	};

	const className = clsx( 'wcshipping-settings__card', {
		loading: isLoading,
	} );

	return (
		<Flex
			align="flex-start"
			gap={ 6 }
			justify="flex-start"
			className="wcshipping-settings"
		>
			{ isLoading && (
				<Spinner className="wcshipping-settings__spinner" />
			) }

			<Flex direction="column">
				<Spacer marginTop={ 6 } marginBottom={ 0 } />
				<Heading level={ 4 }>
					{ __( 'Shipping Labels', 'woocommerce-shipping' ) }
				</Heading>
				<Text>
					{ __(
						'Print shipping labels right from your WooCommerce dashboard and instantly save on shipping.',
						'woocommerce-shipping'
					) }
				</Text>
			</Flex>
			<Flex direction="column">
				<Card className={ className } size="large">
					<CardBody>
						<h4>
							{ __(
								'Select label size',
								'woocommerce-shipping'
							) }
						</h4>
						<Spacer marginTop={ 0 } marginBottom={ 4 } />
						<SelectControl
							label={ __( 'Paper size', 'woocommerce-shipping' ) }
							value={ labelSize }
							help={ __(
								'This setting determines the default printing size for shipping labels. You can select different sizes both during the purchase of a shipping label and afterward.',
								'woocommerce-shipping'
							) }
							onChange={ ( value ) =>
								labelSizeSelectHandler( value )
							}
							options={ getLabelSizeOptions() }
						/>
						<PaymentCard />
						<ExternalInfo />

						<h4>{ __( 'Preferences', 'woocommerce-shipping' ) }</h4>

						<CheckboxControl
							label={ __(
								'Email label purchase receipts',
								'woocommerce-shipping'
							) }
							help={ sprintf(
								// translators: %s is the store owner's username, %s is the store owner's login, %s is the store owner's email address.
								__(
									`Email the label purchase receipts to %1$s (%2$s) at %3$s`,
									'woocommerce-shipping'
								),
								storeOwnerUsername,
								storeOwnerLogin,
								storeOwnerEmail
							) }
							checked={ emailReceiptEnabled }
							onChange={ ( value ) =>
								emailReceiptCheckboxHandler( value )
							}
						/>

						<CheckboxControl
							label={ __(
								'Remember service selection',
								'woocommerce-shipping'
							) }
							help={ __(
								'Save the service selection from previous transaction.',
								'woocommerce-shipping'
							) }
							checked={ rememberServiceEnabled }
							onChange={ ( value ) =>
								rememberServiceCheckboxHandler( value )
							}
						/>

						<CheckboxControl
							label={ __(
								'Remember package selection',
								'woocommerce-shipping'
							) }
							help={ __(
								'Save the package selection from previous transaction.',
								'woocommerce-shipping'
							) }
							checked={ rememberPackageEnabled }
							onChange={ ( value ) =>
								rememberPackageCheckboxHandler( value )
							}
						/>

						<CheckboxControl
							label={ __(
								'Enable address validation at checkout',
								'woocommerce-shipping'
							) }
							help={ __(
								'Give your customers the chance to validate their shipping address before they complete their purchase.',
								'woocommerce-shipping'
							) }
							checked={ checkoutAddressValidation }
							onChange={ ( value ) =>
								rememberCheckoutAddressValidationCheckboxHandler( value )
							}
						/>
					</CardBody>
				</Card>
				<Spacer marginTop={ 0 } marginBottom={ 1 } />
				<Flex justify="flex-end" className="submit">
					<Button variant="primary" onClick={ saveButtonHandler }>
						{ __( 'Save changes', 'woocommerce-shipping' ) }
					</Button>
				</Flex>
			</Flex>
		</Flex>
	);
};
