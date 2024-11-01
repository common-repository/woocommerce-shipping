import React from 'react';
import {
	__experimentalSpacer as Spacer,
	Button,
	Dropdown,
	Flex,
	MenuItemsChoice,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { memo, useCallback, useEffect, useState } from '@wordpress/element';
import { dispatch, select as selectData, useSelect } from '@wordpress/data';
import { labelPurchaseStore } from 'data/label-purchase';
import { Conditional } from 'components/HOC';
import { CustomPackage, Package } from 'types';
import { TemplateRow } from './saved-templates/template-row';
import { NoSavedTemplates } from './saved-templates/no-saved-templates';
import { useLabelPurchaseContext } from '../../context';
import { FetchNotice } from './fetch-notice';
import { TotalWeight } from '../../total-weight';
import { GetRatesButton } from '../../get-rates-button';
import {
	getAvailableCarrierPackages,
	getSelectedCarrierIdFromPackage,
	recordEvent,
} from 'utils';
import { withBoundary } from 'components/HOC/error-boundary';
import { usePackageState } from '../../hooks';
import { ConfirmPackageDeletion } from './saved-templates/confirm-package-deletion';
import { DELETION_EVENTS, trackPackageDeletion } from '../utils';

interface SavedTemplatesProps {
	savedPackages: Package[] | CustomPackage[];
	selectedPackage:
		| ReturnType<
				ReturnType< typeof usePackageState >[ 'getSelectedPackage' ]
		  >
		| ReturnType<
				ReturnType< typeof usePackageState >[ 'getCustomPackage' ]
		  >;
	setSelectedPackage:
		| ReturnType< typeof usePackageState >[ 'setSelectedPackage' ];
}

export const SavedTemplates = withBoundary(
	Conditional(
		( forwardedProps: Record< string, unknown > ) => {
			const savedPackages = useSelect(
				( select ) => select( labelPurchaseStore ).getSavedPackages(),
				[]
			);
			return {
				render: savedPackages.length === 0,
				props: { ...forwardedProps, savedPackages },
			};
		},
		NoSavedTemplates,
		memo(
			( {
				savedPackages,
				selectedPackage,
				setSelectedPackage,
			}: SavedTemplatesProps ) => {
				const {
					rates: { isFetching, fetchRates, errors },
					customs: { hasErrors: hasCustomsErrors },
					hazmat: { isHazmatSpecified },
					packages: { isSelectedASavedPackage, getPackageForRequest },
					weight: { getShipmentTotalWeight },
				} = useLabelPurchaseContext();
				const [ deletablePackage, setDeletablePackage ] = useState<
					Package | CustomPackage | false
				>( false );

				const [ isDeletingPackage, setIsDeletingPackage ] =
					useState( false );

				const isGetRatesButtonDisabled = Boolean(
					! selectedPackage ||
						isFetching ||
						Boolean( errors.totalWeight ) ||
						hasCustomsErrors() ||
						! isHazmatSpecified() ||
						! getShipmentTotalWeight()
				);

				const onConfirmPackageDeletion = async (
					pkg: Package | CustomPackage
				) => {
					setIsDeletingPackage( true );
					trackPackageDeletion( DELETION_EVENTS.CONFIRMED, pkg );

					if ( pkg.isUserDefined ) {
						await dispatch(
							labelPurchaseStore
						).deleteCustomPackage( pkg.id );
						setIsDeletingPackage( false );
						setDeletablePackage( false );
						return;
					}

					const carrierId = getSelectedCarrierIdFromPackage(
						getAvailableCarrierPackages(),
						pkg.id
					);

					if ( ! carrierId ) {
						setIsDeletingPackage( false );
						return;
					}

					const predefinedPackages = selectData(
						labelPurchaseStore
					).getPredefinedPackages( carrierId ) as string[];

					await dispatch( labelPurchaseStore ).updateFavoritePackages(
						{
							[ carrierId ]: predefinedPackages.filter(
								( p ) => p !== pkg.id
							),
						}
					);

					setIsDeletingPackage( false );
					setDeletablePackage( false );
				};

				const onDeletePackage = ( pkg: Package | CustomPackage ) => {
					setDeletablePackage( pkg );
				};

				const onCancelDeletion = () => {
					if ( deletablePackage ) {
						trackPackageDeletion(
							DELETION_EVENTS.CANCELLED,
							deletablePackage
						);
					}

					setDeletablePackage( false );
				};

				const options = savedPackages.map( ( pkg ) => ( {
					label: (
						<TemplateRow
							pkg={ pkg }
							key={ pkg.name + pkg.id }
							isBusy={ isFetching }
							deletePackage={ onDeletePackage }
						/>
					),
					value: pkg.id,
				} ) );

				const getOptionById = useCallback(
					( current: string ) =>
						savedPackages.find(
							( option ) => option.id === current
						)!,
					[ savedPackages ]
				);

				const select = useCallback(
					( id: string ) => {
						setSelectedPackage( getOptionById( id ) );
					},
					[ getOptionById, setSelectedPackage ]
				);

				const getRates = useCallback( () => {
					/**
					 * getPackageForRequest fills isLetter for custom packages
					 */
					const selectedPackageForTracks = getPackageForRequest();
					const tracksProperties = {
						package_id: selectedPackageForTracks?.id,
						is_letter: selectedPackageForTracks?.isLetter,
						width: selectedPackageForTracks?.width,
						height: selectedPackageForTracks?.height,
						length: selectedPackageForTracks?.length,
						template_name: selectedPackageForTracks?.name,
						is_saved_template: true,
					};
					recordEvent(
						'label_purchase_get_rates_clicked',
						tracksProperties
					);
					if ( selectedPackage ) {
						fetchRates( selectedPackage );
					}
				}, [ selectedPackage, fetchRates, getPackageForRequest ] );

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
					<>
						<label htmlFor="saved-templates">
							{ __( 'Package template', 'woocommerce-shipping' ) }
						</label>
						<Dropdown
							className="saved-templates"
							contentClassName="saved-template-options"
							popoverProps={ {
								placement: 'bottom-start',
								noArrow: false,
								resize: true,
								shift: true,
								inline: true,
							} }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									onClick={ onToggle }
									aria-expanded={ isOpen }
									variant="secondary"
									icon={ chevronDown }
									className="saved-template__toggle"
									disabled={ isFetching }
									aria-disabled={ isFetching }
								>
									{ ! selectedPackage ||
									! isSelectedASavedPackage() ? (
										__(
											'Please select',
											'woocommerce-shipping'
										)
									) : (
										<section>
											<TemplateRow
												pkg={ selectedPackage }
												isBusy={ isFetching }
											/>
										</section>
									) }
								</Button>
							) }
							renderContent={ ( { onToggle } ) => (
								<MenuItemsChoice
									// @ts-ignore-next-line - TS nags about Element being set for label value which is wrongly defined as string on the type
									choices={ options }
									onSelect={ ( value: string ) => {
										select( value );
										onToggle();
									} }
									value={ selectedPackage?.name ?? '' }
								/>
							) }
						/>
						<Spacer marginTop={ 4 } marginBottom={ 0 } />
						<Flex align="flex-end" gap={ 6 }>
							<TotalWeight
								packageWeight={ Number(
									selectedPackage?.boxWeight ?? '0'
								) }
							/>

							<GetRatesButton
								onClick={ getRates }
								isBusy={ isFetching }
								disabled={ isGetRatesButtonDisabled }
							/>
						</Flex>
						<FetchNotice />
						{ deletablePackage && (
							<ConfirmPackageDeletion
								pkg={ deletablePackage }
								onDelete={ onConfirmPackageDeletion }
								close={ onCancelDeletion }
								isBusy={ isDeletingPackage }
							/>
						) }
					</>
				);
			}
		)
	)
)( 'SavedTemplates' );
