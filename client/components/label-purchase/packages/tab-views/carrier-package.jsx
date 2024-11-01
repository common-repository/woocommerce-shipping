import {
	__experimentalSpacer as Spacer,
	Flex,
	TabPanel,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from '@wordpress/element';
import {
	getAvailableCarrierPackages,
	getSelectedCarrierIdFromPackage,
} from 'utils';
import { Conditional, withBoundary } from 'components/HOC';
import { CARRIER_ID_TO_NAME } from '../constants';
import { Packages } from './carrier-package/packages';
import { CarrierIcon } from '../../../carrier-icon';
import { FetchNotice } from './fetch-notice';
import { TotalWeight } from '../../total-weight';
import { GetRatesButton } from '../../get-rates-button';
import { useLabelPurchaseContext } from '../../context';
import { recordEvent } from 'utils/tracks';

export const CarrierPackage = withBoundary(
	Conditional(
		( forwardedProps ) => {
			const availablePackages = getAvailableCarrierPackages();
			return {
				render: Object.keys( availablePackages ).length === 0,
				props: { ...forwardedProps, availablePackages },
			};
		},
		() => (
			<p>
				{ __(
					'No carrier packages available',
					'woocommerce-shipping'
				) }
			</p>
		),
		( { availablePackages, selectedPackage, setSelectedPackage } ) => {
			const {
				rates: { fetchRates, isFetching, errors },
				customs: { hasErrors: hasCustomsErrors },
				hazmat: { isHazmatSpecified },
				weight: { getShipmentTotalWeight },
			} = useLabelPurchaseContext();

			const tabs = Object.keys( availablePackages ).map(
				( carrierId ) => ( {
					name: carrierId,
					icon: (
						<>
							<CarrierIcon carrier={ carrierId } />
							{ CARRIER_ID_TO_NAME[ carrierId ] }
						</>
					),
				} )
			);

			const isGetRatesButtonDisabled =
				! selectedPackage ||
				isFetching ||
				errors.totalWeight ||
				hasCustomsErrors() ||
				! isHazmatSpecified() ||
				! getShipmentTotalWeight();
			const getRates = useCallback( () => {
				const tracksProperties = {
					package_id: selectedPackage?.id,
					is_letter: selectedPackage?.isLetter,
					width: selectedPackage?.width,
					height: selectedPackage?.height,
					length: selectedPackage?.length,
				};
				recordEvent(
					'label_purchase_get_rates_clicked',
					tracksProperties
				);
				fetchRates( selectedPackage );
			}, [ selectedPackage, fetchRates ] );

			const selectedCarrierId = selectedPackage
				? getSelectedCarrierIdFromPackage(
						availablePackages,
						selectedPackage.id
				  )
				: null;

			/**
			 * Automatically get rates on load when a package when all the
			 * conditions for enabling the get rates button are met.
			 */
			useEffect( () => {
				if ( ! isGetRatesButtonDisabled ) {
					getRates();
				}
				// We only want to run this effect once on mount.
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [] );

			return (
				<TabPanel
					className="carrier-package-tabs"
					tabs={ tabs }
					initialTabName={ selectedCarrierId ?? tabs[ 0 ].name }
					children={ ( { name: carrierId } ) => {
						return (
							<>
								<Packages
									packages={ availablePackages[ carrierId ] }
									carrierId={ carrierId }
									selectedPackage={ selectedPackage }
									setSelectedPackage={ setSelectedPackage }
								/>
								<Spacer marginTop={ 6 } />
								<Flex align="flex-end" gap={ 6 }>
									<TotalWeight
										packageWeight={
											selectedPackage?.boxWeight ?? 0
										}
									/>
									<GetRatesButton
										onClick={ getRates }
										isBusy={ isFetching }
										disabled={ isGetRatesButtonDisabled }
									/>
								</Flex>
								<FetchNotice margin="before" />
							</>
						);
					} }
				/>
			);
		}
	)
)( 'CarrierPackage' );
