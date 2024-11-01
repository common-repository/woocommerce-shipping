import React, { Fragment, isValidElement } from 'react';
import {
	__experimentalDivider as Divider,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	Button,
	Flex,
	FlexBlock,
	Notice,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasLabelExpired } from 'utils';
import { useLabelPurchaseContext } from '../context';
import { PaperSizeSelector } from '../paper-size';
import { SchedulePickup } from './schedule-pickup';
import { TrackShipment } from './track-shipment';
import { RefundShipment } from './refund-shipment';
import { withBoundary } from 'components/HOC';
import { CommercialInvoice } from './commercial-invoice';
import { LegacyWarning } from './legacy-warning';

export const PurchaseNotice = withBoundary( () => {
	const {
		labels: {
			printLabel,
			isPurchasing,
			isUpdatingStatus,
			isPrinting,
			isRefunding,
			hasPurchasedLabel,
			updatePurchaseStatus,
			getCurrentShipmentLabel,
			labelStatusUpdateErrors,
		},
	} = useLabelPurchaseContext();

	const initiatePrint = async () => {
		await printLabel( true );
	};

	const selectedLabel = getCurrentShipmentLabel();
	const refreshStatus = async () => {
		if ( ! selectedLabel ) {
			return;
		}
		await updatePurchaseStatus( selectedLabel.labelId );
	};

	let purchaseResultTitleText = __(
		'There was an issue processing your purchase',
		'woocommerce-shipping'
	);

	if ( hasPurchasedLabel() && labelStatusUpdateErrors.length === 0 ) {
		purchaseResultTitleText = __(
			'Your shipping label is ready to print',
			'woocommerce-shipping'
		);
	}

	return (
		<>
			<Heading level={ 3 }>
				{ isPurchasing || isUpdatingStatus
					? __(
							'Please wait while we process your shipping label purchase',
							'woocommerce-shipping'
					  )
					: purchaseResultTitleText }
			</Heading>
			<Spacer margin={ 7 } />
			<Notice
				status={ hasPurchasedLabel() ? 'success' : 'warning' }
				className="purchase-notice"
				isDismissible={ false }
				spokenMessage={
					/**
					 * We need to override the default spoken message so that the children are not conditionally rendered via a hook.
					 * Conditional hooks are not allowed in React and cause an error.
					 */
					__(
						'You have successfully requested to purchase a shipping label.',
						'woocommerce-shipping'
					)
				}
			>
				<Flex direction="column">
					<p>
						{ hasPurchasedLabel()
							? __(
									'From here you can print the shipping label again or change the paper size of the label.',
									'woocommerce-shipping'
							  )
							: __(
									'You have purchased a label, but the purchase status is still pending. Please wait a few minutes and refresh the purchase status. If the status is still pending, please contact support.',
									'woocommerce-shipping'
							  ) }
					</p>
					<FlexBlock className="purchase-notice-actions">
						<Flex gap={ 2 } justify="flex-start">
							<PaperSizeSelector
								disabled={
									isPurchasing ||
									isUpdatingStatus ||
									isPrinting
								}
							/>
							{ hasPurchasedLabel() && (
								<Tooltip
									placement="top"
									text={
										hasLabelExpired( selectedLabel )
											? __(
													'Label images older than 180 days are deleted by our technology partners for general security and data privacy concerns.',
													'woocommerce-shipping'
											  )
											: ''
									}
								>
									<Button
										variant="primary"
										onClick={ initiatePrint }
										isBusy={ isPrinting }
										aria-busy={ isPrinting }
										disabled={
											isPurchasing ||
											isUpdatingStatus ||
											isPrinting ||
											hasLabelExpired( selectedLabel )
										}
									>
										{ __(
											'Print shipping label',
											'woocommerce-shipping'
										) }
									</Button>
								</Tooltip>
							) }
							{ ! hasPurchasedLabel() && (
								<Button
									variant="secondary"
									onClick={ refreshStatus }
									isBusy={ isPurchasing || isUpdatingStatus }
									aria-busy={
										isPurchasing || isUpdatingStatus
									}
									disabled={
										isPurchasing || isUpdatingStatus
									}
								>
									{ __(
										'Refresh purchase status',
										'woocommerce-shipping'
									) }
								</Button>
							) }
						</Flex>
						<Spacer marginBottom="4" />
						{ hasPurchasedLabel() && (
							<Flex justify="flex-start">
								{ [
									<TrackShipment
										key="track-shipment"
										label={ selectedLabel }
									/>,
									<SchedulePickup
										key="schedule-pickup"
										selectedLabel={ selectedLabel }
									/>,
									<CommercialInvoice
										key="commercial-invoice"
										label={ selectedLabel }
									/>,
									<RefundShipment
										key="refund-shipment"
										label={ selectedLabel }
										isBusy={ isRefunding }
										isDisabled={
											isRefunding ||
											isPurchasing ||
											isUpdatingStatus
										}
									/>,
								].map( ( btn, index ) => (
									<Fragment key={ index }>
										{ isValidElement( btn ) &&
											index !== 0 && (
												<Divider
													orientation="vertical"
													margin="0"
												/>
											) }
										{ btn }
									</Fragment>
								) ) }
							</Flex>
						) }
						{ ! hasPurchasedLabel() &&
							labelStatusUpdateErrors &&
							labelStatusUpdateErrors.length > 0 && (
								<Notice
									status="error"
									isDismissible={ false }
									className="purchase-error-notice"
								>
									{ labelStatusUpdateErrors.map(
										( message, index ) => (
											<p key={ index }>{ message }</p>
										)
									) }
								</Notice>
							) }
					</FlexBlock>
				</Flex>
				{ selectedLabel?.isLegacy && <LegacyWarning /> }
			</Notice>
			<Flex>
				<p className="label-purchase-note">
					{ __(
						'Note: Reusing a printed label is a violation of our terms of service and may result in criminal charges.',
						'woocommerce-shipping'
					) }
				</p>
			</Flex>
		</>
	);
} )( 'PurchaseNotice' );
