import React from 'react';
import { ExternalLink, Notice, RadioControl } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import PaymentMethod from './payment-method';
import { settingsStore } from 'data/settings';
import { createInterpolateElement } from '@wordpress/element';

const PaymentCard = () => {
	const addPaymentMethodURL =
		useSelect( settingsStore ).getAddPaymentMethodURL();
	const paymentMethods = useSelect( ( select ) => {
		const storePaymentMethods = select( settingsStore ).getPaymentMethods();
		/**
		 * Decorate the ID to be string so that it works with WP component
		 * https://developer.wordpress.org/block-editor/reference-guides/components/radio-control/#options-label-string-value-string
		 */
		return storePaymentMethods?.map( ( paymentMethod ) => {
			return {
				...paymentMethod,
				payment_method_id: paymentMethod.payment_method_id.toString(),
			};
		} );
	} );
	const getSelectedPaymentMethodId = useSelect( ( select ) => {
		/**
		 * Decorate the selected payment method ID to be string so that it works with wordpress component.
		 * https://developer.wordpress.org/block-editor/reference-guides/components/radio-control/#options-label-string-value-string
		 */
		const storeSelectedPaymentMethodId =
			select( settingsStore ).getSelectedPaymentMethod();
		return storeSelectedPaymentMethodId?.toString();
	} );

	const updateFormData = async ( formInputKey, formInputvalue ) => {
		await dispatch( settingsStore ).updateFormData(
			formInputKey,
			formInputvalue
		);
	};

	const paymentMethodSelectHandler = ( value ) => {
		// Store expects payment method ID to be int, to match the API.
		updateFormData( 'selected_payment_method_id', parseInt( value, 10 ) );
	};

	if ( paymentMethods.length === 0 ) {
		return (
			<Notice status="warning" isDismissible={ false }>
				{ createInterpolateElement(
					__(
						'No card found. To purchase shipping labels, <link>add a credit card.</link>',
						'woocommerce-shipping'
					),
					{
						link: (
							<ExternalLink href={ addPaymentMethodURL }>
								{ __(
									'Choose another card',
									'woocommerce-shipping'
								) }
							</ExternalLink>
						),
					}
				) }
			</Notice>
		);
	}

	return (
		<>
			<h4>{ __( 'Payment', 'woocommerce-shipping' ) }</h4>
			<RadioControl
				label={ '' }
				help={ createInterpolateElement(
					__(
						"We'll charge the credit card on your account to pay for the labels you print. <link/>",
						'woocommerce-shipping'
					),
					{
						link: (
							<ExternalLink href={ addPaymentMethodURL }>
								{ __(
									'Choose another card',
									'woocommerce-shipping'
								) }
							</ExternalLink>
						),
					}
				) }
				selected={ getSelectedPaymentMethodId }
				options={ paymentMethods
					.map( ( paymentMethod ) => ( {
						component: (
							<PaymentMethod
								type={ paymentMethod.card_type }
								cardName={ paymentMethod.name }
								paymentMethodId={
									paymentMethod.payment_method_id
								}
								cardDigits={ paymentMethod.card_digits }
								expiry={ paymentMethod.expiry }
							/>
						),
						id: paymentMethod.payment_method_id,
					} ) )
					.reduce(
						( accu, curr ) => [
							...accu,
							{
								label: curr.component,
								value: curr.id,
							},
						],
						[]
					) }
				onChange={ ( value ) => paymentMethodSelectHandler( value ) }
				className="wcshipping-radio-control"
			/>
		</>
	);
};

export default PaymentCard;
