import React, { JSX } from 'react';
import { isEmpty } from 'lodash';
import { useSelect } from '@wordpress/data';
import {
	__experimentalDivider as Divider,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	Animate,
	Flex,
	FlexBlock,
	Notice,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { getCurrentOrder } from 'utils';
import { labelPurchaseStore } from 'data/label-purchase';
import { Items } from 'components/label-purchase/items';
import { Packages } from 'components/label-purchase/packages';
import { ShipmentDetails } from 'components/label-purchase/details';
import { Hazmat } from './hazmat';
import { ShippingRates } from './shipping-service';
import { useLabelPurchaseContext } from './context';
import { Customs } from './customs';
import { PurchaseNotice } from './label';
import { PaymentButtons } from './purchase';
import { RefundedNotice } from './label/refunded-notice';
import { NoRatesAvailable } from './shipping-service/no-rates-available';
import { LABEL_PURCHASE_STATUS } from 'data/constants';
import { PurchaseErrorNotice } from './purchase/purchase-error-notice';

interface ShipmentContentProps {
	items: unknown[];
	children?: string | JSX.Element | JSX.Element[] | boolean;
}

export const ShipmentContent = ( {
	items,
	children,
}: ShipmentContentProps ): JSX.Element => {
	const order = getCurrentOrder();

	const {
		labels: {
			hasPurchasedLabel,
			hasRequestedRefund,
			getCurrentShipmentLabel,
		},
		customs: { isCustomsNeeded },
		shipment: { currentShipmentId, getShipmentDestination },
		rates: { isFetching },
		packages: { isCustomPackageTab },
		hazmat: { getShipmentHazmat },
	} = useLabelPurchaseContext();
	const availableRates = useSelect(
		( select ) =>
			select( labelPurchaseStore ).getRatesForShipment(
				currentShipmentId
			),
		[ currentShipmentId ]
	);

	return (
		<Flex
			className="label-purchase-modal__content"
			direction={ [ 'column', 'row' ] }
			expanded={ true }
			wrap={ true }
			gap={ 12 }
			align="flex-start"
		>
			<FlexBlock className="shipment-items">
				{ hasPurchasedLabel( false ) &&
					getCurrentShipmentLabel()?.status !==
						LABEL_PURCHASE_STATUS.PURCHASE_ERROR && (
						<>
							<PurchaseNotice />
							<Divider margin="12" />
						</>
					) }
				<PurchaseErrorNotice label={ getCurrentShipmentLabel() } />
				{ hasRequestedRefund() && ! hasPurchasedLabel() && (
					<>
						<RefundedNotice />
						<Spacer marginBottom="12" />
					</>
				) }

				<Flex className="items-header">
					<Heading level={ 3 }>
						{ __( 'Items', 'woocommerce-shipping' ) }
					</Heading>
					{ children }
				</Flex>
				<Flex
					className="label-purchase-list-items"
					direction="column"
					expanded={ true }
				>
					<Items orderItems={ items } />
				</Flex>
				{ Boolean( getCurrentShipmentLabel()?.isLegacy ) === false && (
					<Flex className="label-purchase-hazmat">
						<Hazmat />
					</Flex>
				) }
				{ isCustomsNeeded() &&
					Boolean( getCurrentShipmentLabel()?.isLegacy ) ===
						false && (
						<>
							<Divider margin="12" />
							<Customs key={ currentShipmentId } />
							<Divider margin="12" />
						</>
					) }
				{ ! hasPurchasedLabel( false ) && (
					<>
						{ ! isCustomsNeeded() && <Divider margin="12" /> }
						<Packages />
						<Divider margin="12" />
						{ ! Boolean( availableRates ) && (
							<Animate
								type={ isFetching ? 'loading' : undefined }
							>
								{ ( { className } ) => (
									<NoRatesAvailable className={ className } />
								) }
							</Animate>
						) }
						{ availableRates && isEmpty( availableRates ) && (
							<Animate
								type={ isFetching ? 'loading' : undefined }
							>
								{ ( { className } ) => (
									<Notice
										status="info"
										isDismissible={ false }
										className={ className }
									>
										<p>
											{ sprintf(
												// translators: %1$s: HAZMAT part, %2$s: package part
												__(
													'No shipping rates were found based on the combination of %1$s%2$s and the total shipment weight.',
													'woocommerce-shipping'
												),
												getShipmentHazmat().isHazmat
													? __(
															'the selected HAZMAT category, ',
															'woocommerce-shipping'
													  )
													: '',
												isCustomPackageTab()
													? __(
															'the package type, package dimensions',
															'woocommerce-shipping'
													  )
													: __(
															'the selected package',
															'woocommerce-shipping'
													  )
											) }
										</p>
										<p>
											{ sprintf(
												// translators: %1$s: HAZMAT part, %2$s: package part
												__(
													`We couldn't find a shipping service for the combination of %1$s%2$s and the total shipment weight. Please adjust your input and try again.`,
													'woocommerce-shipping'
												),
												getShipmentHazmat().isHazmat
													? __(
															'the selected HAZMAT category, ',
															'woocommerce-shipping'
													  )
													: '',
												isCustomPackageTab()
													? __(
															'selected package type, package dimensions',
															'woocommerce-shipping'
													  )
													: __(
															'the selected package',
															'woocommerce-shipping'
													  )
											) }
										</p>
									</Notice>
								) }
							</Animate>
						) }

						{ Boolean( availableRates ) &&
							! isEmpty( availableRates ) &&
							( isFetching ? (
								<Animate type="loading">
									{ ( { className } ) => (
										<ShippingRates
											availableRates={ availableRates }
											isFetching={ isFetching }
											className={ className }
										/>
									) }
								</Animate>
							) : (
								<ShippingRates
									availableRates={ availableRates }
									isFetching={ isFetching }
								/>
							) ) }
					</>
				) }
			</FlexBlock>
			<FlexBlock>
				<ShipmentDetails
					order={ order }
					destinationAddress={ getShipmentDestination() }
				/>
				<PaymentButtons order={ order } />
			</FlexBlock>
		</Flex>
	);
};
