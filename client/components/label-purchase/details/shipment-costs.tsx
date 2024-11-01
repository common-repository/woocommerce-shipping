import React from 'react';
import { __experimentalText as Text, BaseControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { isEmpty } from 'lodash';

import { Label, Rate } from 'types';
import { signatureTypeToTitle } from 'utils';
import { useLabelPurchaseContext } from '../context';

interface ShipmentCostsProps {
	selectedRate: { rate: Rate; parent: Rate | null } | null | undefined;
	label: Label | undefined;
	hasPurchasedLabel: boolean;
}

export const ShipmentCosts = ( {
	selectedRate,
	label,
	hasPurchasedLabel,
}: ShipmentCostsProps ) => {
	const { storeCurrency } = useLabelPurchaseContext();

	let subTotal = selectedRate?.parent
		? selectedRate?.parent?.rate
		: selectedRate?.rate?.rate;

	if ( label?.isLegacy ) {
		subTotal = label.rate;
	}

	let subTotalLabel =
		( selectedRate?.parent
			? sprintf(
					// translators: %s is the parent rate title
					__( '%s (base fee)', 'woocommerce-shipping' ),
					selectedRate?.parent?.title
			  )
			: selectedRate?.rate?.title ) ??
		__( 'Subtotal', 'woocommerce-shipping' );

	const extraCosts =
		( selectedRate?.rate?.rate ?? 0 ) - ( selectedRate?.parent?.rate ?? 0 );

	if ( label?.isLegacy ) {
		subTotal = label.rate;
		subTotalLabel = label.serviceName;
	}

	return (
		<>
			<BaseControl id="sub-total" label={ subTotalLabel }>
				{ Boolean( subTotal ) && (
					<Text>{ storeCurrency.formatAmount( subTotal! ) }</Text>
				) }
				{ ! Boolean( selectedRate ) && ! hasPurchasedLabel && (
					<div className="cost-placeholder" />
				) }
			</BaseControl>
			{ Boolean( selectedRate?.parent ) && (
				<BaseControl
					id="sub-total-extra"
					label={
						<>
							<span className="subtotal-extra-bit" />
							{ signatureTypeToTitle( selectedRate?.rate.type ) }
						</>
					}
				>
					<Text>{ storeCurrency.formatAmount( extraCosts ) }</Text>
				</BaseControl>
			) }
			<BaseControl
				id="total"
				label={
					<strong>{ __( 'Total', 'woocommerce-shipping' ) }</strong>
				}
			>
				{ ( ! isEmpty( selectedRate ) || ! isEmpty( label ) ) && (
					<Text weight={ 600 }>
						{ storeCurrency.formatAmount(
							selectedRate?.rate.rate ?? label?.rate ?? 0
						) }
					</Text>
				) }

				{ ! Boolean( selectedRate ) && ! hasPurchasedLabel && (
					<div className="cost-placeholder" />
				) }
			</BaseControl>
		</>
	);
};
